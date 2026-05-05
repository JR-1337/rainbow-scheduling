<!-- SCHEMA: lessons-archive.md
Version: 6.2
Purpose: retired LESSONS entries moved out of active LESSONS.md when
  the 25,000-char ceiling is crossed, on `Graduated: YYYY-MM-DD to <target>`
  marker, or on opportunistic stale review. Distinct from
  CONTEXT/archive/YYYY-MM-{slug}.md time-bucket retirements: this is
  a single growing file.

Write mode: prepend each moved entry at the top (newest first, mirrors
  active LESSONS.md ordering). Never edit moved entries in place; if
  a moved lesson recurs and earns new affirmations, write a fresh entry
  to active LESSONS.md and reference the archived one by title.

Rules:
- Entries copy the LESSONS.md template shape (see LESSONS.md header
  above for fields including Affirmations and Graduated). No new fields here.
- Newest at top, both this file and active LESSONS.md.
- File born from this header on first move. No template block; the
  shape comes from LESSONS.md.
- Cross-project graduations go to `{GLOBAL_ROOT}/CONTEXT/LESSONS.md`,
  NOT here. This file holds project-scoped retirements only.
- ASCII operators only.
-->


<!-- ============================================================ -->
<!-- 2026-05-04 (s064) cadence-trigger archive pass: 4 entries  -->
<!-- moved (3 new entries this session triggered cadence rule). -->
<!-- ============================================================ -->

## [PROJECT] -- Apps Script POST returns HTML redirect instead of JSON
Rule: Use GET-with-params for `apiCall(action, payload)` routes; try POST first for large payloads, fall back to chunked GET.
Trigger: When wiring a new `apiCall(action, payload)` route to Apps Script.
Why: Apps Script POST responses are returned as HTML redirects, not JSON, breaking `response.json()` parse. GET-with-params is the working contract.
Provenance: <unknown commit> -- Apps Script POST/redirect pitfall.
Tags: surface: apps-script, concern: data-shape
Affirmations: 0

## [PROJECT] -- Top-level use of `../App` symbols breaks circular imports
Rule: Keep all `../App` references inside function bodies in `src/pdf/generate.js`, `src/email/build.js`, `src/panels/*`, `src/modals/*`.
Trigger: When importing symbols from `../App` in any of those files.
Why: ESM live bindings resolve at call-time, so the cycle works only if all uses are deferred. Top-level reads break the cycle and crash on load.
Provenance: <unknown commit> -- circular-import constraint between App.jsx and its consumers.
Wrong way: `import { ROLES } from '../App'` at module top level in `src/panels/*`.
Tags: surface: react, concern: dependency
Affirmations: 0

## [PROJECT] -- `useIsMobile()` at 768px breakpoint
Rule: Branch mobile vs desktop rendering with `useIsMobile()` at the 768px breakpoint.
Trigger: When implementing any device-split surface.
Why: 768px is the project's mobile/desktop boundary; ad-hoc breakpoints break parity audits across surfaces.
Provenance: <unknown commit> -- legacy conventions.md.
Tags: surface: react, concern: layout
Affirmations: 0
## [PROJECT] -- `verifyAuth(payload, requiredAdmin)` server-side on all protected endpoints
Rule: Call `verifyAuth(payload, requiredAdmin)` server-side on every protected endpoint; read `payload.token` (preferred) or legacy `payload.callerEmail`, and derive `callerEmail` from `auth.employee.email` (never destructure from payload).
Trigger: When adding or editing a protected endpoint in backend Code.gs.
Why: Destructuring `callerEmail` directly from payload bypasses the auth check. The S41.1 rule fixes the derivation point.
Provenance: S41.1 -- backend Code.gs auth rule.
Tags: surface: apps-script, concern: auth
Affirmations: 0

<!-- ============================================================ -->
<!-- 2026-05-04 (s061) bulk archive pass: 80 entries moved from   -->
<!-- active LESSONS.md to bring it under the 15k char target per  -->
<!-- schema. Entries preserved verbatim with Moved: line per spec. -->
<!-- ============================================================ -->

## [PROJECT] -- Apps Script ownership migration: retire source sheet for ~7 days
Rule: Retire (do not delete) the source Sheet for ~7 days after a Make-a-copy migration as a fallback.
Trigger: When cutting over to a Make-a-copy-migrated Apps Script deployment.
Why: Whatever data exists on the source sheet at the moment of copy is the cutover snapshot; anything entered post-copy on the original is stranded. A 7-day retire window preserves the original as a fallback without inviting new writes.
Provenance: 2026-04-27 -- 33afa4b -- s030 close nuke-and-pave migration.
Tags: surface: apps-script, concern: migration
Confidence: H -- Google deployment docs + observed prod success of nuke-and-pave 2026-04-27.
Affirmations: 1
Moved: 2026-05-04 (s061) -- archive pass under ceiling pressure; kept retrievable for next AS ownership migration.

## [PROJECT] -- Apps Script ownership migration: re-add HMAC_SECRET manually
Rule: After Drive Make-a-copy migration, re-add `HMAC_SECRET` to Script Properties on the new project.
Trigger: When completing an Apps Script ownership migration via Make-a-copy.
Why: Script Properties do not copy with the sheet. Reusing the old `HMAC_SECRET` keeps existing sessions alive; a fresh value bounces everyone to login (passwords still work because the Employees sheet copies with data).
Provenance: 2026-04-27 -- 33afa4b -- s030 close nuke-and-pave migration.
Tags: surface: apps-script, concern: migration
Confidence: H -- Google deployment docs + observed prod success of nuke-and-pave 2026-04-27.
Affirmations: 1
Moved: 2026-05-04 (s061) -- archive pass under ceiling pressure; bundled with ownership-migration cluster.

## [PROJECT] -- Apps Script ownership transfer is a dead end; nuke-and-pave via Drive Make-a-copy works
Rule: Migrate Apps Script ownership by `File -> Make a copy` from Drive while signed in as the target account; do not attempt ownership transfer of the existing project.
Trigger: When migrating Apps Script ownership or cloning a Sheet+bound-script combo with a clean owner.
Why: Google does not transfer existing Web App deployments with ownership ("You cannot transfer ownership of versioned deployments"); the `/exec` URL keeps running under the original deployer. Make-a-copy creates a fresh sheet and a fresh bound script natively owned by the target account.
Provenance: 2026-04-27 -- 33afa4b -- s030 close: nuke-and-pave swap of API_URL to otr-owned deployment after ownership-transfer path failed in prod.
Wrong way: Using Manage deployments -> "Execute as: Me (new-owner)" expecting the deployment binding to follow the new owner.
Tags: surface: apps-script, concern: migration
Confidence: H -- Google deployment docs + observed prod failure of transfer path + observed prod success of nuke-and-pave 2026-04-27.
Affirmations: 1
Moved: 2026-05-04 (s061) -- archive pass under ceiling pressure; full ownership-migration cluster preserved here.

## [PROJECT] -- Sonnet audit caught hasTitle(currentUser) on someone else's shift
Rule: Derive role/title pill rendering from the shift owner via `hasTitle(theShiftOwner)`; never use `hasTitle(currentUser)` for someone else's shift.
Trigger: When rendering a role/title pill on a cell label, shift-detail sheet, PDF, or email.
Why: `hasTitle(currentUser)` shows the viewer's title on someone else's shift. Sarvi tapping Joel's shift showed "GM" instead of "Owner"; tapping a cashier's shift showed "GM" instead of "Cashier".
Provenance: 2026-04-27 -- s028 -- Sonnet audit caught `src/views/EmployeeView.jsx:633-635` using `hasTitle(currentUser)`; fixed to `hasTitle(mobileShiftDetail.employee)`.
Wrong way: `hasTitle(currentUser)` on a shift owned by someone else.
Tags: surface: react, concern: data-shape
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Admin1 vs admin2 access tiers are intentional, not drift
Rule: Treat admin1 (real admins: Sarvi, Joel; can edit) vs admin2 (management: Amy, Dan, Scott; view only) capability differences as the intentional access model; check `adminTier === 'admin1'` or equivalent before flagging an admin-surface inconsistency as drift.
Trigger: When auditing admin-surface inconsistencies between desktop and mobile admin paths.
Why: Hours/star/OT visibility, edit affordances, and other capability differences flow from the tier split. Filing them as drift "fixes" the access model into a bug.
Provenance: 2026-04-27 -- s028 -- Sonnet codebase audit flagged hours+star differences between EmployeeRow and MobileAdminScheduleGrid as Category D drift; JR confirmed intentional.
Tags: surface: react, concern: auth
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Parity audit must verify rendered behavior, not component grep
Rule: Code-read the actual render path for any claimed parity gap; never accept a component-presence grep result as the gap evidence.
Trigger: When auditing parity between desktop and mobile (or any two surfaces).
Why: Hover tooltips, conditional renders, and richer-desktop equivalents are invisible to grep. The 2026-04-23 Explore subagent misreported 2 of 3 gaps (Employee Quick View "missing" on desktop, Hidden section "missing" on mobile); both existed and the actual gap was one missing Edit button.
Provenance: 2026-04-23 -- parity audit -- Explore subagent misreported 2 of 3 gaps using keyword search only.
Tags: surface: harness, concern: observability
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Vercel Postgres is dead (Dec 2024); migrated to Neon Marketplace
Rule: Treat any reference to "Vercel Postgres" as a current product as stale; new projects use Neon via the Vercel Marketplace integration.
Trigger: When evaluating Postgres options or reading older comparison docs / blog posts.
Why: Vercel shut Vercel Postgres down in December 2024 and migrated existing databases to Neon. Older comparison docs that include Vercel Postgres misrepresent the current option set.
Provenance: 2026-04-26 -- <unknown commit> -- migration research `docs/research/scaling-migration-options-2026-04-26.md` (external vendor fact, not a code rule).
Tags: surface: neon, concern: dependency
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; preserved for future migration scoping reference.

## [PROJECT] -- Vendor / option research outputs decision axes, not a single recommendation
Rule: Frame option surveys by motivation ("if cost matters most -> X; if security posture matters most -> Y; if defer-the-decision -> Z"); avoid converging on a single pick.
Trigger: When delivering any multi-option research result for JR (DB migration, vendor evaluation, hosting comparison, library selection).
Why: Single-pick framing carries predicted-savings bias and the recommender's gravitational pull on the choice. Motivation-axis framing kept `docs/research/scaling-migration-options-2026-04-26.md` useful and low-bias.
Provenance: 2026-04-26 -- `docs/research/scaling-migration-options-2026-04-26.md` motivation-axis confirmation.
Tags: surface: harness, concern: naming
Affirmations: 1
Moved: 2026-05-04 (s061) -- archive pass; covered by global subagent-delegation rule.

## [PROJECT] -- Echo user-stated facts before saving to memory or plan
Rule: State the number or fact back verbatim before persisting to memory or a plan file.
Trigger: When saving any project fact that affects downstream artifacts.
Why: Extrapolation produces wrong values that propagate through artifacts. S47 saved "24/16/$29,120" via extrapolation; JR corrected to "34/14/$25,480", then to "35/14/$30,452" in s024 (2026-04-26) when the deck was rebuilt, each correction forcing a downstream re-sweep.
Provenance: 2026-04-26 -- s024 deck rebuild; "35/14/$30,452" correction wave (3e49ed1 sweep of stale OTR pitch numbers).
Tags: surface: harness, concern: data-shape
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Family tree: Joel owner+father, Amy+Dan inherit, Scott ops mgr, Sarvi NOT family
Rule: Treat Joel as owner+father, Amy and Dan as Joel's children (siblings, both inherit), Scott as ops manager (relation unspecified), and Sarvi as GM and JR's girlfriend (not family); verify before any family-framed copy.
Trigger: When writing copy that names or frames the Carman family relationships.
Why: Prior tree had Joel as Dan's brother and Dan as owner, which broke continuity and family-firm sales context. JR corrected it directly.
Provenance: 2026-04-26 -- session direct correction -- prior incorrect tree had Joel as Dan's brother and Dan as owner.
Tags: surface: prompt-kit, concern: naming
Affirmations: 1
Moved: 2026-05-04 (s061) -- archive pass; covered by auto-memory project_carman_family_profile.

## [PROJECT] -- Topics JR has explicitly closed stay closed -- ESA-placement
Rule: After JR explicitly closes a topic ("do not mention X again", "stop pushing X"), drop X from every downstream artifact.
Trigger: When JR closes a topic in-session.
Why: Relitigating a closed topic costs time and trust. Original incident: ESA-placement closed across three messages.
Provenance: 2026-04-26 -- ESA-placement close -- JR said "do not push esa more", then "ESA is mentioned once how i said last time and no more", then "your obsession with the esa rules must end" across three messages.
Tags: surface: prompt-kit, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- the rule is kept in active LESSONS as a generic process rule; ESA-specific phrasing archived here.

## [PROJECT] -- Steel-man contradicting research before defending current design
Rule: When external research/docs conflict with the current view of the work, write the case FOR the change (specific, concrete) before the case AGAINST; if "against" wins, it must win on substance from the research, not status-quo bias.
Trigger: When JR provides external research/docs that conflict with current design.
Why: Defaulting to defense biases the response toward status quo. The 2026-04-26 first pitch-deck proposal dismissed the trial-lawyer angle, the chatbot quick-question framing, and several visual treatments without weighing them, forcing a full restart.
Provenance: 2026-04-26 -- pitch-deck proposal restart -- JR redirected: "i think you're too attached to your design and not fully considering the benefits of any of these changes."
Tags: surface: prompt-kit, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- No "rounding" language in any pitch artifact
Rule: Sweep ban "rounding", "rounding rule", and "rounding ambiguity" from pitch deck, spec sheet, chatbot system prompt, and price sheet; replace with phone-first punch flow, real-time dashboard for Sarvi, ADP-formatted handoff, or automated promo commission tracking; grep `rounding\|rounded` before shipping (Tailwind CSS class `rounded` is fine).
Trigger: When writing or editing pitch copy across deck, spec, chatbot, or price artifacts.
Why: Amy rounds up manually by choice; ADP does not enforce rounding; "stops time-rounding ambiguity" was a fabricated value claim. Phase2.jsx had "rounding rule Amy approves baked in" + "Precision in, no rounding ambiguity" and the bot system prompt had "Stops time-rounding ambiguity" -- all swept.
Provenance: 2026-04-26 -- s024 -- JR direction: "STOP SAYING ROUNDING. there's other reasons. use those."
Wrong way: "rounding rule Amy approves baked in"; "Precision in, no rounding ambiguity"; "Stops time-rounding ambiguity".
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; preserved for future pitch work.

## [PROJECT] -- Display sort: Sarvi, other admins alpha, FT alpha, PT alpha
Rule: Sort employee displays in four buckets: Sarvi pinned top, other non-owner admins alpha, full-time non-admins alpha, part-time non-admins alpha; render two discreet dividers on bucket transitions; route through `src/utils/employeeSort.js` (`sortBySarviAdminsFTPT`, `employeeBucket`, `computeDividerIndices`).
Trigger: When rendering an employee list on admin grid, employee view, mobile admin/employee, or PDF.
Why: Centralizing the four-bucket sort in `src/utils/employeeSort.js` keeps App.jsx, views/EmployeeView.jsx, MobileAdminView, MobileEmployeeView, and src/pdf/generate.js consistent. Supersedes the prior 3-bucket rule.
Provenance: 2026-04-20 -- shipped four-bucket sort -- supersedes prior 3-bucket rule.
Tags: surface: react, concern: data-shape
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; rule is discoverable from `src/utils/employeeSort.js`.

## [PROJECT] -- PDF export must open the print tab before `await import()`
Rule: Open `about:blank` synchronously on click, then navigate that tab to the blob URL after the dynamic import resolves.
Trigger: When PDF export is wired through a dynamic `await import()` chunk.
Why: Lazy-loading `generateSchedulePDF` after `await` exits the user-gesture window; Chrome and Safari block the `window.open` that follows. Opening the tab synchronously preserves the gesture.
Provenance: 2026-04-25 -- 8affd22 -- fix after perf wave 1 moved PDF to dynamic import.
Tags: surface: html-pdf, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Push and confirm deploy before handing JR a phone-smoke checklist
Rule: After any commit JR will phone-test, run `git push origin main` and state "pushed, Vercel redeploys in ~60s, hard-refresh first" before delivering test steps.
Trigger: When handing JR a phone-smoke checklist for work just committed.
Why: Handing over test steps while prod still serves the old bundle produces false negatives. 2026-04-18 shipped Phase A+B+C locally, JR tested on prod against old code, items 5/8/9 came back as false negatives.
Provenance: 2026-04-18 -- Phase A+B+C smoke; 9-step checklist false-negative incident.
Tags: surface: deploy, concern: observability
Affirmations: 1
Moved: 2026-05-04 (s061) -- archive pass; covered by auto-memory feedback_deploy_before_smoke.

## [PROJECT] -- Hard-refresh is not always enough; verify bundle hash from view-source
Rule: When JR reports "not working" after a fresh-looking reload, curl the prod URL for the current `index-*.js` hash and tell him to open `view-source:` on his phone and search for it.
Trigger: When JR reports a fix is not live after reloading.
Why: 2026-04-18 the Staff-reopen fix was deployed and curl-verified live, but JR's phone still served a cached bundle that hard-refresh did not evict. Hash absence in view-source distinguishes browser cache from a real bug.
Provenance: 2026-04-18 -- Staff-reopen cached-bundle incident.
Tags: surface: vercel, concern: observability
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Optimistic updates must capture prev state and revert on API failure
Rule: Capture `const prevX = X` before any `setX(...)` that precedes an `apiCall`; on `!result.success` call `setX(prevX)`, `showToast('error', ...)`, and `return false`.
Trigger: When writing any `setEmployees` / `setShifts` / `setX` mutation that is followed by an `apiCall`.
Why: Showing an error toast while leaving the optimistic change in place gives the user a false-positive signal. Pre-2026-04-18 employee save/delete/reactivate flows showed an error but kept UI in post-save state; JR caught this during a Wi-Fi-off smoke.
Provenance: 2026-04-18 -- Wi-Fi-off smoke; employee save/delete/reactivate revert gap.
Wrong way: `setEmployees(next); apiCall(...)` with no `prevEmployees` capture and no revert on failure.
Tags: surface: react, concern: error-handling
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Modal close-handler side effects go in useEffect on open-flag, not inline onClose
Rule: Run "do X when the modal finishes closing" in `useEffect(() => { if (!open && flagRef.current) { flagRef.current = false; doX(); } }, [open])` with a ref-held flag set when the modal opened.
Trigger: When wiring a side effect (e.g. reopen parent sheet, reset other state) to a modal closing.
Why: Inline onClose with a state flag did not reliably fire (suspected batched-state / stale-closure timing). 2026-04-18 ref+effect fixed reopening MobileStaffPanel after EmployeeFormModal close.
Provenance: 2026-04-18 -- MobileStaffPanel reopen after EmployeeFormModal close.
Wrong way: `onClose={() => { setOpen(false); reopenParent(); }}` inline alongside `setOpen(false)`.
Tags: surface: react, concern: render
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- AdaptiveModal mobile path doesn't render the icon prop
Rule: On mobile, carry per-modal identity via `title` prefix (emoji/glyph) or extend `MobileBottomSheet` to accept an icon; do not rely on `icon` / `iconColor` props.
Trigger: When wiring per-modal visual identity that must carry on mobile through `AdaptiveModal`.
Why: `AdaptiveModal` defers to `MobileBottomSheet({ title })` on mobile, which has no icon slot. `icon` / `iconColor` are desktop-only and silently drop on mobile.
Provenance: 2026-04-18 -- <unknown commit> -- observed during 2026-04-18 re-verify; documented for future AdaptiveModal work.
Tags: surface: react, concern: render
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Check for visual obstruction before re-chasing a "doesn't render" bug
Rule: Verify the element is missing from the DOM before digging into load/key/state code.
Trigger: When a bug report says "X saves but doesn't show in UI."
Why: A z-index or absolute-positioning overlay can obscure correctly-rendered content, masquerading as a render bug. Skipping DOM verification re-chases the wrong fault tree and burns session time.
Provenance: 2026-04-24 -- <unknown commit> -- Bug 5: top-nav PK appeared missing but Sheet had 4 PK rows that DID render; an `absolute bottom-0 right-0` badge layered over the work-shift hours row hid them.
Tags: surface: react, concern: render
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Absolute-positioned cell overlays collide on small schedule cells
Rule: Place secondary indicators (PK/MTG badges, icons, flags) in an in-flow flex row with the role name on schedule cells.
Trigger: When adding indicators to desktop 56px or mobile 66px schedule grid cells.
Why: Cells of 56px desktop / 66px mobile cannot host absolute-positioned overlays AND a multi-row shift payload without collision. In-flow flex lets the browser arbitrate space.
Provenance: 2026-04-24 -- <unknown commit> -- PK/MTG badge relocation across ScheduleCell.jsx, MobileAdminView.jsx, MobileEmployeeView.jsx.
Tags: surface: react, concern: layout
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Render shared overlays at App root, not inside branch returns
Rule: Define shared overlays (modals, toasts, action sheets) once before the device branch and render from both branches.
Trigger: When adding an overlay used by both the mobile-admin early-return branch and the desktop return.
Why: If only one branch mounts the overlay, state updates from the other branch silently no-op and the feature reads as broken. Defining `const confirmModal = ...` before the branch lets both returns reference it.
Provenance: 2026-04-19 -- <unknown commit> -- auto-populate confirm `<Modal>` lived only in the desktop return; mobile branches dispatched setAutoPopulateConfirm but nothing mounted.
Tags: surface: react, concern: render
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Tokens aliased to OTR_ACCENT rotate daily; modal identity must not use them
Rule: Use static identity tokens (e.g. `THEME.modal.swap.accent`, `THEME.modal.offer.accent`) for fixed visual identity; do not use `THEME.accent.blue/pink/purple`.
Trigger: When picking a token for per-modal accent or any surface meant to carry fixed identity.
Why: `THEME.accent.blue/pink/purple` are aliased to `OTR_ACCENT.primary/dark` and rotate daily. Using them makes "fixed" identity rotate to the wrong color on non-matching days.
Provenance: 2026-04-?? -- <unknown commit> -- SwapShiftModal and OfferShiftModal headers using `THEME.accent.purple/pink` rotated to blue/orange on non-matching days; added `THEME.modal.swap.accent` + `THEME.modal.offer.accent` to decouple.
Tags: surface: react, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Style-override on a Button variant is a smell
Rule: Codify a recurring `<Button>` style-override as a new variant.
Trigger: When you find yourself passing `style={{ backgroundColor, color, border }}` into a `<Button variant="...">`.
Why: The style override defeats tokenization and drifts from the variant contract. A named variant (e.g. `destructiveOutline`) preserves token discipline.
Provenance: 2026-04-?? -- <unknown commit> -- Sign Out drawer button shipped as `variant="secondary"` + 3-line style override for error-tone; introducing `destructiveOutline` removed the override.
Wrong way: `<Button variant="secondary" style={{ backgroundColor, color, border }} />` for an error-tone button.
Tags: surface: react, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Sheets Date objects use 1899 epoch for times
Rule: Read time/date cells through `getSheetData()` which normalizes to `YYYY-MM-DD` / `HH:mm`.
Trigger: When reading Sheet date or time cells anywhere in Code.gs or frontend ingest.
Why: Sheets serializes time-only cells against the 1899 epoch; raw values mis-match frontend date logic. Bypassing `getSheetData()` causes silent date-matching failures.
Provenance: <unknown commit> -- Sheets 1899-epoch normalization pitfall.
Wrong way: Bypassing `getSheetData()` and reading raw Date cells.
Tags: surface: sheets, concern: type-coercion
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; covered by general "use getSheetData()" architectural rule.

## [PROJECT] -- Sheets.Spreadsheets.Values.batchGet unusable here
Rule: Use `getDataRange().getValues()`; do not adopt `Sheets.Spreadsheets.Values.batchGet`.
Trigger: When considering a read optimization for the Sheets backend.
Why: `FORMATTED_VALUE` returns booleans as "TRUE"/"FALSE" strings (re-introducing type coercion bugs) and `SERIAL_NUMBER` requires a column-name list. Both modes broke in v2.19 attempt and the change was reverted.
Provenance: v2.19 -- <unknown commit> -- attempted batchGet read optimization; reverted.
Tags: surface: sheets, concern: perf
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- formatTime helpers must handle undefined/null
Rule: Make `formatTimeDisplay` / `parseTime` / `formatTimeShort` accept undefined/null inputs.
Trigger: When adding a new consumer of these helpers.
Why: Shift creation flows pass empty time values into these helpers. Without null-safety, the helpers throw and break shift creation paths.
Provenance: <unknown commit> -- formatTime helper null-safety pitfall.
Tags: surface: react, concern: error-handling
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Tailwind JIT `placeholder:` variant unreliable in runtime style blocks
Rule: Place pseudo-element styles in `index.css` with `!important`; do not rely on Tailwind JIT `placeholder:` in runtime style blocks.
Trigger: When styling input placeholders or other pseudo-elements via JSX style tags.
Why: Tailwind JIT does not reliably emit `placeholder:` variants from runtime style blocks. The pseudo-element style silently drops.
Provenance: <unknown commit> -- Tailwind JIT runtime-style pitfall.
Tags: surface: css, concern: render
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- `-webkit-line-clamp` invisible in PDF print popup
Rule: Use `word-break` CSS instead of `-webkit-line-clamp` in PDF generators.
Trigger: When constraining text overflow in `src/pdf/generate.js` or PDF print HTML.
Why: `-webkit-line-clamp` does not render in the PDF print popup; the constraint is silently dropped. `word-break` ships consistently.
Provenance: <unknown commit> -- PDF print-popup CSS pitfall in `src/pdf/generate.js`.
Tags: surface: html-pdf, concern: render
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- `THEME.bg.primary` is page-level only
Rule: Use `bg.tertiary` or `bg.secondary` for inner UI elements (inputs, tab bars, cells in cards).
Trigger: When picking a background token for an inner UI element.
Why: `THEME.bg.primary` is the page-level token; switching it (e.g. to dark) cascades into ~10 inner elements that assumed it was light. Using `bg.tertiary` / `bg.secondary` decouples inner surfaces from page-level changes.
Provenance: <unknown commit> -- bg-token cascade pitfall observed when switching `bg.primary` to dark.
Tags: surface: css, concern: layout
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Transparent accent-tinted cards invisible on dark
Rule: Use solid `bg.secondary` with an accent border or stripe for cards on dark navy backdrop.
Trigger: When styling a card surface placed on a dark navy backdrop.
Why: An `accent + '10'` alpha tint is below visible contrast on dark navy and the card disappears. Solid `bg.secondary` plus an accent border keeps the card legible.
Provenance: <unknown commit> -- dark-bg card-contrast pitfall.
Wrong way: `THEME.accent.blue + '10'` as a card fill on dark navy.
Tags: surface: css, concern: layout
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Card border opacity hex suffix `30` invisible, `80` visible
Rule: Use `THEME.border.default` (accent at 50%) for card edges on dark backgrounds.
Trigger: When styling card border opacity on a dark backdrop.
Why: Hex alpha suffix `30` is below visible contrast on dark; `80` is visible. `THEME.border.default` codifies the working 50% alpha.
Provenance: <unknown commit> -- card border opacity pitfall on dark bg.
Tags: surface: css, concern: layout
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Gradient blobs behind cards make cards look pasted on
Rule: Use solid dark backgrounds, not gradient blobs, behind cards on dark-mode backdrops.
Trigger: When choosing a backdrop treatment for a dark-mode page that hosts cards.
Why: Gradient blobs read as a separate layer; cards above them look pasted on. Solid dark integrates cards into the page.
Provenance: <unknown commit> -- dark-mode page-backdrop pitfall.
Tags: surface: css, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Keep role colors fully saturated
Rule: Keep role colors fully saturated; only desaturate functional status indicators (warning/error).
Trigger: When proposing a "consistency" refactor that touches role colors.
Why: Rainbow brand IS vibrant colors; muting role colors flattens brand identity. Desaturation is reserved for status semantics.
Provenance: <unknown commit> -- Rainbow brand-color guardrail.
Tags: surface: css, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- `THEME.accent.blue` and `.purple` are rotating aliases
Rule: Use `THEME.accent.text` (auto-contrast) or `OTR.accents[N]` (fixed) for new gradients; do not hardcode white on `THEME.accent.blue` / `.purple`.
Trigger: When building a new gradient that uses `THEME.accent.blue` or `THEME.accent.purple` slots.
Why: Both slots alias `OTR_ACCENT.primary`/`.dark` and rotate daily. Hardcoded white text on the gradient may fail WCAG when the rotation lands on green.
Provenance: <unknown commit> -- rotating-accent gradient pitfall.
Tags: surface: css, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Inline arrow functions as props defeat React.memo
Rule: Pass existing `useCallback` handlers (e.g. `handleCellClick`) into memoized grid rows; do not pass inline arrow functions.
Trigger: When wiring event handlers onto memoized hot-path grid cells.
Why: Inline arrow functions create new references each render and break `React.memo` referential equality. The cell re-renders despite memoization, voiding the perf win.
Provenance: <unknown commit> -- React.memo + inline-arrow pitfall on hot-path grid cells.
Wrong way: `<Cell onClick={() => handleCellClick(id)} />` on a memoized grid row.
Tags: surface: react, concern: perf
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- `.toISOString().split('T')[0]` slow in hot render paths
Rule: Use `toDateKey(date)` in hot render paths; not `.toISOString().split('T')[0]`.
Trigger: When formatting dates inside grid renders that touch 280+ cells.
Why: `toDateKey(date)` is roughly 10x faster, allocates no ISO string, and avoids the regex split. The ISO path measurably slows grid renders at 280+ cells.
Provenance: <unknown commit> -- hot-path date-format perf pitfall.
Wrong way: `.toISOString().split('T')[0]` inside a grid cell render.
Tags: surface: react, concern: perf
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Bulk search/replace across hot paths silently mangles
Rule: After mechanical renames, grep the exact new identifier and smoke-load the built bundle before committing.
Trigger: When running a >20-site find/replace across hot paths.
Why: Vite tree-shaking and silent typo handling can hide a bad rename (e.g. `stoDateKey(d)` instead of `toDateKey(d)`). Build success does not guarantee correctness.
Provenance: <unknown commit> -- bulk-rename mangling pitfall (Vite did not catch `stoDateKey(d)`).
Tags: surface: build, concern: error-handling
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; covered by auto-memory lesson_vite_silent_undefined.

## [PROJECT] -- Delete inline component AFTER adding import
Rule: Add the import first, then delete the inline component block.
Trigger: When extracting an inline component from `App.jsx` into `src/panels/` or `src/modals/`.
Why: `npm run build` does not catch undefined JSX refs; Vite tree-shakes silently. Reversing the order ships a bundle that white-screens at runtime.
Provenance: <unknown commit> -- App.jsx -> src/panels/ / src/modals/ extraction pitfall.
Tags: surface: build, concern: error-handling
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- "Unused" import lists written by hand are the bug
Rule: Programmatically cross-check every exported symbol after import-list extraction; never hand-edit "unused" import lists.
Trigger: When cleaning up imports in `src/views/` or `src/modals/`.
Why: Hand-edited "unused" lists drop symbols that are actually referenced. S40.3 dropped ROLES by hand and prod white-screened for 10 minutes.
Provenance: <unknown commit> -- S40.3 ROLES drop incident; prod white-screen 10 min.
Tags: surface: react, concern: dependency
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Defensive-filter malformed rows at the boundary
Rule: Filter malformed rows at ingress, e.g. `.filter(ev => EVENT_TYPES[ev.type])`, not at each read site.
Trigger: When writing any lookup-by-enum pattern over Sheet-sourced rows.
Why: A typo in a Sheet cell otherwise crashes every consumer downstream. Boundary filter contains the blast radius.
Provenance: <unknown commit> -- ingress-filter pattern for enum lookup.
Tags: surface: sheets, concern: data-shape
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Inline modal backdrop class chain duplicates helper
Rule: Use `AdminRequestModal` at `src/App.jsx` for any admin request modal; do not inline a backdrop class chain.
Trigger: When rendering an admin request modal.
Why: `AdminRequestModal` renders MobileBottomSheet on mobile and a centered modal on desktop. Duplicating the chain inline drifts from the helper's a11y and touch-target contract.
Provenance: <unknown commit> -- AdminRequestModal helper contract.
Tags: surface: react, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Empty Sheet field -> `JSON.parse('')` throws -> login bounced
Rule: When adding a defensive parser at one entry point, sweep ALL parse sites for that field.
Trigger: When parsing any Sheet-sourced JSON field (availability, storeHours, requests).
Why: An empty Sheet field passed to `JSON.parse('')` throws and bounces login. S50 fixed getAllData; S52 had to fix parent handleLogin at App.jsx line 1408 because the first sweep missed it.
Provenance: <unknown commit> -- S50/S52 JSON.parse sweep; App.jsx line 1408 fix.
Wrong way: `JSON.parse(row.availability)` without empty-string guard at a single site.
Tags: surface: sheets, concern: data-shape
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Fallback must return fully-populated shape, not `{}`
Rule: Return a fully-populated shape (use `ensureFullWeek()` or equivalent) when falling back; never return `{}`.
Trigger: When writing a data-layer fallback for any nested shape consumed by render.
Why: ScheduleCell reads `availability.available` directly; `{}` resolves to undefined and crashes render. Fully-populated fallbacks keep render paths total.
Provenance: <unknown commit> -- ScheduleCell `availability.available` crash.
Wrong way: `return {}` as the catch branch of an availability fetch.
Tags: surface: react, concern: data-shape
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Number vs string empId in composite-key comparisons
Rule: Coerce both sides with `String()` at any boundary comparing parsed-key empId to `currentUser.id`.
Trigger: When SwapShiftModal, OfferShiftModal, or any composite-key reader compares empId values.
Why: Sheet numeric id (101) compared against parsed string "101" fails strict `!==`. Coercion at the boundary keeps the comparison stable.
Provenance: <unknown commit> -- SwapShiftModal + OfferShiftModal composite-key incident.
Wrong way: `parsedKey.empId !== currentUser.id` without `String()` coercion.
Tags: surface: sheets, concern: type-coercion
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Frontend auth refactor strip requires backend handler sweep
Rule: When stripping a field from the frontend auth payload, grep `Code.gs` for every reader and either back-compat-inject in apiCall or rewrite handlers to derive from `auth.employee.email`.
Trigger: When refactoring frontend auth to drop a payload field.
Why: S37 stripped `callerEmail` and broke ~30 backend handlers reading `payload.callerEmail` directly. Stopping at the first failing test case leaves the rest live in prod.
Provenance: <unknown commit> -- S37 stripped `callerEmail`; ~30 backend handlers broken; follow-up dropped-fields logging in 12c6c3f.
Tags: surface: apps-script, concern: auth
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Trusting `result.success` from chunkedBatchSave
Rule: Read `data.totalChunks`, `data.failedChunks`, and `data.savedCount` alongside `result.success`; surface "X of Y batches saved" on partial failure and retain the unsaved flag.
Trigger: When consuming the chunkedBatchSave contract (per S34).
Why: `result.success` alone hides partial-failure state. Without the chunk counts, a partially-failed save reports as success and the user loses data silently.
Provenance: <unknown commit> -- S34 chunked-save contract.
Tags: surface: apps-script, concern: error-handling
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Backend 3-tuple key must be mirrored in frontend allShiftKeys
Rule: When changing the backend key format, grep frontend for every site building that key shape before testing.
Trigger: When altering a composite key produced by the backend (e.g. `${empId}-${date}-${type}`).
Why: A frontend/backend key-shape mismatch wipes survivor shifts. S61 caught this via adversarial audit pre-deploy.
Provenance: <unknown commit> -- S61 3-tuple key change; adversarial audit catch.
Tags: surface: apps-script, concern: data-shape
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Frontend-only field fix leaves Sheet blank
Rule: Include derived fields (hours, computed keys) in the save payload even when the frontend can recompute them.
Trigger: When adding meeting or PK events via batchSaveShifts (or any save path with derivable fields).
Why: Keeping derived fields in the payload keeps the Sheet self-describing for payroll, backups, and audits. Frontend-only fixes leave the Sheet blank in those columns.
Provenance: <unknown commit> -- meeting/pk events `hours` field omission.
Tags: surface: sheets, concern: data-shape
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Opus 4.7 plans, Sonnet 4.6 executes
Rule: For non-trivial multi-file changes, spawn an Opus 4.7 subagent to produce the plan and a Sonnet 4.6 subagent to execute it.
Trigger: When starting a non-trivial multi-file change. Sonnet does both only when a model flag prevents spawning Opus.
Why: JR stated 2026-04-23 "opus 4.7 plans the code and does the system 2 thinking and then a sonnet 4.6 sub agent executes the very specific plan." Reaffirmed 2026-04-25 during /coding-plan skill design.
Provenance: 2026-04-23 -- session statement -- EnterPlanMode confusion drove the split; reaffirmed s025-era during /coding-plan design.
Tags: surface: harness, concern: naming
Affirmations: 1
Moved: 2026-05-04 (s061) -- archive pass; covered by /coding-plan skill + auto-memory feedback rules.

## [PROJECT] -- One clarifying question per directive
Rule: Ask at most one clarifying question per directive, only on the actual unresolved axis.
Trigger: When receiving a top-level directive with one ambiguous axis.
Why: Splitting a top-level directive into sub-scope questions signals audit-seeking. "Audit the file" means audit the file.
Provenance: <unknown commit> -- directive-handling correction.
Tags: surface: harness, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; covered by global rule approval-and-planning.md.

## [PROJECT] -- Do not fresh-audit when categorized audit already drove the plan
Rule: Reuse the existing P0-P3 categorization; do not run a fresh audit mid-session on already-planned work.
Trigger: When the active plan was generated from a categorized audit.
Why: Fresh audits create duplicate findings and imply the existing chunking is wrong.
Provenance: <unknown commit> -- mid-session re-audit anti-pattern.
Tags: surface: harness, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Use `git add <explicit paths>`, never `-A` or `.`
Rule: Always stage with explicit file paths; never use `git add -A` or `git add .`.
Trigger: When staging a multi-file commit.
Why: `git add -A` once swept Photos/, dist/, and package-lock.json into a commit and recovery took a soft-reset. Global CLAUDE.md forbids it; the trap is the tidiness feeling.
Provenance: <unknown commit> -- Photos/+dist/+package-lock.json sweep incident.
Wrong way: `git add -A` or `git add .` on a multi-file commit.
Tags: surface: ci, concern: dependency
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; covered by global ~/.claude/CLAUDE.md.

## [PROJECT] -- Research agent estimates are hypotheses, not results
Rule: Playwright-verify any perf or UX claim before reporting it as a win.
Trigger: When a perf or UX claim is sourced from a subagent.
Why: S45 batchGet research estimated a 40% cut; measurement showed render-mode mismatches and no win. Estimates are hypotheses.
Provenance: <unknown commit> -- S45 batchGet 40% claim disconfirmed.
Tags: surface: harness, concern: observability
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; covered by global subagent-delegation rule.

## [PROJECT] -- Network-level diagnostics first, then narrow
Rule: When a user reports "spinner stops, no toast," fetch the actual response (curl + browser console) before speculating at backend issues.
Trigger: When a UI symptom suggests an API failure with no visible error.
Why: If the JSON is valid, the bug is frontend, not backend. S52 spent two messages speculating at backend issues; the actual fix was `JSON.parse('')` in App.jsx line 1408.
Provenance: <unknown commit> -- S52 spinner-stops incident; App.jsx line 1408 fix.
Tags: surface: harness, concern: observability
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- No predicted savings in ROI without measurement
Rule: Claim only confirmed current-state cost and product cost in ROI math; treat the trial as the measurement window.
Trigger: When writing pitch deck or any ROI math.
Why: Family will shoot at predicted numbers with no defense. Only measured values survive scrutiny.
Provenance: <unknown commit> -- pitch-deck ROI guardrail.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; covered by auto-memory feedback_cost_of_doing_nothing.

## [PROJECT] -- Cap ESA mentions at one per surface, never headline
Rule: Limit ESA references to one per surface and never as a headline; find detractors on different axes (customer sentiment, interface, vertical fit, account ownership).
Trigger: When writing pitch-deck Slide 4 Alternatives or any competitor framing.
Why: ESA is real but over-reliance signals monomaniacal framing.
Provenance: <unknown commit> -- Slide 4 Alternatives ESA cap.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; covered by auto-memory feedback_esa_not_a_selling_point.

## [PROJECT] -- No cheesy/salesy/SaaS-hero copy
Rule: Drop "let's prove it together," "we've got you covered," exclamation marks, emoji peppering, and gradient-on-type wordmarks from pitch copy.
Trigger: When writing pitch deck, leave-behinds, or family-facing text.
Why: SaaS-hero register clashes with the "high-priced lawyer with charm" voice JR specified.
Provenance: <unknown commit> -- pitch-copy voice guardrail.
Wrong way: "Let's prove it together!" / "We've got you covered" / emoji-peppered headlines.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; covered by auto-memory feedback_no_cheesy_copy.

## [PROJECT] -- No fabricated stats for concreteness
Rule: Use only Sarvi-confirmed facts, statutory facts, or pure arithmetic; range with "roughly" if not sourced.
Trigger: When inserting a numeric claim into pitch artifacts.
Why: Fabricated concretes get caught: "7-10 decisions per person" and "500 cells" did. Sourced or arithmetic-derived numbers survive.
Provenance: <unknown commit> -- "7-10 decisions per person" and "500 cells" catch.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Do not frame Sarvi as single-point-of-failure
Rule: Frame Sarvi as lieutenant, not replacement target; use process scale, off-hours spillover, or no-institutional-record angles instead.
Trigger: When writing any Sarvi-at-risk framing in customer-facing copy.
Why: Audience is family and Amy distrusts automation; Sarvi-at-risk framing reads as adversarial.
Provenance: <unknown commit> -- Sarvi-framing guardrail; Amy automation-distrust.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Competitor detractor bullets must BE detractors
Rule: Write competitor bullets that are knocks; cut any line that reads as praise.
Trigger: When writing Slide 4 Alternatives competitor bullets.
Why: A bullet that makes the audience Google the competitor more favorably is a sell, not a knock.
Provenance: <unknown commit> -- Slide 4 alternatives detractor-discipline.
Wrong way: A competitor bullet that reads as a feature highlight rather than a flaw.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Cite only flaws Rainbow actually beats today
Rule: Cite only competitor flaws Rainbow actually beats today; never cite gaps where competitors are comparable.
Trigger: When writing the Alternatives slide or any competitor-flaw framing.
Why: Phase 2 capability does not count as a beat. "They both lack X" turns into "competitor is comparable" and dilutes the pitch.
Provenance: <unknown commit> -- pitch-deck Alternatives slide; same root as no-predicted-savings.
Tags: surface: prompt-kit, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Schedule work = full admin scope, not just grid-writing
Rule: Use the 14-hour full-admin figure (schedules + management talks + time-off + swaps + sick calls + push + off-hours) in ROI math, not grid hours alone.
Trigger: When writing Slide 2 framing, chatbot FACT 3, or any ROI math.
Why: Grid-only hours undercount the real cost; "envelope" reads as opaque jargon.
Provenance: s027 -- envelope-jargon sweep -- chatbot/LESSONS/auto-memory cleanup.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Statutory claims must match ontario.ca authoritative source
Rule: Verify every legal/compliance claim against ontario.ca; daily rest is 8 hours, not 11.
Trigger: When writing any pitch compliance card or statutory claim.
Why: Wrong statutory numbers undermine the trial-lawyer voice and expose the pitch to a single fact-check.
Provenance: <unknown commit> -- pitch compliance card.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Verb calibration: "enforced" vs "flagged"
Rule: Describe 44hr OT as "flags" or "surfaces", never "enforces".
Trigger: When writing any product-capability description involving OT or other amber-warning behavior.
Why: 44hr OT is an amber visual flag, not a publish-blocker. "Enforces" overclaims and breaks the trust calibration.
Provenance: <unknown commit> -- product-capability copy across pitch artifacts.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Re-read the plan before EVERY slide change
Rule: Re-read `pitchdeck/build-plan.md` before every slide change.
Trigger: When iterating on any slide in the RAINBOW-PITCH build.
Why: The plan is the contract. Skipping the re-read drove three rounds of rework.
Provenance: <unknown commit> -- pitch build-plan.md iteration.
Tags: surface: prompt-kit, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- When a UI approach gets rejected 3+ times, stop iterating
Rule: After three rejections of a UI approach, stop tweaking and propose a different workflow (user-supplied screenshots, brief-back, etc.).
Trigger: When a UI approach has been rejected three or more times in a session.
Why: S58 burned 6 failed Slide 3 layouts before pivoting; tweak-number-four does not unlock the rejected design.
Provenance: S58 -- pitch Slide 3 -- 6 failed layouts before pivot.
Tags: surface: prompt-kit, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Build and deploy together when JR says "ship"
Rule: Chain `npm run build` with `vercel --prod --yes` in the same move when JR says "ship" on RAINBOW-PITCH slide copy.
Trigger: When JR says "ship" on a pitch-deck slide copy change.
Why: `npm run build` alone does not reach rainbow-pitch.vercel.app. Without the chained deploy, the change does not land.
Provenance: <unknown commit> -- RAINBOW-PITCH slide copy ship workflow.
Tags: surface: deploy, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Headed Playwright unreliable on Chromebook/Crostini
Rule: Do not rely on headed Playwright on Chromebook/Crostini for motion capture; use static photos + ffmpeg, phone screen-record, or CSS animation instead.
Trigger: When capturing motion or animation for pitch artifacts on Chromebook/Crostini.
Why: MCP playwright is OK for static screenshots but unstable for motion. `pitchdeck/capture/cover-loop.mjs` is a graveyard reference.
Provenance: <unknown commit> -- pitchdeck/capture/cover-loop.mjs graveyard.
Tags: surface: harness, concern: observability
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; agent-browser is current canonical driver per auto-memory feedback_playwright_always.

## [PROJECT] -- Pixel-detect modal bounds, do not guess ffmpeg offsets
Rule: Pixel-detect modal bounds with Python PIL luminance-jump; do not guess ffmpeg offsets.
Trigger: When cropping UI screenshots for the pitch deck.
Why: Hand-guessed ffmpeg offsets drift with viewport changes; pixel detection is deterministic across re-runs.
Provenance: <unknown commit> -- UI screenshot cropping for pitch.
Tags: surface: harness, concern: layout
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Pitch-deck UI screenshots on dark navy: 1px light-gray border, saturate(0.92), no device frames, no browser chrome
Rule: Frame pitch-deck UI screenshots on dark navy with a 1px light-gray border and `saturate(0.92)`; never add device frames or browser chrome; each photo gets its own `.card` with accent top border.
Trigger: When placing a UI screenshot on the Slide 3 layout (dark navy bg).
Why: Dark shadows are weak on dark bg and device frames compete with the screenshot. The light border + desaturation reads cleanly against navy.
Provenance: <unknown commit> -- Slide 3 layout.
Tags: surface: css, concern: layout
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Bumping typography size for new viewing distance needs ladder sweep
Rule: Raise display, subhead, card title, body, and eyebrow sizes together as a ladder when bumping typography for a new viewing distance.
Trigger: When changing typography size for a new viewing distance (e.g. TV).
Why: Inline `fontSize` overrides break hierarchy if any rung is skipped.
Provenance: S60 -- TV-viewing typography bump -- card fonts ended up larger than subheader.
Tags: surface: css, concern: layout
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Functional components + hooks only
Rule: Write all React components as functional components with hooks; never use class components.
Trigger: When adding or refactoring a React component in this repo.
Why: Repo-wide React style baseline; class components break uniformity for hook patterns used elsewhere.
Provenance: <unknown commit> -- React style baseline (legacy conventions.md).
Tags: surface: react, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; universal React baseline, easy to rederive.

## [PROJECT] -- Shared exports route through App.jsx
Rule: Import THEME, ROLES, formatDate, formatTimeDisplay, parseTime, and formatTimeShort from `src/App.jsx` (single source of truth).
Trigger: When importing any of THEME, ROLES, formatDate, formatTimeDisplay, parseTime, or formatTimeShort.
Why: Mobile files import from `./App` to avoid circular deps. Routing through `src/App.jsx` keeps the single source of truth intact.
Provenance: <unknown commit> -- legacy conventions.md.
Tags: surface: react, concern: dependency
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; related to active "Top-level ../App circular imports" rule.

## [PROJECT] -- `guardedMutation(label, fn)` wraps admin + employee mutations
Rule: Wrap admin approve/deny/revoke/cancel handlers and employee submit handlers in `guardedMutation(label, fn)`.
Trigger: When adding any admin or employee mutation handler.
Why: `guardedMutation` shows a "saving" toast during the 2-3s Apps Script round-trip and silently drops second-clicks via `actionBusyRef`. Without it, double-submits land twice.
Provenance: <unknown commit> -- admin approve/deny/revoke/cancel and employee submit handlers.
Tags: surface: react, concern: error-handling
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass; discoverable via grep `guardedMutation` in App.jsx.

## [PROJECT] -- Success toasts mention destination
Rule: Phrase guarded-mutation success toasts to name the destination (e.g. "moved to Settled history" rather than "approved").
Trigger: When writing a success-toast message after a guarded mutation.
Why: Destination-named toasts tell users where the row went. "Approved" alone leaves them hunting.
Provenance: <unknown commit> -- guarded-mutation success-message convention.
Tags: surface: react, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Titled employees show their title; untitled show their role
Rule: Render role/title pill from the shift owner; titled employees (Sarvi=GM, Joel=Owner) show their title, untitled show their role (Cashier, Stock).
Trigger: When rendering a role/title pill on a cell label, shift-detail sheet, PDF, or email.
Why: Title vs role distinction is the access-tier semantic surface; visible to staff to understand who's working in what capacity.
Provenance: 2026-04-27 -- s028 -- Sonnet audit caught hasTitle(currentUser) regression.
Tags: surface: react, concern: ux
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Past dates: headcount only, no target comparison
Rule: Render past dates with headcount only; do not color-code historical shortfalls against target.
Trigger: When rendering admin grid cells for dates earlier than today.
Why: Only current/future dates warn against target. Historical shortfalls are not actionable, so coloring them adds noise.
Provenance: <unknown commit> -- admin grid rendering convention.
Tags: surface: react, concern: render
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Overridden dates: cyan-tinted text
Rule: Render dates with per-date overrides as cyan-tinted text on the admin grid.
Trigger: When rendering admin grid cells where a per-date override differs from defaults.
Why: Cyan tint marks override vs default at a glance. Without the marker, overrides hide.
Provenance: <unknown commit> -- admin grid rendering convention.
Tags: surface: css, concern: render
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Pitch-facing copy uses "high-priced lawyer with charm" voice
Rule: Write pitch-deck copy and chatbot responses in a charming, force-of-logic trial-lawyer voice; first sentence is the answer; ban opening preamble, banned phrases, emoji peppering, and more than one exclamation mark per response.
Trigger: When writing or editing any pitch-deck or chatbot response copy.
Why: Soft openers, banned phrases, and emoji peppering break the trial-lawyer voice.
Provenance: s024 chatbot, s025 deck-wide (7 slides), s026 evidence-weave + Spec.jsx -- consistent across three sessions; PROPOSE GRADUATION (Affirmations 2).
Tags: surface: prompt-kit, concern: naming
Affirmations: 2
Moved: 2026-05-04 (s061) -- archive pass; high-affirmation pitch-voice rule preserved here for sibling RAINBOW-PITCH project reference.

## [PROJECT] -- The Carman family does not backfill Sarvi when scheduling breaks
Rule: Never imply family-side recovery work in pitch copy; show scheduling-crisis cost landing on Sarvi operationally, the business invisibly (payroll surprises, OT, lost sales), staff on floor, and single-point-of-failure risk on Sarvi.
Trigger: When writing pitch copy that touches scheduling-crisis recovery or family-firm operations.
Why: Family (Joel/Amy/Dan/Scott) does NOT cover missing staff; Sarvi absorbs all crisis recovery alone.
Provenance: s024 -- Ripple "FAMILY DESK" framing rejected; reframed to "INVISIBLE BILL" landing cost on business.
Tags: surface: prompt-kit, concern: naming
Affirmations: 0
Moved: 2026-05-04 (s061) -- archive pass.

## [PROJECT] -- Don't name JR personally in pitch DECK slides; spec/price body + footer + chatbot exempt
Rule: In pitch-deck slide copy refer to the product builder as "Rainbow" or "the developer", never "John"; allow named exemptions in Spec.jsx body, Spec.jsx + Price.jsx footer attributions, and the chatbot system prompt.
Trigger: When editing pitch-deck slide copy or any spec/price/chatbot artifact.
Why: Naming JR in slide copy reads as single-point-of-failure risk in family-firm sales context.
Provenance: s025 -- Proposal Card 3 + Phase2 footer; s026 Spec.jsx alignment respected scope.
Tags: surface: prompt-kit, concern: naming
Affirmations: 1
Moved: 2026-05-04 (s061) -- archive pass; covered by auto-memory feedback_no_personal_naming_in_deck.

<!-- ============================================================ -->
<!-- Pre-2026-05-04 archive entries below (existing pre-bulk pass) -->
<!-- ============================================================ -->

## [PROJECT] -- Trailing-underscore functions are hidden from Apps Script editor dropdown
Lesson: Apps Script functions ending with `_` are filtered out of the editor's function-name dropdown in the new editor UI. For one-shot migrations that need to be picked from the dropdown, provide a public wrapper (no underscore) that calls the underscore version.
Context: 2026-04-19 -- `widenAvailabilityForPK_` invisible in dropdown; added `runWidenAvailabilityForPK` wrapper. Both deleted after the one-shot ran.
Affirmations: 0
Moved: 2026-04-27 (s028) -- one-shot migration; wrapper function deleted; pattern unlikely to recur in active code paths.

## [PROJECT] -- AdaptiveModal hot-resize survives mid-modal without remount
Lesson: `useIsMobile()` resize listener triggers a re-render but React reconciles children; internal modal state (selected step, form fields) survives the bottom-sheet <-> centered-card switch. Worth trusting when rolling new AdaptiveModal call sites.
Context: Playwright smoke 2026-04-18 hot-resized 390->1280 mid-RequestTimeOffModal; modal transformed without closing or losing state.
Affirmations: 0
Moved: 2026-04-27 (s028) -- positive observation, not a pitfall; behaviour is now well-trusted across multiple modal sites.
