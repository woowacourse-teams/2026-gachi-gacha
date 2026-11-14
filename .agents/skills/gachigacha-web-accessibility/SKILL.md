---
name: gachigacha-web-accessibility
description: Plan, implement, review, or audit accessibility for the GachiGacha frontend. Trigger for semantic HTML, screen readers, keyboard and focus behavior, ARIA, alternative text, color contrast, skip links, headings and page titles, dialogs, carousels, maps, chat, WCAG or KWCAG, accessibility tests, and accessibility reports. Do not use for purely visual styling that cannot affect semantics, contrast, focus, motion, input, or responsive use.
---

# GachiGacha web accessibility

Make the user's real task completion the standard. The accessibility tree, automated tools, tests, and AI agents are supporting inspectors, not substitutes for a person using a keyboard and screen reader.

## Route the task

- For an ordinary component change or review, apply the non-negotiables and compact workflow in this file.
- For a site-wide audit, accessibility report, legal-risk review, or WCAG/KWCAG conformance claim, read `references/audit-checklist.md` completely before acting.
- For a custom interactive widget, consult the matching WAI-ARIA Authoring Practices pattern after checking whether native HTML can replace it.
- For visual-only work, still check contrast, focus visibility, zoom/reflow, reduced motion, and touch target impact before deciding the skill no longer applies.

## Principles

1. Start with semantic HTML. Use the native element whose built-in role and keyboard behavior match the interaction.
2. Add ARIA only when native semantics cannot express the required name, role, state, or relationship. No ARIA is better than incorrect ARIA.
3. Preserve equivalent access across desktop and mobile layouts. Responsive variants are part of the same page's conformance.
4. Do not remove an interaction merely to pass a check. Provide an accessible equivalent: buttons for drag, pan, pinch, swipe, or pointer-only gestures; a list alternative for a map; visible text for color-only status.
5. Improve incrementally, but prioritize blockers in authentication, search, map/store discovery, trade discovery and creation, chat, profile, and account deletion.
6. Never make a legal or conformance guarantee from code inspection or automated output alone. Record the tested scope, browser, assistive technology, viewport, and remaining limitations.

## Non-negotiables

- Give every page one descriptive `h1`, logical heading order, meaningful landmarks, and a route-specific document title.
- Put a visible-on-focus skip link before repeated global navigation and target the primary `main` content.
- Use `button` for actions and links for navigation. Do not make a `div` or `span` clickable unless the complete native keyboard behavior cannot be achieved another way.
- Keep DOM order aligned with visual and focus order. Never use a positive `tabindex`.
- Never remove focus styling without an equally visible `:focus-visible` or `:focus-within` replacement.
- Give form controls persistent labels. Connect help and errors with `aria-describedby`, expose invalid state, and make errors identifiable without color alone.
- Give meaningful images concise context-specific alternative text. Use `alt=""` only for decoration or when adjacent text already communicates the same purpose. Do not duplicate captions in `alt`.
- Ensure normal text contrast is at least 4.5:1, large text at least 3:1, and meaningful non-text controls or states at least 3:1 against adjacent colors. Verify actual rendered color combinations.
- Do not hide focusable descendants with `aria-hidden`. Do not add an accessible name that conflicts with visible text.
- Modal dialogs must set an initial focus, contain focus, support Escape when safe, prevent background interaction, and restore focus to the opener.
- Status and error announcements must be useful and restrained. Do not make a large changing region `aria-live` when only a short status message needs announcing.
- Respect 200% text zoom, 400% browser zoom/reflow, orientation changes, `prefers-reduced-motion`, and mobile touch targets.

## GachiGacha interaction patterns

- **Map:** name the map region and every control; retain zoom and current-location buttons; expose matching stores in an operable list; never rely on marker color or map gestures alone; keep marker/card/header interactions from triggering unrelated controls.
- **Carousel and horizontal catalog:** provide previous/next or direct item controls, keyboard access, visible focus, and an understandable position or result status. Drag and swipe remain optional enhancements.
- **Trade lists:** use a real list or articles with descriptive link names; announce filtering/loading outcomes without rereading the entire result grid; preserve filter state and focus after updates.
- **Chat:** expose the conversation and partner/trade context in reading order; label attachment and send controls; visibly focus the composer; make history loading operable; announce connection/send failures without replaying every message. Consider `role="log"` only after testing its verbosity with screen readers.
- **Dialogs, drawers, popovers, and photo viewers:** follow the focus lifecycle above. Menus, listboxes, and comboboxes must implement the keyboard contract promised by their roles.
- **Upload and reordering:** label each preview and removal control. Drag reordering requires buttons or another keyboard-equivalent ordering mechanism.

## Compact workflow

1. Define the user task and its critical states: loading, empty, success, validation error, server error, and disabled/pending.
2. Inspect the DOM and accessibility tree for each control's role, accessible name, state, and relationships.
3. Complete the task with keyboard only. Check entry point, logical order, visible focus, no trap, Escape behavior, and restored focus.
4. Complete the task with an appropriate screen reader on at least one desktop or mobile combination. For a release-critical flow, include both desktop and mobile evidence.
5. Check alternative text, labels, headings, page title, landmarks, contrast, zoom/reflow, motion, pointer alternatives, and status announcements.
6. Add tests using semantic Testing Library queries such as `getByRole`. Test the interaction contract, not only attribute presence.
7. Run automated analysis as a regression aid, then manually verify findings and false negatives.
8. Record before/after evidence, commands, browser/assistive-technology matrix, unresolved risks, and any intentionally deferred criterion.

## Output requirements

- Lead with blockers to real task completion, then high-frequency KWCAG failures, then enhancements.
- Separate verified failures, code-review risks requiring manual confirmation, and passed checks.
- Include a concrete fix and verification method for every finding.
- For a formal improvement report, include the core scope, baseline, plan, changes, before/after measurements or video, manual test matrix, automated results, and residual risks.
