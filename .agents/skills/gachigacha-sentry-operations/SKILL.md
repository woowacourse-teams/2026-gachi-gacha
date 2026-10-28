---
name: gachigacha-sentry-operations
description: Plan, implement, review, or operate Sentry for the GachiGacha frontend. Trigger for Sentry setup, SDK changes, error capture, context and fingerprint design, filtering, source maps, quota or rate limits, alerts, privacy, triage, and incident-response workflow. Do not use for backend monitoring.
---

# GachiGacha Sentry operations

Use this workflow to keep frontend error monitoring actionable, privacy-safe, and sustainable.

## Load only the context the task needs

Do not read every Sentry document by default. Route the task first, then read the selected reference completely.

- Initial project connection, DSN, auth token, GitHub Environment, or first verification: read [references/setup-runbook.md](references/setup-runbook.md).
- SDK code, build settings, source maps, capture helpers, or repository privacy implementation: read [`frontend/docs/error-tracking.md`](../../../frontend/docs/error-tracking.md).
- Filtering, grouping, fingerprints, alerts, quota, severity, incident triage, or dashboard operation: read [references/monitoring-policy.md](references/monitoring-policy.md).
- A task that spans multiple categories may require multiple references. A small capture-site fix or explanation does not require unrelated setup or dashboard documents.

## Workflow

1. Identify whether the task concerns initial setup, capture quality, filtering, alerting, quota, or incident triage.
2. Inspect the live frontend implementation and current dashboard evidence. Do not assume a wizard, article example, or old PR matches the current repository.
3. Classify the user impact and decide whether the event is actionable before collecting or filtering it.
4. Add only low-cardinality, privacy-safe context needed to reproduce and group the failure.
5. Verify in `development` first. Confirm the original TypeScript stack, release, environment, route, grouping, and redaction before enabling or changing `production`.
6. Record the reason, owner, verification evidence, and review date for every new filter or alert rule.
7. During triage, leave a single visible acknowledgement and outcome so another teammate does not repeat the same investigation.

## Non-negotiable boundaries

- Never modify backend code or configure backend monitoring.
- Do not rerun a generic Sentry setup wizard over the existing SDK integration.
- Do not enable Replay, Performance, Profiles, Logs, or default PII collection without a separate approved privacy and cost review.
- Never place `SENTRY_AUTH_TOKEN` in source code, browser bundles, local committed files, PR text, or chat. Enter it directly as a GitHub Environment secret.
- Never collect raw query strings, URL hashes, request or response bodies, headers, cookies, OAuth values, tokens, chat, inquiry, post content, names, nicknames, or email addresses.
- Do not blanket-filter an HTTP status family or network error string. Prove that the flow is intentionally handled and non-actionable first.
- Do not use raw URLs, IDs, timestamps, free text, or response messages as tags or fingerprints.
- Do not leave test-error buttons, routes, or forced exceptions in merged product code.

## Output expectations

Report the affected environment, event class, user impact, capture or filter decision, privacy review, verification evidence, and any dashboard action the user must perform manually.
