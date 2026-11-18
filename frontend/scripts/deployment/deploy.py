#!/usr/bin/env python3
"""Deploy a verified static artifact without installing or building on EC2."""

import argparse
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import stat
import subprocess
import sys
import tarfile
import tempfile
import urllib.error
import urllib.request
import uuid


MAX_EXPANDED_BYTES = 1024 * 1024 * 1024
MAX_MEMBERS = 20000
DISK_RESERVE = 256 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024
MAX_API_BYTES = 1024 * 1024
SHA_PATTERN = re.compile(r"[a-f0-9]{40}\Z")
TARGETS = {
    "frontend-dev": (
        "/srv/gachi-gacha/frontend-dev",
        "dev.gachigacha.kro.kr",
        "frontend-deploy.yml",
    ),
    "main": (
        "/srv/gachi-gacha/frontend-prod",
        "gachigacha.kro.kr",
        "frontend-prod-deploy.yml",
    ),
}


class DeploymentError(Exception):
    """A failed safety check or deployment operation."""


def validate_options(args):
    if args.branch not in TARGETS:
        raise DeploymentError("Unsupported deployment branch")
    root, domain, _ = TARGETS[args.branch]
    if args.deploy_root != root or args.domain != domain:
        raise DeploymentError("Deployment branch, directory and domain do not match")
    if not SHA_PATTERN.fullmatch(args.commit):
        raise DeploymentError("Invalid commit SHA")
    if not re.fullmatch(r"[a-f0-9]{64}", args.sha256):
        raise DeploymentError("Invalid archive checksum")
    for value in (args.run_id, args.run_attempt):
        if not re.fullmatch(r"[1-9][0-9]*", str(value)):
            raise DeploymentError("Invalid workflow run identity")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", args.repository):
        raise DeploymentError("Invalid repository")


def require_real_directory(path):
    path = Path(path)
    if not path.is_absolute():
        raise DeploymentError("Deployment directory must be absolute")
    for ancestor in reversed((path,) + tuple(path.parents)):
        try:
            mode = ancestor.lstat().st_mode
        except OSError as error:
            raise DeploymentError("Deployment directory does not exist") from error
        if not stat.S_ISDIR(mode):
            raise DeploymentError("Deployment directory must not contain symlinks")


def read_current(root):
    root = Path(root)
    current = root / "current"
    if not current.is_symlink():
        raise DeploymentError("Current release must be an existing symlink")
    value = Path(os.readlink(current))
    target = Path(os.path.abspath(value if value.is_absolute() else root / value))
    if target.parent != root / "releases":
        raise DeploymentError("Current release must be a direct child of releases")
    require_real_directory(target)
    index = target / "index.html"
    try:
        info = index.lstat()
    except OSError as error:
        raise DeploymentError("Current release has no index.html") from error
    if not stat.S_ISREG(info.st_mode) or info.st_size == 0:
        raise DeploymentError("Current release index.html must be a nonempty regular file")
    return target


def verify_sha256(fileobj, expected):
    fileobj.seek(0)
    digest = hashlib.sha256()
    for chunk in iter(lambda: fileobj.read(CHUNK_SIZE), b""):
        digest.update(chunk)
    if digest.hexdigest() != expected:
        raise DeploymentError("Archive checksum does not match the build output")
    fileobj.seek(0)


def inspect_archive(archive):
    members = []
    paths = set()
    expanded_bytes = 0
    has_index = False
    for count, member in enumerate(archive, start=1):
        if count > MAX_MEMBERS:
            raise DeploymentError("Archive contains too many entries")
        name = member.name
        if (
            name.startswith("/")
            or "\\" in name
            or any(ord(character) < 32 or ord(character) == 127 for character in name)
        ):
            raise DeploymentError("Archive contains an unsafe path")
        parts = tuple(part for part in name.split("/") if part not in ("", "."))
        if any(part.startswith(".") for part in parts):
            raise DeploymentError("Archive contains a hidden or traversing path")
        if not parts:
            if member.isdir() and name in (".", "./"):
                if Path(".") in paths:
                    raise DeploymentError("Archive contains a duplicate root entry")
                paths.add(Path("."))
                continue
            raise DeploymentError("Archive contains an empty path")
        relative = Path(*parts)
        if relative in paths:
            raise DeploymentError("Archive contains a duplicate path")
        paths.add(relative)
        if not (member.isfile() or member.isdir()) or member.sparse is not None:
            raise DeploymentError("Archive contains a link or unsupported entry")
        if relative.suffix.lower() == ".map":
            raise DeploymentError("Source maps must not be deployed")
        if member.size < 0 or (member.isdir() and member.size != 0):
            raise DeploymentError("Archive contains an invalid entry size")
        expanded_bytes += member.size
        if expanded_bytes > MAX_EXPANDED_BYTES:
            raise DeploymentError("Archive expanded size exceeds the deployment limit")
        if relative == Path("index.html"):
            has_index = member.isfile() and member.size > 0
        members.append((member, relative))
    if not has_index:
        raise DeploymentError("Archive needs a nonempty index.html")
    return members


def extract_archive(archive, members, destination):
    destination = Path(destination)
    for member, relative in members:
        path = destination / relative
        if member.isdir():
            path.mkdir(parents=True, exist_ok=True)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            source = archive.extractfile(member)
            if source is None:
                raise DeploymentError("Archive entry cannot be read")
            with source, path.open("xb") as output:
                shutil.copyfileobj(source, output, CHUNK_SIZE)
            if path.stat().st_size != member.size:
                raise DeploymentError("Archive entry size does not match")
            path.chmod(0o644)
    for directory, _, _ in os.walk(destination):
        Path(directory).chmod(0o755)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fileobj, code, message, headers, new_url):
        raise DeploymentError("GitHub API redirects are not accepted")


def github_json(repository, suffix):
    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        raise DeploymentError("GitHub token is required for the stale release check")
    request = urllib.request.Request(
        "https://api.github.com/repos/" + repository + suffix,
        headers={
            "Authorization": "Bearer " + token,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "gachigacha-frontend-artifact-deploy",
        },
    )
    try:
        # Avoid forwarding the bearer token through environment-configured proxies.
        opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}), NoRedirect()
        )
        with opener.open(request, timeout=10) as response:
            payload = response.read(MAX_API_BYTES + 1)
        if len(payload) > MAX_API_BYTES:
            raise DeploymentError("GitHub API response exceeds the size limit")
        result = json.loads(payload)
    except (OSError, ValueError, urllib.error.URLError) as error:
        raise DeploymentError("GitHub API check failed; current release is unchanged") from error
    if not isinstance(result, dict):
        raise DeploymentError("Invalid GitHub API response")
    return result


def checked_sha(value):
    if not isinstance(value, str) or not SHA_PATTERN.fullmatch(value):
        raise DeploymentError("Invalid GitHub object SHA")
    return value


def branch_head(repository, branch):
    result = github_json(repository, "/git/ref/heads/" + branch)
    reference = result.get("object")
    if not isinstance(reference, dict) or reference.get("type") != "commit":
        raise DeploymentError("GitHub branch does not point to a commit")
    return checked_sha(reference.get("sha"))


def tree_entry(repository, tree_sha, name, expected_type):
    result = github_json(repository, "/git/trees/" + checked_sha(tree_sha))
    if result.get("truncated") is not False or not isinstance(result.get("tree"), list):
        raise DeploymentError("GitHub tree response is missing or truncated")
    matches = [
        entry
        for entry in result["tree"]
        if isinstance(entry, dict) and entry.get("path") == name
    ]
    if len(matches) != 1 or matches[0].get("type") != expected_type:
        raise DeploymentError("Expected frontend deployment path is missing")
    expected_mode = "040000" if expected_type == "tree" else "100644"
    if matches[0].get("mode") != expected_mode:
        raise DeploymentError("Unexpected GitHub tree entry mode")
    return checked_sha(matches[0].get("sha"))


def frontend_identity(repository, commit, workflow):
    result = github_json(repository, "/git/commits/" + checked_sha(commit))
    tree = result.get("tree")
    if not isinstance(tree, dict):
        raise DeploymentError("GitHub commit tree is missing")
    root_sha = checked_sha(tree.get("sha"))
    frontend_sha = tree_entry(repository, root_sha, "frontend", "tree")
    github_sha = tree_entry(repository, root_sha, ".github", "tree")
    workflows_sha = tree_entry(repository, github_sha, "workflows", "tree")
    workflow_sha = tree_entry(repository, workflows_sha, workflow, "blob")
    return frontend_sha, workflow_sha


def ensure_current_branch(repository, branch, commit):
    if branch not in TARGETS:
        raise DeploymentError("Unsupported deployment branch")
    head = branch_head(repository, branch)
    if head == commit:
        return
    workflow = TARGETS[branch][2]
    if frontend_identity(repository, commit, workflow) != frontend_identity(
        repository, head, workflow
    ):
        raise DeploymentError("Frontend or deployment workflow changed after this build")
    if branch_head(repository, branch) != head:
        raise DeploymentError("Branch changed during the stale release check")
    print("Branch advanced without frontend/deployment changes; artifact remains current")


def replace_current(root, target):
    temporary = Path(root) / (".current-" + uuid.uuid4().hex)
    try:
        temporary.symlink_to(target)
        os.replace(temporary, Path(root) / "current")
    finally:
        if temporary.is_symlink():
            temporary.unlink()


def probe_https(domain, index_path):
    index_path = Path(index_path)
    with tempfile.TemporaryFile() as response:
        result = subprocess.run(
            [
                "curl", "-q", "--fail", "--silent", "--show-error",
                "--noproxy", "*", "--connect-timeout", "3", "--max-time", "10",
                "--max-filesize", str(index_path.stat().st_size),
                "--resolve", domain + ":443:127.0.0.1", "https://" + domain + "/",
            ],
            stdout=response,
            stderr=subprocess.DEVNULL,
            timeout=15,
            check=False,
        )
        if result.returncode != 0:
            raise DeploymentError("Local HTTPS release verification failed")
        response.seek(0)
        with index_path.open("rb") as index:
            while True:
                expected, actual = index.read(CHUNK_SIZE), response.read(CHUNK_SIZE)
                if expected != actual:
                    raise DeploymentError("HTTPS HTML does not match the new release")
                if not expected:
                    break


@contextlib.contextmanager
def deployment_lock(root):
    descriptor = os.open(
        Path(root) / ".artifact-deploy.lock", os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600
    )
    try:
        if not stat.S_ISREG(os.fstat(descriptor).st_mode):
            raise DeploymentError("Deployment lock is not a regular file")
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise DeploymentError("Another artifact deployment is already running") from error
        yield
    finally:
        os.close(descriptor)


def deploy(args):
    root = Path(args.deploy_root)
    releases = root / "releases"
    require_real_directory(releases)
    target = releases / (args.commit + "-" + str(args.run_id) + "-" + str(args.run_attempt))
    stage = None
    activated = False
    with deployment_lock(root):
        previous = read_current(root)
        if os.path.lexists(target):
            raise DeploymentError("This immutable release already exists; do not overwrite it")
        try:
            descriptor = os.open(args.archive, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
            with os.fdopen(descriptor, "rb") as source:
                if not stat.S_ISREG(os.fstat(source.fileno()).st_mode):
                    raise DeploymentError("Artifact archive is not a regular file")
                verify_sha256(source, args.sha256)
                with tarfile.open(fileobj=source, mode="r:gz") as archive:
                    members = inspect_archive(archive)
                    expanded = sum(member.size for member, _ in members)
                    if shutil.disk_usage(releases).free < expanded + DISK_RESERVE:
                        raise DeploymentError("Insufficient disk space for safe extraction")
                    stage = Path(tempfile.mkdtemp(prefix=".artifact-stage-", dir=releases))
                    extract_archive(archive, members, stage)
            os.rename(stage, target)
            stage = None
            ensure_current_branch(args.repository, args.branch, args.commit)
            if read_current(root) != previous:
                raise DeploymentError("Current release changed during artifact preparation")
            # Set before the atomic operation so SIGTERM also rolls back that boundary.
            activated = True
            replace_current(root, target)
            probe_https(args.domain, target / "index.html")
            print("SUCCESS: verified artifact is served over local HTTPS")
            print("Release: " + str(target))
            print("Previous release retained: " + str(previous))
        except BaseException:
            if activated and (root / "current").is_symlink():
                current_value = os.readlink(root / "current")
                if current_value == str(target):
                    replace_current(root, previous)
                    print("Previous release restored; new release retained for investigation", file=sys.stderr)
            raise
        finally:
            # Only the unique temporary directory created by this invocation is removed.
            if stage is not None:
                try:
                    shutil.rmtree(stage)
                except FileNotFoundError:
                    # SIGTERM may arrive between renaming the completed stage and
                    # clearing the variable. The completed release is retained.
                    pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for option in (
        "archive", "sha256", "deploy-root", "commit", "run-id", "run-attempt",
        "domain", "repository", "branch",
    ):
        parser.add_argument("--" + option, required=True)
    args = parser.parse_args()

    def terminate(_signum, _frame):
        raise DeploymentError("Deployment interrupted")

    signal.signal(signal.SIGTERM, terminate)
    try:
        validate_options(args)
        deploy(args)
    except (DeploymentError, OSError, tarfile.TarError, subprocess.SubprocessError) as error:
        print("STOP: " + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
