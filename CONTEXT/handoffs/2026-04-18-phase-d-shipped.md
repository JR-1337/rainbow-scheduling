<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-18 -- Phase D + follow-ups shipped, Playwright-verified

## Session Greeting

This session executed all of adversarial-audit Phase D in three sub-area commits, then ran a full Playwright smoke against prod on both mobile (390x844) and desktop (1280x800) viewports, then shipped a 6-item follow-up commit addressing observations found during smoke, and re-verified. Everything is pushed and live on origin/main at `b0851f8`. Phase E is NOT started. Read in this order: `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md` (top 8 entries are this session), `CONTEXT/LESSONS.md` (top 5 are this session), this file.

First reply format: 1-2 short sentences, `Pass-forward:` with only essential carryover, exactly one direct question about how to proceed. Default next step is the top `Active` TODO item.

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `b0851f8` == origin/main (0 ahead, 0 behind before this handoff commit)
- Working tree: this handoff write + TODO.md/DECISIONS.md/LESSONS.md CONTEXT sync; prior handoff deletion staged
- Prod: LIVE at https://rainbow-scheduling.vercel.app on bundle `index-pisXMHns.js` (verified via curl 2026-04-18 post-deploy)
- Apps Script: v2.22.0 deployed + Employees column U `defaultSection` live (no change this session)
- Build: `npm run build` PASS on `b0851f8` (465.06 kB)
- Audit plan file: `~/.claude/plans/adversarial-audit-fix-plan.md` (Phase A+B+C+D blocks now historical; Phase E still authoritative)

## This Session

1. **Phase D sub-area 1 (`ab1cb58`)**: New `src/components/Button.jsx` with 5 variants (primary / secondary / ghost / recoverable / destructive) x 3 sizes (sm 36 / md 44 / lg 48) + `leftIcon` / `rightIcon` / `iconSize` / `fullWidth` / `disabled`. Migrated 13 call sites: MobileStaffPanel chip + Edit + Reactivate + Remove + Restore + Add Employee, MobileAdminDrawer 7 action buttons.
2. **Phase D sub-area 2 (`e64838b`)**: New `src/components/AdaptiveModal.jsx` with mobile/desktop branch via `useIsMobile()`. Mobile path reuses `MobileBottomSheet`; desktop is centered overlay card with `headerGradient` + `headerExtra` + sticky `footer` slots, `max-h-85vh` scrollable body. Migrated `RequestTimeOffModal`, `OfferShiftModal`, `SwapShiftModal` -- dropped per-modal Escape listeners + `if (!isOpen) return null` gates (AdaptiveModal owns them). Step-indicator in SwapShift kept inside body.
3. **Phase D sub-area 3 (`41f2f28`)**: Icon scale sweep (12/14/16/20) in MobileAdminView. Four sites bumped 10->12 (Edit3 hint, Loader, Save) and 13->14 (Mail, User). Left as exceptions: Edit3 size=9 pencil overlay in schedule header cell, Star size=8 task marker in packed cell (both cell-constrained).
4. **Playwright smoke round 1** on `index-BAi60peB.js`: mobile drawer 7 Buttons render, drawer auto-close on Staff tap, Staff sheet Edit/Reactivate/Remove/Restore/Add, reactivate-roundtrip (Inactive 1->0 live), RequestTimeOffModal mobile + hot-resize to desktop centered-card. Signed out, signed in as Alex (reactivated first). OfferShiftModal mobile + desktop (pink gradient, sticky Cancel+Send Offer footer). SwapShiftModal mobile + desktop (step indicator, accent gradient, sticky footer). EmployeeFormModal save-roundtrip (re-inactivated Alex; Active 25->24, Inactive 0->1). All 13 checks green, no console errors.
5. **Follow-up commit (`b0851f8`)** addressing smoke observations:
   - `THEME.modal.swap.accent` = `#7C3AED` violet, `THEME.modal.offer.accent` = `#EC4899` pink. Non-rotating identity colors so modal headers don't follow the daily OTR_ACCENT rotation.
   - SwapShiftModal all `THEME.accent.purple` -> `THEME.modal.swap.accent` (header, step indicators, selected shift / partner accents, summary card). Submit-button brand gradient (blue->rotating purple) preserved as primary-action convention.
   - OfferShiftModal `THEME.accent.pink` -> `THEME.modal.offer.accent` (pink was aliased to OTR_ACCENT.primary and rotating).
   - Offer/Swap filter `shiftDate >= tomorrow` -> `shiftDate >= today`; dropped unused `tomorrow` local in both.
   - RequestTimeOffModal: admin-blocked types filtered out via `!isAdmin && { ... }` + `.filter(Boolean)` instead of rendered disabled with "Employees Only" badge.
   - Button.jsx: 6th variant `destructiveOutline` (tertiary bg + error-red text + subtle error border). MobileAdminDrawer Sign Out switched to `variant="destructiveOutline"`; style override removed.
6. **Playwright smoke round 2** on `index-pisXMHns.js`: admin sees only "Days Off" card (Shift Swap + Take My Shift hidden); Sign Out destructiveOutline renders as before (variant-driven); signed in as Alex -- Offer modal pink header survives orange OTR rotation day; Swap modal violet header + violet "1" step indicator survives; re-inactivated Alex; state restored.
7. Wrote `memory/reference_default_passwords.md` capturing `emp-XXX` hyphenated / zero-padded by Sheets row pattern. Added to MEMORY.md index.
8. CONTEXT syncs: TODO.md Active trimmed (Phase D removed), Completed gained 2 entries (Phase D + follow-ups), Verification updated with b0851f8 bundle hash. DECISIONS.md gained 7 new entries at the top. LESSONS.md gained 5 new `[PROJECT]` lessons (rotating-token identity smell, style-override smell, AdaptiveModal hot-resize, AdaptiveModal mobile icon gap, Alex Kim canonical employee-smoke dance). ARCHITECTURE.md unchanged (no structural shift worth a rewrite; Button + AdaptiveModal primitives land under src/components/ as expected).

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `CONTEXT/TODO.md` | Top Active: Sarvi-batch + Phase A+B+C save-failure smoke; Phase E queued |
| 2 | `~/.claude/plans/adversarial-audit-fix-plan.md` | Phase E (App.jsx extraction multi-session + unused-imports + plaintext pw + PDF XSS) still authoritative |
| 3 | `src/components/Button.jsx` | 6 variants x 3 sizes. Reference for any new inline-button migration |
| 4 | `src/components/AdaptiveModal.jsx` | Mobile sheet / desktop card adapter. headerGradient + footer + headerExtra slots |
| 5 | `src/theme.js` | New `THEME.modal.swap/offer.accent` non-rotating identity tokens |
| 6 | `src/modals/OfferShiftModal.jsx` + `SwapShiftModal.jsx` | Reference implementations of AdaptiveModal with headerGradient + footer + filter `>= today` |
| 7 | `src/modals/RequestTimeOffModal.jsx` | Reference for conditional-option arrays via `!flag && {...}` + `.filter(Boolean)` |
| 8 | `src/MobileAdminView.jsx:60-145` | Drawer with 7 migrated Buttons + destructiveOutline Sign Out |

## Anti-Patterns (Don't Retry)

- Do NOT add a `style={{ backgroundColor, color, border }}` override to a `<Button variant="...">`. If you need the override, codify as a new variant. (since S67 — destructiveOutline was the first precedent)
- Do NOT use `THEME.accent.pink` / `THEME.accent.purple` for per-modal identity colors. Those are aliased to `OTR_ACCENT` and rotate daily. Use `THEME.modal.*.accent` for fixed identity. (since S67)
- Do NOT skip Playwright smoke after landing a new primitive. Round-1 smoke surfaced 6 actionable items on this session that would otherwise have sat in the handoff. (since S67)
- Do NOT assume `AdaptiveModal` icon + iconColor propagate to mobile. MobileBottomSheet has no icon slot; mobile path uses title-only. (since S67)
- Do NOT hand JR a phone-smoke checklist without first `git push origin main` and telling him "pushed, Vercel redeploys in ~60s, hard-refresh first." (since S66)
- Do NOT put "reopen parent sheet after modal close" logic inline in the Modal's `onClose` via a useState flag. Use a ref + useEffect on the open-flag. (since S66)
- Do NOT optimistically `setEmployees(...)` without first capturing `prevEmployees = employees` and reverting on `!result.success`. (since S66)
- Do NOT suppress `overscroll-behavior` / `touch-action` on html/body/#root to kill pull-to-refresh. JR rejected twice. (since S66)
- Do NOT bump EmployeeFormModal z-index to stack above MobileStaffPanel. Accepted pattern is drawer auto-close + sheet-reopen-on-form-close. (since S65)
- Do NOT hand-sweep "unused" imports in App.jsx without programmatic cross-check. S40.3 white-screen precedent. (graduated lesson)
- Do NOT ask about the parked Staff-cell action menu. Silent until JR reopens. (since S66)

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind:

- Sarvi-batch + Phase A+B+C save-failure smoke -- waiting on Sarvi Monday 2026-04-19.
- Backup-cash role clarification -- waiting on Sarvi.
- Payroll aggregator -- waiting on Sarvi Counterpoint / ADP discovery.

## Key Context

- JR's executor-stopping-points cadence: A+B -> verify -> C -> verify -> D -> verify -> E. Phase D + follow-ups are VERIFIED. Phase E is the next landing zone. Pre-requisite was Sarvi-absent save-failure smoke by JR; JR opted to push through with Phase D verification via Playwright instead. Both paths are now green.
- Phase E is risky (App.jsx extraction multi-session). One commit per sub-area, review gate between -- same cadence as Phase D.
- "Promo" at OTR means commission payments tracked in a physical receipt box (NOT promotional staffing).
- AdaptiveModal expansion candidates beyond the 3 migrated: `AdminRequestModal`, `ShiftEditorModal`, `PKEventModal`, `EmailModal`, `ChangePasswordModal`, `EmployeeFormModal`. Only migrate after confirming none of them have a dealbreaker custom shell. (`EmployeeFormModal` has a Remove-button footer convention already close to AdaptiveModal's footer slot.)
- Every drawer action-handler in App.jsx:3233+ still closes the drawer first. Keep this convention for any new drawer button.
- Default test account: `emp.001@example.com` / `emp-001` (Alex Kim). Account is Inactive by default; reactivate via Staff panel to sign in, re-inactivate via EmployeeFormModal `Set Inactive` + Save before signing out.

## Verify On Start

- `git status` -- expect clean-ish (may be working-tree-dirty if this handoff ceremony is incomplete)
- `git log --oneline -5` -- top should be this handoff commit; below it `b0851f8`, `41f2f28`, `e64838b`, `ab1cb58`
- `git rev-list --left-right --count origin/main...HEAD` -- `0  0` confirms synced
- `npm run build` -- should PASS (~465 kB)
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- expect `index-pisXMHns.js` (unless a later deploy has superseded)
- Confirm with JR whether to start Phase E now or hold for Sarvi-batch smoke result on 2026-04-19

## Next Step Prompt

Default next step per TODO Active top: wait on JR's Wi-Fi-off save-failure smoke result + Sarvi-batch Monday smoke. If JR wants to proceed, ask whether to (a) start Phase E sub-area 1 (unused-imports sweep, mechanical only) or (b) expand AdaptiveModal to the remaining admin modals as a Phase D follow-up before Phase E.

If JR opens a new topic instead (e.g. reopens the parked Staff-cell action menu, or returns to Sarvi-batch smoke), follow him -- do not push Phase E on him.
