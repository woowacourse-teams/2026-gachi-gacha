"""Deployment safety tests; all releases, archives and requests are isolated."""

import argparse
import fcntl
import hashlib
import io
from pathlib import Path
import stat
import tarfile
import tempfile
import unittest
from unittest import mock

import deploy


BUILD_SHA = "a" * 40
HEAD_SHA = "b" * 40
REPOSITORY = "example/frontend"


def archive_bytes(entries=None):
    """Entries are (name, bytes, optional tar type, optional link target)."""
    if entries is None:
        entries = [("./index.html", b"<html>new release</html>"),
                   ("./assets/main.js", b"console.info('release');")]
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w:gz") as archive:
        root = tarfile.TarInfo(".")
        root.type = tarfile.DIRTYPE
        archive.addfile(root)
        for entry in entries:
            name, content = entry[:2]
            member = tarfile.TarInfo(name)
            member.type = entry[2] if len(entry) > 2 else tarfile.REGTYPE
            member.mode = 0o777
            member.linkname = entry[3] if len(entry) > 3 else ""
            member.size = len(content) if member.isfile() else 0
            archive.addfile(member, io.BytesIO(content) if member.isfile() else None)
    return output.getvalue()


class ArchiveTests(unittest.TestCase):
    def inspect(self, entries):
        with tarfile.open(fileobj=io.BytesIO(archive_bytes(entries)), mode="r:gz") as archive:
            return deploy.inspect_archive(archive)

    def test_accepts_tar_dot_root_and_regular_static_files(self):
        members = self.inspect([("./index.html", b"page"), ("./assets/main.js", b"js")])
        self.assertEqual([str(path) for _, path in members], ["index.html", "assets/main.js"])

    def test_rejects_unsafe_paths(self):
        for name in ("../escape", "assets/../../escape", "/absolute", "assets\\evil.js", "a\n.js"):
            with self.subTest(name=name), self.assertRaises(deploy.DeploymentError):
                self.inspect([("index.html", b"page"), (name, b"unsafe")])

    def test_rejects_hidden_files_and_source_maps(self):
        for name in (".env", "assets/.secret/file", "assets/main.js.map", "assets/MAIN.JS.MAP"):
            with self.subTest(name=name), self.assertRaises(deploy.DeploymentError):
                self.inspect([("index.html", b"page"), (name, b"private")])

    def test_rejects_links_and_devices(self):
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.CHRTYPE, tarfile.BLKTYPE, tarfile.FIFOTYPE):
            with self.subTest(kind=kind), self.assertRaises(deploy.DeploymentError):
                self.inspect([("index.html", b"page"), ("asset", b"", kind, "index.html")])

    def test_rejects_duplicate_normalized_paths(self):
        with self.assertRaises(deploy.DeploymentError):
            self.inspect([("index.html", b"first"), ("./index.html", b"second")])

    def test_rejects_duplicate_archive_root(self):
        with self.assertRaises(deploy.DeploymentError):
            self.inspect([("./", b"", tarfile.DIRTYPE), ("index.html", b"page")])

    def test_requires_nonempty_root_index(self):
        for entries in ([("assets/index.html", b"page")], [("index.html", b"")]):
            with self.subTest(entries=entries), self.assertRaises(deploy.DeploymentError):
                self.inspect(entries)

    def test_enforces_expanded_size_limit(self):
        with mock.patch.object(deploy, "MAX_EXPANDED_BYTES", 3):
            with self.assertRaises(deploy.DeploymentError):
                self.inspect([("index.html", b"1234")])

    def test_enforces_member_count_limit(self):
        with mock.patch.object(deploy, "MAX_MEMBERS", 2):
            with self.assertRaises(deploy.DeploymentError):
                self.inspect([("index.html", b"page"), ("a.js", b"a"), ("b.js", b"b")])

    def test_checksum_match_and_mismatch(self):
        value = b"archive contents"
        deploy.verify_sha256(io.BytesIO(value), hashlib.sha256(value).hexdigest())
        with self.assertRaises(deploy.DeploymentError):
            deploy.verify_sha256(io.BytesIO(value), "0" * 64)

    def test_extracts_with_safe_readable_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "stage"
            root.mkdir(mode=0o700)
            with tarfile.open(fileobj=io.BytesIO(archive_bytes()), mode="r:gz") as archive:
                deploy.extract_archive(archive, deploy.inspect_archive(archive), root)
            self.assertEqual((root / "index.html").read_bytes(), b"<html>new release</html>")
            self.assertEqual(stat.S_IMODE((root / "index.html").stat().st_mode), 0o644)
            self.assertEqual(stat.S_IMODE((root / "assets").stat().st_mode), 0o755)
            self.assertEqual(stat.S_IMODE(root.stat().st_mode), 0o755)


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.root = self.base / "site"
        self.releases = self.root / "releases"
        self.previous = self.releases / BUILD_SHA
        self.previous.mkdir(parents=True)
        (self.previous / "index.html").write_bytes(b"previous release")
        (self.root / "current").symlink_to(self.previous)
        self.archive = self.base / "site.tar.gz"
        self.archive.write_bytes(archive_bytes())
        self.args = argparse.Namespace(
            archive=str(self.archive), sha256=hashlib.sha256(self.archive.read_bytes()).hexdigest(),
            deploy_root=str(self.root), commit=HEAD_SHA, run_id="123", run_attempt="1",
            domain="example.invalid", repository=REPOSITORY, branch="frontend-dev",
        )
        self.target = self.releases / (HEAD_SHA + "-123-1")
        self.guard = mock.patch.object(deploy, "ensure_current_branch").start()
        self.probe = mock.patch.object(deploy, "probe_https").start()
        self.addCleanup(mock.patch.stopall)

    def assert_previous_preserved(self):
        self.assertEqual((self.root / "current").resolve(), self.previous)
        self.assertEqual((self.previous / "index.html").read_bytes(), b"previous release")

    def test_success_keeps_previous_release_and_activates_unique_target(self):
        deploy.deploy(self.args)
        self.assertEqual((self.root / "current").resolve(), self.target)
        self.assertTrue((self.previous / "index.html").is_file())
        self.assertEqual((self.target / "index.html").read_bytes(), b"<html>new release</html>")
        self.guard.assert_called_once_with(REPOSITORY, "frontend-dev", HEAD_SHA)
        self.probe.assert_called_once()

    def test_refuses_to_overwrite_an_existing_release(self):
        self.target.mkdir()
        (self.target / "sentinel").write_text("keep", encoding="utf-8")
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy(self.args)
        self.assert_previous_preserved()
        self.assertEqual((self.target / "sentinel").read_text(encoding="utf-8"), "keep")

    def test_bad_checksum_does_not_change_current(self):
        self.args.sha256 = "0" * 64
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy(self.args)
        self.assert_previous_preserved()
        self.probe.assert_not_called()

    def test_insufficient_disk_does_not_change_current(self):
        with mock.patch.object(deploy.shutil, "disk_usage", return_value=argparse.Namespace(free=0)):
            with self.assertRaises(deploy.DeploymentError):
                deploy.deploy(self.args)
        self.assert_previous_preserved()

    def test_archive_symlink_is_not_followed(self):
        link = self.base / "link.tar.gz"
        link.symlink_to(self.archive)
        self.args.archive = str(link)
        with self.assertRaises((deploy.DeploymentError, OSError)):
            deploy.deploy(self.args)
        self.assert_previous_preserved()

    def test_fifo_archive_is_rejected_without_waiting_for_a_writer(self):
        fifo = self.base / "archive.fifo"
        deploy.os.mkfifo(fifo)
        self.args.archive = str(fifo)
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy(self.args)
        self.assert_previous_preserved()

    def test_current_must_point_inside_immediate_releases_directory(self):
        foreign = self.base / "foreign"
        foreign.mkdir()
        (foreign / "index.html").write_text("unrelated", encoding="utf-8")
        (self.root / "current").unlink()
        (self.root / "current").symlink_to(foreign)
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy(self.args)
        self.assertEqual((self.root / "current").resolve(), foreign)

    def test_relative_current_link_is_supported(self):
        (self.root / "current").unlink()
        (self.root / "current").symlink_to(Path("releases") / BUILD_SHA)
        deploy.deploy(self.args)
        self.assertEqual((self.root / "current").resolve(), self.target)

    def test_concurrent_deploy_lock_fails_without_switch(self):
        with (self.root / ".artifact-deploy.lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaises((deploy.DeploymentError, BlockingIOError)):
                deploy.deploy(self.args)
        self.assert_previous_preserved()

    def test_stale_branch_failure_leaves_previous_release(self):
        self.guard.side_effect = deploy.DeploymentError("stale frontend")
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy(self.args)
        self.assert_previous_preserved()
        self.probe.assert_not_called()

    def test_https_probe_failure_rolls_back_and_keeps_new_release_for_inspection(self):
        self.probe.side_effect = deploy.DeploymentError("HTML mismatch")
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy(self.args)
        self.assert_previous_preserved()
        self.assertTrue((self.target / "index.html").is_file())

    def test_interruption_during_verification_rolls_back(self):
        self.probe.side_effect = KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):
            deploy.deploy(self.args)
        self.assert_previous_preserved()

    def test_interruption_after_staging_rename_preserves_original_error(self):
        rename = deploy.os.rename

        def rename_then_interrupt(source, destination):
            rename(source, destination)
            raise deploy.DeploymentError("interrupted immediately after rename")

        with mock.patch.object(deploy.os, "rename", side_effect=rename_then_interrupt):
            with self.assertRaisesRegex(deploy.DeploymentError, "immediately after rename"):
                deploy.deploy(self.args)
        self.assert_previous_preserved()
        self.assertTrue((self.target / "index.html").is_file())

    def test_rollback_does_not_clobber_a_concurrently_changed_link(self):
        other = self.releases / ("c" * 40)
        other.mkdir()
        (other / "index.html").write_text("another deployment", encoding="utf-8")

        def changed_by_someone_else(*_):
            deploy.replace_current(self.root, other)
            raise deploy.DeploymentError("probe failed after external switch")

        self.probe.side_effect = changed_by_someone_else
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy(self.args)
        self.assertEqual((self.root / "current").resolve(), other)


class BranchGuardTests(unittest.TestCase):
    def setUp(self):
        self.responses = {
            "/git/ref/heads/frontend-dev": {"object": {"type": "commit", "sha": HEAD_SHA}},
            "/git/commits/" + BUILD_SHA: {"tree": {"sha": "c" * 40}},
            "/git/commits/" + HEAD_SHA: {"tree": {"sha": "d" * 40}},
            "/git/trees/" + "c" * 40: self.tree(("frontend", "tree", "e" * 40), (".github", "tree", "f" * 40)),
            "/git/trees/" + "d" * 40: self.tree(("frontend", "tree", "e" * 40), (".github", "tree", "1" * 40)),
            "/git/trees/" + "f" * 40: self.tree(("workflows", "tree", "2" * 40)),
            "/git/trees/" + "1" * 40: self.tree(("workflows", "tree", "3" * 40)),
            "/git/trees/" + "2" * 40: self.tree(("frontend-deploy.yml", "blob", "4" * 40)),
            "/git/trees/" + "3" * 40: self.tree(("frontend-deploy.yml", "blob", "4" * 40)),
        }

    @staticmethod
    def tree(*entries):
        return {"truncated": False, "tree": [
            {"path": name, "type": kind, "sha": sha, "mode": "040000" if kind == "tree" else "100644"}
            for name, kind, sha in entries
        ]}

    def response(self, repository, suffix):
        self.assertEqual(repository, REPOSITORY)
        return self.responses[suffix]

    def test_exact_head_uses_fast_path(self):
        result = {"object": {"type": "commit", "sha": BUILD_SHA}}
        with mock.patch.object(deploy, "github_json", return_value=result) as request:
            deploy.ensure_current_branch(REPOSITORY, "frontend-dev", BUILD_SHA)
        request.assert_called_once_with(REPOSITORY, "/git/ref/heads/frontend-dev")

    def test_unrelated_commit_allowed_when_frontend_and_deploy_workflow_match(self):
        with mock.patch.object(deploy, "github_json", side_effect=self.response) as request:
            deploy.ensure_current_branch(REPOSITORY, "frontend-dev", BUILD_SHA)
        ref_calls = [call for call in request.call_args_list if call.args[1] == "/git/ref/heads/frontend-dev"]
        self.assertEqual(len(ref_calls), 2)
        self.assertFalse(any("backend" in call.args[1] for call in request.call_args_list))

    def test_frontend_change_rejected(self):
        self.responses["/git/trees/" + "d" * 40] = self.tree(("frontend", "tree", "9" * 40), (".github", "tree", "1" * 40))
        with mock.patch.object(deploy, "github_json", side_effect=self.response):
            with self.assertRaises(deploy.DeploymentError):
                deploy.ensure_current_branch(REPOSITORY, "frontend-dev", BUILD_SHA)

    def test_workflow_change_rejected(self):
        self.responses["/git/trees/" + "3" * 40] = self.tree(("frontend-deploy.yml", "blob", "9" * 40))
        with mock.patch.object(deploy, "github_json", side_effect=self.response):
            with self.assertRaises(deploy.DeploymentError):
                deploy.ensure_current_branch(REPOSITORY, "frontend-dev", BUILD_SHA)

    def test_branch_moving_during_comparison_is_rejected(self):
        ref_count = 0

        def changing_response(repository, suffix):
            nonlocal ref_count
            if suffix == "/git/ref/heads/frontend-dev":
                ref_count += 1
                if ref_count == 2:
                    return {"object": {"type": "commit", "sha": "9" * 40}}
            return self.response(repository, suffix)

        with mock.patch.object(deploy, "github_json", side_effect=changing_response):
            with self.assertRaises(deploy.DeploymentError):
                deploy.ensure_current_branch(REPOSITORY, "frontend-dev", BUILD_SHA)

    def test_api_failure_fails_closed(self):
        with mock.patch.object(deploy, "github_json", side_effect=deploy.DeploymentError("API unavailable")):
            with self.assertRaises(deploy.DeploymentError):
                deploy.ensure_current_branch(REPOSITORY, "frontend-dev", BUILD_SHA)

    def test_truncated_tree_is_rejected(self):
        self.responses["/git/trees/" + "c" * 40]["truncated"] = True
        with mock.patch.object(deploy, "github_json", side_effect=self.response):
            with self.assertRaises(deploy.DeploymentError):
                deploy.ensure_current_branch(REPOSITORY, "frontend-dev", BUILD_SHA)

    def test_missing_or_invalid_frontend_tree_is_rejected(self):
        for entries in ((), (("frontend", "blob", "e" * 40),), (("frontend", "tree", "invalid"),)):
            with self.subTest(entries=entries):
                self.responses["/git/trees/" + "c" * 40] = self.tree(*entries)
                with mock.patch.object(deploy, "github_json", side_effect=self.response):
                    with self.assertRaises(deploy.DeploymentError):
                        deploy.ensure_current_branch(REPOSITORY, "frontend-dev", BUILD_SHA)


class ExternalBoundaryTests(unittest.TestCase):
    def api_response(self, payload):
        opener = mock.Mock()
        opener.open.return_value = io.BytesIO(payload)
        return opener

    def test_api_request_is_authenticated_bounded_and_disables_proxy_redirects(self):
        opener = self.api_response(b'{"ok":true}')
        with mock.patch.dict(deploy.os.environ, {"GITHUB_TOKEN": "test-only-token"}):
            with mock.patch.object(deploy.urllib.request, "build_opener", return_value=opener) as build:
                self.assertEqual(deploy.github_json(REPOSITORY, "/git/ref/heads/main"), {"ok": True})
        request = opener.open.call_args.args[0]
        self.assertEqual(request.full_url, "https://api.github.com/repos/example/frontend/git/ref/heads/main")
        self.assertEqual(request.get_header("Authorization"), "Bearer test-only-token")
        self.assertEqual(opener.open.call_args.kwargs["timeout"], 10)
        self.assertTrue(any(isinstance(handler, deploy.NoRedirect) for handler in build.call_args.args))
        proxies = [handler for handler in build.call_args.args if isinstance(handler, deploy.urllib.request.ProxyHandler)]
        self.assertEqual(proxies[0].proxies, {})

    def test_api_rejects_missing_token_without_network(self):
        with mock.patch.dict(deploy.os.environ, {}, clear=True):
            with mock.patch.object(deploy.urllib.request, "build_opener") as build:
                with self.assertRaises(deploy.DeploymentError):
                    deploy.github_json(REPOSITORY, "/git/ref/heads/main")
        build.assert_not_called()

    def test_api_rejects_invalid_json_nonobject_and_oversized_response(self):
        for payload in (b"not json", b"[]", b"{}" + b" " * deploy.MAX_API_BYTES):
            with self.subTest(payload_length=len(payload)):
                with mock.patch.dict(deploy.os.environ, {"GITHUB_TOKEN": "test-only-token"}):
                    with mock.patch.object(deploy.urllib.request, "build_opener", return_value=self.api_response(payload)):
                        with self.assertRaises(deploy.DeploymentError):
                            deploy.github_json(REPOSITORY, "/git/ref/heads/main")

    def test_api_redirect_is_rejected(self):
        with self.assertRaises(deploy.DeploymentError):
            deploy.NoRedirect().redirect_request(None, None, 302, "redirect", {}, "https://other.invalid/")

    def test_api_transport_error_is_reported_without_request_secrets(self):
        opener = mock.Mock()
        opener.open.side_effect = deploy.urllib.error.URLError("private response text")
        with mock.patch.dict(deploy.os.environ, {"GITHUB_TOKEN": "test-only-token"}):
            with mock.patch.object(deploy.urllib.request, "build_opener", return_value=opener):
                with self.assertRaises(deploy.DeploymentError) as caught:
                    deploy.github_json(REPOSITORY, "/git/ref/heads/main")
        self.assertNotIn("test-only-token", str(caught.exception))
        self.assertNotIn("private response text", str(caught.exception))

    def test_https_probe_checks_exact_html_over_loopback_and_validated_tls(self):
        with tempfile.TemporaryDirectory() as directory:
            index = Path(directory) / "index.html"
            index.write_bytes(b"<html>release</html>")

            def response(command, **kwargs):
                kwargs["stdout"].write(index.read_bytes())
                return argparse.Namespace(returncode=0)

            with mock.patch.object(deploy.subprocess, "run", side_effect=response) as run:
                deploy.probe_https("example.invalid", index)
            command = run.call_args.args[0]
            self.assertIn("example.invalid:443:127.0.0.1", command)
            self.assertIn("https://example.invalid/", command)
            self.assertNotIn("--insecure", command)
            self.assertNotIn("-k", command)
            self.assertEqual(run.call_args.kwargs["timeout"], 15)

    def test_https_probe_rejects_successful_http_with_wrong_html(self):
        with tempfile.TemporaryDirectory() as directory:
            index = Path(directory) / "index.html"
            index.write_bytes(b"new release")

            def response(_command, **kwargs):
                kwargs["stdout"].write(b"old release")
                return argparse.Namespace(returncode=0)

            with mock.patch.object(deploy.subprocess, "run", side_effect=response):
                with self.assertRaises(deploy.DeploymentError):
                    deploy.probe_https("example.invalid", index)

    def test_https_probe_rejects_curl_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            index = Path(directory) / "index.html"
            index.write_bytes(b"release")
            with mock.patch.object(deploy.subprocess, "run", return_value=argparse.Namespace(returncode=22)):
                with self.assertRaises(deploy.DeploymentError):
                    deploy.probe_https("example.invalid", index)


class OptionTests(unittest.TestCase):
    def options(self):
        return argparse.Namespace(
            archive="site.tar.gz", sha256="1" * 64,
            deploy_root="/srv/gachi-gacha/frontend-dev", commit=BUILD_SHA,
            run_id="123", run_attempt="1", domain="dev.gachigacha.kro.kr",
            repository=REPOSITORY, branch="frontend-dev",
        )

    def test_accepts_matching_dev_and_prod_targets(self):
        args = self.options()
        deploy.validate_options(args)
        args.branch = "main"
        args.domain = "gachigacha.kro.kr"
        args.deploy_root = "/srv/gachi-gacha/frontend-prod"
        deploy.validate_options(args)

    def test_rejects_invalid_or_cross_environment_options(self):
        for key, value in (
            ("branch", "android"), ("deploy_root", "/srv/gachi-gacha/frontend-prod"),
            ("domain", "gachigacha.kro.kr"), ("commit", "HEAD"),
            ("sha256", "invalid"), ("run_id", "0"), ("run_attempt", "../2"),
            ("repository", "example/frontend?redirect=other"),
        ):
            with self.subTest(key=key, value=value):
                args = self.options()
                setattr(args, key, value)
                with self.assertRaises(deploy.DeploymentError):
                    deploy.validate_options(args)


if __name__ == "__main__":
    unittest.main()
