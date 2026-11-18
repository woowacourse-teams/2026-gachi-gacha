"""Guard the frontend-only, build-off-EC2 deployment contract without PyYAML."""

from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[3]
WORKFLOWS = ROOT / ".github" / "workflows"
TEST_COMMAND = "python3 -B -m unittest discover -s scripts/deployment -p 'test_*.py'"


class WorkflowContractTests(unittest.TestCase):
    def workflows(self):
        for filename, branch, label, environment, domain in (
            (
                "frontend-deploy.yml",
                "frontend-dev",
                "frontend-dev",
                "frontend-development",
                "dev.gachigacha.kro.kr",
            ),
            (
                "frontend-prod-deploy.yml",
                "main",
                "frontend-prod",
                "frontend-production",
                "gachigacha.kro.kr",
            ),
        ):
            text = (WORKFLOWS / filename).read_text(encoding="utf-8")
            build, deploy = text.split("\n  deploy:\n", 1)
            yield filename, branch, label, environment, domain, text, build, deploy

    def test_only_frontend_pushes_trigger_deploy(self):
        for filename, branch, _, _, _, text, _, _ in self.workflows():
            with self.subTest(workflow=filename):
                trigger = text.split("\npermissions:", 1)[0]
                self.assertIn(f"    branches:\n      - {branch}\n", trigger)
                paths = re.findall(r'^      - "(.+)"$', trigger, re.MULTILINE)
                self.assertEqual(paths, ["frontend/**", "!frontend/**/AGENTS.md"])
                self.assertNotIn("workflow_dispatch", trigger)
                self.assertNotIn("pull_request", trigger)

    def test_install_and_build_only_run_on_github(self):
        for filename, _, label, _, _, _, build, deploy in self.workflows():
            with self.subTest(workflow=filename):
                self.assertIn("    runs-on: ubuntu-latest\n", build)
                self.assertIn("    timeout-minutes: 20\n", build)
                self.assertIn("persist-credentials: false", build)
                self.assertIn("pnpm install --frozen-lockfile", build)
                self.assertIn("run: pnpm build", build)
                self.assertIn(TEST_COMMAND, build)
                self.assertIn("      - self-hosted\n", deploy)
                self.assertIn("      - Linux\n", deploy)
                self.assertIn("      - ARM64\n", deploy)
                self.assertIn(f"      - {label}\n", deploy)
                self.assertIn("    timeout-minutes: 5\n", deploy)
                self.assertIn("    needs: build\n", deploy)
                for forbidden in (
                    "checkout@",
                    "setup-node@",
                    "pnpm",
                    "npm ",
                    "node_modules",
                    "secrets.",
                    "run: pnpm build",
                ):
                    self.assertNotIn(forbidden, deploy)

    def test_pnpm_is_pinned_and_not_bootstrapped(self):
        for filename, _, _, _, _, _, build, _ in self.workflows():
            with self.subTest(workflow=filename):
                self.assertNotIn("pnpm/action-setup", build)
                self.assertIn("node-version-file: frontend/.nvmrc", build)
                self.assertIn('mktemp -d "${RUNNER_TEMP:?}/gachi-pnpm.XXXXXX"', build)
                self.assertIn("timeout --kill-after=10s 120s npm install", build)
                self.assertIn("pnpm@11.9.0", build)
                self.assertIn('--version)" = "11.9.0"', build)
                self.assertIn("--ignore-scripts", build)
                self.assertLess(build.index("pnpm@11.9.0"), build.index("cache: pnpm"))

    def test_environment_configuration_remains_separate(self):
        shared = {
            "SENTRY_ENABLED": "${{ vars.SENTRY_ENABLED }}",
            "SENTRY_DSN": "${{ vars.SENTRY_DSN }}",
            "SENTRY_ORG": "${{ vars.SENTRY_ORG }}",
            "SENTRY_PROJECT": "${{ vars.SENTRY_PROJECT }}",
            "SENTRY_AUTH_TOKEN": "${{ secrets.SENTRY_AUTH_TOKEN }}",
            "SENTRY_RELEASE": "${{ github.sha }}",
            "AFFILIATE_CATALOG_ENABLED": "${{ vars.AFFILIATE_CATALOG_ENABLED || 'true' }}",
            "EVENT_APPLICATION_ENABLED": "${{ vars.EVENT_APPLICATION_ENABLED }}",
            "EVENT_APPLICATION_ENDPOINT": "${{ vars.EVENT_APPLICATION_ENDPOINT }}",
            "EVENT_APPLICATION_START_AT": "${{ vars.EVENT_APPLICATION_START_AT }}",
            "EVENT_APPLICATION_BANNER_START_AT": "${{ vars.EVENT_APPLICATION_BANNER_START_AT }}",
            "EVENT_APPLICATION_END_AT": "${{ vars.EVENT_APPLICATION_END_AT }}",
            "EVENT_APPLICATION_CAMPAIGN_ID": "${{ vars.EVENT_APPLICATION_CAMPAIGN_ID }}",
            "MEMBER_REPORT_ENDPOINT": "${{ vars.MEMBER_REPORT_ENDPOINT }}",
        }
        for filename, branch, _, environment, _, _, build, deploy in self.workflows():
            with self.subTest(workflow=filename):
                expected = dict(shared)
                if branch == "main":
                    expected.update(
                        APP_ENV="production",
                        KAKAO_MAP_KEY="${{ vars.PROD_KAKAO_MAP_KEY }}",
                        POSTHOG_API_HOST="${{ vars.POSTHOG_API_HOST }}",
                        POSTHOG_API_KEY="${{ vars.POSTHOG_API_KEY }}",
                        POSTHOG_ENABLED="${{ vars.POSTHOG_ENABLED }}",
                    )
                else:
                    expected.update(
                        APP_ENV="development",
                        KAKAO_MAP_KEY="${{ vars.DEV_KAKAO_MAP_KEY }}",
                        POSTHOG_ENABLED='"false"',
                    )
                for key, value in expected.items():
                    self.assertIn(f"          {key}: {value}\n", build)
                self.assertIn(f"      name: {environment}\n", build)
                self.assertIn(f"      name: {environment}\n", deploy)

    def test_only_static_site_and_helper_are_uploaded(self):
        for filename, _, label, _, _, _, build, _ in self.workflows():
            with self.subTest(workflow=filename):
                self.assertIn("test -s dist/index.html", build)
                self.assertIn("find dist -type f -name '*.map' -delete", build)
                self.assertIn('tar -C dist -czf "$gachi_package/site.tar.gz" .', build)
                self.assertIn('cp scripts/deployment/deploy.py "$gachi_package/deploy.py"', build)
                self.assertIn("uses: actions/upload-artifact@v7.0.2", build)
                self.assertIn(
                    f"name: {label}-${{{{ github.sha }}}}-${{{{ github.run_id }}}}-${{{{ github.run_attempt }}}}",
                    build,
                )
                self.assertIn("path: ${{ runner.temp }}/frontend-artifact/", build)
                self.assertIn("if-no-files-found: error", build)
                self.assertIn("compression-level: 0", build)
                self.assertIn("retention-days: 1", build)

    def test_download_is_bound_to_current_build_and_verified(self):
        for filename, _, _, _, _, _, build, deploy in self.workflows():
            with self.subTest(workflow=filename):
                for output, source in (
                    ("artifact-id", "upload"),
                    ("archive-sha256", "package"),
                    ("helper-sha256", "package"),
                ):
                    self.assertIn(f"{output}: ${{{{ steps.{source}.outputs.{output} }}}}", build)
                self.assertIn("uses: actions/download-artifact@v8.0.2", deploy)
                self.assertIn("artifact-ids: ${{ needs.build.outputs.artifact-id }}", deploy)
                self.assertIn("digest-mismatch: error", deploy)
                self.assertNotIn("run-id:", deploy)
                self.assertNotIn("repository:", deploy)
                self.assertIn("${{ runner.temp }}/frontend-deploy-${{ github.run_id }}-${{ github.run_attempt }}", deploy)
                self.assertIn('[[ "$HELPER_SHA256" =~ ^[a-f0-9]{64}$ ]]', deploy)
                self.assertLess(deploy.index("sha256sum --check --strict -"), deploy.index("python3 -B deploy.py"))
                self.assertIn('--sha256 "$ARCHIVE_SHA256"', deploy)

    def test_deployment_target_and_permissions_are_explicit(self):
        for filename, branch, label, _, domain, text, _, deploy in self.workflows():
            with self.subTest(workflow=filename):
                self.assertIn("permissions:\n  contents: read\n", text)
                self.assertIn("cancel-in-progress: false", text)
                self.assertIn("GITHUB_TOKEN: ${{ github.token }}", deploy)
                self.assertIn(f"--deploy-root /srv/gachi-gacha/{label}", deploy)
                self.assertIn(f"--domain {domain}", deploy)
                self.assertIn(f'--repository "$GITHUB_REPOSITORY" --branch {branch}', deploy)
                self.assertIn('--commit "$GITHUB_SHA"', deploy)
                self.assertNotIn("systemctl", deploy)
                self.assertNotIn("sudo", deploy)

    def test_quality_also_checks_deployment_contract(self):
        text = (WORKFLOWS / "frontend-quality.yml").read_text(encoding="utf-8")
        self.assertIn(TEST_COMMAND, text)
        self.assertIn('      - "frontend/**"', text)
        self.assertIn('      - "!frontend/**/AGENTS.md"', text)


if __name__ == "__main__":
    unittest.main()
