# GachiGacha frontend contribution rules

These rules apply to frontend work in this directory, not to agents working on backend or other areas of the shared repository.

## Scope and safety

- Work only in `frontend/` or repository-level documentation and workflow files required by an authorized frontend task.
- Never modify `backend/`, create commits for backend code, or comment on/review backend pull requests.
- Keep frontend-specific restrictions in `frontend/AGENTS.md`. Never place them in a repository-root `AGENTS.md` or other shared instructions that could constrain backend contributors or their agents.
- Android tasks follow the separate `android/AGENTS.md` on the `android` branch; do not move those rules into shared repository instructions.
- Frontend CI/CD automatic triggers must be scoped to `frontend/**` changes and exclude `frontend/**/AGENTS.md`. Backend-only, Android-only, and shared-document/workflow-only changes must not trigger frontend builds or deployments.
- Do not discard or overwrite another contributor's uncommitted changes. Use an isolated worktree when the current workspace is dirty or on another task.
- Do not merge into `main` unless the user explicitly requests that specific merge. Frontend feature and fix work targets `frontend-dev`.

## Standard workflow

1. Read the relevant issue and repository templates.
2. Create a GitHub issue before implementation when the user requests the usual issue/PR workflow.
3. Create a branch containing the issue number.
4. Implement the smallest scoped change and add proportional tests.
5. Run formatting, lint, type checking, focused tests, and a production build when relevant.
6. Open a pull request against the requested development branch and merge only when explicitly authorized.

## Mandatory skill usage

- For any Sentry setup, implementation, filtering, grouping, alerting, quota, privacy, or incident-triage work, use `$gachigacha-sentry-operations` first.
- Follow the skill's task-based routing and read only the reference needed for the current Sentry decision. Do not load every Sentry reference by default.
- `$korean-technical-writing` is opt-in only. Use it only when the user explicitly says `테크니컬 라이팅으로 해줘` or directly invokes the skill. Do not infer activation from ordinary documentation, report, Wiki, Notion, proofreading, or Markdown requests.

## Naming conventions

- Issue titles use the repository templates, such as `[FEAT] ...`, `[BUG] ...`, and `[REFACTOR] ...`.
- Branch names use lowercase type and issue number, for example `feat/123-affiliate-drag`, `fix/124-auth-callback`, or `docs/125-pr-rules`.
- Commit messages follow Angular commit syntax. Keep the lowercase English type and optional scope, then write the description in Korean: `feat(frontend): 제휴 카탈로그에 마우스 드래그 탐색을 추가한다`, `fix(auth): OAuth 반환 경로에서 토큰을 제거한다`, or `docs: Sentry 운영 절차를 문서화한다`.
- Use an Angular type appropriate to the change: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `style`, or `revert`.
- Normal pull request titles use an uppercase type in square brackets followed by a concise Korean description, for example `[FEAT] 제휴 카탈로그에 마우스 드래그 탐색을 추가한다` or `[FIX] 연속 탐색 후 카탈로그가 사라지는 문제를 수정한다`.
- Use `[FEAT]`, `[FIX]`, `[DOCS]`, `[REFACTOR]`, `[TEST]`, `[CHORE]`, `[PERF]`, `[CI]`, `[BUILD]`, `[STYLE]`, or `[REVERT]` according to the change. Pull requests that implement a `[BUG]` issue use `[FIX]`.
- Release pull request titles use `[RELEASE] frontend vX.Y.Z과 서비스 vA.B.C 공지를 갱신한다`.

## Pull request body

- Preserve and complete `.github/pull_request_template.md` instead of inventing a different structure.
- Write valid GitHub Markdown with real line breaks. Never submit escaped newline text such as literal `\\n`.
- Create the body as a UTF-8 Markdown file and submit it with `gh pr create --body-file` or an equivalent file-based API call.
- Keep headings, blank lines, lists, and checkboxes separated so GitHub renders them correctly.
- Include the closing issue keyword, material changes, verification commands/results, review points, and screenshots for visible UI changes when practical.
- User-facing patch notes describe user-visible value first; implementation details belong in the technical PR body.

## Verification and reporting

- Do not claim a check passed unless its command completed successfully.
- Preserve the existing scrollbar, keyboard access, responsive behavior, and touch behavior when extending interaction patterns.
- In the final report, link the issue and pull request and summarize exactly what changed, what was tested, and what remains for the user.
