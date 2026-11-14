# GachiGacha accessibility audit checklist

Use this reference for a site-wide audit, formal accessibility report, conformance discussion, or release-critical accessibility review. It distills the team's supplied accessibility training material and should be used with the current [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/), [KWCAG 2.2](https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do?bcIdx=25083&cbIdx=90549), and relevant [WAI-ARIA APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/).

## Acceptance model

Apply three evidence layers in this order:

1. **Human task completion:** a keyboard and screen-reader user can complete the task, understand state changes, recover from errors, and retain context.
2. **Accessibility tree and interaction contract:** roles, names, states, relationships, focus order, and keyboard behaviors match the visible interface.
3. **Automated evidence:** semantic Testing Library queries, axe-type rules, static checks, Lighthouse, and browser tooling prevent regressions but do not prove conformance.

The browser exposes a role, name, and state map through the accessibility tree. Screen readers, role-based tests, and browser agents all consume this map. A correct tree therefore helps people, tests, and AI at once, but their experiences are not interchangeable. The training references report that computer-use agents fell from 78.3% task success in a default condition to 41.67% with keyboard-only use and 28.3% with screen magnification in the [A11y-CUA study](https://arxiv.org/abs/2602.09310). Another [W4A 2026 study](https://dl.acm.org/doi/10.1145/3800424.3800445) reported that agent browsers could not produce a result for an average 57.4% of WCAG criteria that require more than syntax inspection. Treat these figures as evidence of AI evaluation limits, not as accessibility scores for this service.

Semantic HTML also gives search engines and role-based test tools a clearer document. That is a useful side effect, not permission to add ARIA for SEO, tests, or agents. Build the semantics and interaction for people first.

## Korean legal context

The [Disability Discrimination Act enforcement decree Article 14](https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=179653) describes an accessible website as one through which a person can use the desired service regardless of physical or technical conditions. A [2026 Supreme Court decision](https://www.law.go.kr/LSW/precInfoP.do?precSeq=618507) also recognized that meaningful non-text content needs sufficient text alternatives for screen-reader access.

Do not state that one WCAG failure automatically creates a 30 million won penalty. The Act distinguishes remedies and enforcement: malicious discriminatory conduct can be subject to a fine, and unjustified failure to comply with a finalized corrective order can be subject to an administrative fine, each up to the statutory amount. Accessibility findings can create real discrimination, damages, corrective-action, and enforcement risk, but a qualified legal review must decide how the law applies to a specific service and incident.

## KWCAG field priority

The official [2025 Korean web accessibility survey](https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do?bcIdx=29170&cbIdx=99873) examined 1,000 sites against 33 KWCAG 2.2 items and reported a 70.4 average. Start an audit with the nine lowest-compliance items, while still testing the complete standard:

| Priority | Inspection item                 | Principle      | Reported compliance |
| -------- | ------------------------------- | -------------- | ------------------: |
| 1        | Appropriate text alternatives   | Perceivable    |               17.1% |
| 2        | Bypass repeated blocks          | Operable       |               33.2% |
| 3        | Focus order and visible focus   | Operable       |               44.5% |
| 4        | Page, frame, and content titles | Operable       |               55.3% |
| 5        | Keyboard access                 | Operable       |               57.1% |
| 6        | Labels for user input           | Understandable |               63.9% |
| 7        | Text contrast                   | Perceivable    |               65.2% |
| 8        | Page language                   | Understandable |               80.5% |
| 9        | Understandable table structure  | Perceivable    |               83.4% |

Do not turn this ranking into a shortcut. A failure in a lower-ranked criterion can still block a critical user task.

## Complete WCAG 2.1 A/AA baseline and WCAG 2.2 additions

WCAG 2.2 extends 2.1 without changing the existing 2.1 success criteria. Check the following for every responsive variation in scope.

### 1. Perceivable

- **1.1.1 Text alternatives:** informative, functional, complex, and decorative non-text content follows the alternative-text decision. CAPTCHA and maps need equivalent access.
- **1.2.1–1.2.5 Time-based media:** transcripts, captions, live captions, audio descriptions, and media alternatives exist when applicable.
- **1.3.1 Info and relationships:** headings, landmarks, lists, tables, form groups, labels, descriptions, and errors are programmatically represented.
- **1.3.2 Meaningful sequence:** DOM and reading order preserve meaning across desktop and mobile.
- **1.3.3 Sensory characteristics:** instructions do not depend only on shape, color, size, sound, or location.
- **1.3.4 Orientation:** content does not unnecessarily restrict portrait or landscape.
- **1.3.5 Identify input purpose:** common personal-data fields use appropriate autocomplete purpose.
- **1.4.1 Use of color:** color is not the only state or instruction cue.
- **1.4.2 Audio control:** automatically playing audio longer than three seconds can be paused or controlled independently.
- **1.4.3 Contrast:** normal text 4.5:1; large text 3:1.
- **1.4.4 Resize text:** text remains usable at 200% without loss.
- **1.4.5 Images of text:** use real text except for essential logos or unavoidable cases.
- **1.4.10 Reflow:** at 320 CSS pixels wide or 256 CSS pixels high, content reflows without two-dimensional scrolling except where essential.
- **1.4.11 Non-text contrast:** meaningful controls, focus/state indicators, and graphics reach 3:1 against adjacent colors.
- **1.4.12 Text spacing:** user-adjusted line, paragraph, letter, and word spacing does not clip or overlap content.
- **1.4.13 Hover/focus content:** additional content is dismissible, hoverable, and persistent when required.

### 2. Operable

- **2.1.1 Keyboard:** every function works through a keyboard interface, including custom controls, maps, uploads, filters, and carousels.
- **2.1.2 No keyboard trap:** focus can enter and leave; modal containment has a deliberate exit.
- **2.1.4 Character key shortcuts:** single-character shortcuts can be disabled, remapped, or limited to focused controls.
- **2.2.1 Timing adjustable:** users can extend or disable time limits unless essential.
- **2.2.2 Pause, stop, hide:** moving, blinking, scrolling, or auto-updating content has controls where required.
- **2.3.1 Three flashes:** content stays below the flash threshold.
- **2.4.1 Bypass blocks:** provide a skip link and meaningful landmarks for repeated global areas.
- **2.4.2 Page titled:** every route has a unique, descriptive document title.
- **2.4.3 Focus order:** focus follows a logical task sequence and responsive visual order.
- **2.4.4 Link purpose:** link purpose is clear from its accessible name and context.
- **2.4.5 Multiple ways:** users can locate pages through more than one route where applicable.
- **2.4.6 Headings and labels:** headings and labels describe topic or purpose.
- **2.4.7 Focus visible:** keyboard focus is always visually identifiable.
- **2.5.1 Pointer gestures:** multipoint or path-based gestures have simple alternatives.
- **2.5.2 Pointer cancellation:** down events do not irreversibly trigger actions; users can cancel or undo.
- **2.5.3 Label in name:** the accessible name contains the visible control text.
- **2.5.4 Motion actuation:** device motion has an interface alternative and can be disabled.
- **2.4.11 Focus not obscured (WCAG 2.2 AA):** sticky headers, drawers, and floating controls do not fully hide focused elements.
- **2.5.7 Dragging movements (WCAG 2.2 AA):** drag operations have a non-drag alternative.
- **2.5.8 Target size minimum (WCAG 2.2 AA):** pointer targets meet the minimum or a documented exception.

### 3. Understandable

- **3.1.1 Language of page:** set the primary document language, normally `lang="ko"`.
- **3.1.2 Language of parts:** mark substantial foreign-language passages when pronunciation changes matter.
- **3.2.1 On focus:** focus alone does not trigger an unexpected context change.
- **3.2.2 On input:** input changes do not unexpectedly navigate or submit without advance notice.
- **3.2.3 Consistent navigation:** repeated navigation remains consistent.
- **3.2.4 Consistent identification:** controls with the same function are named consistently.
- **3.3.1 Error identification:** errors identify the affected field and problem in text.
- **3.3.2 Labels or instructions:** users receive necessary format, required, and constraint guidance before input.
- **3.3.3 Error suggestion:** offer a safe correction when known.
- **3.3.4 Error prevention:** destructive, legal, financial, or user-data changes are reversible, checked, or confirmed.
- **3.2.6 Consistent help (WCAG 2.2 A):** repeated help mechanisms keep a consistent relative location.
- **3.3.7 Redundant entry (WCAG 2.2 A):** avoid requiring the same information again in one process.
- **3.3.8 Accessible authentication minimum (WCAG 2.2 AA):** do not require a cognitive-function test without an alternative or assistance.

### 4. Robust

- **4.1.1 Parsing (WCAG 2.1 historical baseline):** avoid duplicate IDs and malformed relationships. WCAG 2.2 removed this criterion, but valid relationships still support interoperability.
- **4.1.2 Name, role, value:** controls expose correct names, roles, values, states, and changes.
- **4.1.3 Status messages:** loading, success, error, and result-count updates are announced without forcing focus.

## Component inspection recipes

### Alternative text

1. If the image is decorative, use empty `alt` and keep it out of the accessibility tree.
2. If adjacent text already provides the same information, avoid duplicate announcements.
3. If the image is a control, name the action or destination rather than its appearance.
4. If the image carries product, store, or message content, describe what is necessary for the current task. Do not leak private filenames or hidden metadata.
5. If a complex image cannot be summarized briefly, provide a short alternative and a nearby detailed equivalent.

### Focus and keyboard

- Start at the browser chrome and Tab through the full task. Record every missing, duplicated, invisible, clipped, or illogical stop.
- Test Shift+Tab, Enter, Space, arrow keys where the role promises them, Home/End for applicable listboxes, and Escape for overlays.
- Check that opening controls move focus into modal content and closing returns it to the opener.
- Check focus after route changes, filtering, validation errors, item deletion, pagination/history loading, and optimistic updates.
- For tooltips and hover content, verify keyboard focus reveals the same information.

### Dialogs and popovers

- Prefer native `<dialog>` when its behavior fits and browser support is acceptable.
- Otherwise provide `role="dialog"`, `aria-modal`, an accessible title and description, initial focus, focus containment, safe Escape behavior, background inertness, and focus restoration.
- Popovers that are not modal still need a named trigger, state via `aria-expanded`, Escape handling, and predictable focus.

### Tables

- Use a `caption`, `thead`, `tbody`, column `th scope="col"`, and row headers where useful.
- Do not use tables for page layout. Do not replace simple native tables with an ARIA grid unless cell-level keyboard interaction is actually required.

## Manual test matrix

At minimum, record one desktop and one mobile combination for release-critical flows:

| Environment              | Suggested assistive technology | What to verify                                                            |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------- |
| Windows + Chrome/Firefox | NVDA                           | landmarks, headings, forms, dialog focus, live status, data changes       |
| macOS + Safari           | VoiceOver                      | rotor navigation, labels, modal/popover behavior, browser-native controls |
| iOS + Safari             | VoiceOver                      | touch exploration, swipe order, responsive content, target size           |
| Android + Chrome         | TalkBack                       | reading order, activation, map/list alternatives, mobile overlays         |

Use real user tasks, not an element recital:

1. Log in and recover from an authentication error.
2. Search for a gacha, understand results, use the map controls, and open a store from the equivalent list.
3. Filter, sort, search, open, create, edit, and delete a trade.
4. Enter a chat, identify the partner and trade, load history, attach a photo, send a message, and recover from a connection failure.
5. Edit a profile, manage blocked users, and complete account deletion with confirmation.

## Automated and code-level evidence

- Prefer Testing Library `getByRole`/`findByRole` with accessible names. If a visible control cannot be queried by role, investigate the markup before reaching for a test ID.
- Add axe-type checks for stable pages and Storybook stories, but keep focused interaction tests for keyboard behavior and focus lifecycle.
- Inspect Chrome DevTools Accessibility for role, name, description, state, and ignored nodes.
- Validate contrast using rendered foreground/background colors, including hover, disabled, selected, error, and focus states.
- Run Lighthouse as a regression signal. Manually verify all critical criteria because automated tools cannot judge keyboard traps, meaningful alternatives, correct reading order, or overall task usability reliably.

## Report format

1. Scope and critical user tasks
2. Standards and target level
3. Baseline environment and evidence
4. Findings grouped as verified blocker, verified major, manual-confirmation risk, and enhancement
5. Fix plan with responsible component and verification method
6. Before/after code, measurements, screenshots, and task videos
7. Automated results and false-positive/false-negative notes
8. Keyboard and screen-reader test matrix
9. Deferred criteria, third-party limitations, and residual risk

Do not write “WCAG compliant” unless the complete stated scope and responsive variants were assessed and the evidence supports that claim. Prefer “tested against these criteria in these flows and environments.”
