# Handoff - RAINBOW Scheduling App

Session 65. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S65 was a short day-before-demo session: closed out Meetings+PK Stage 9 docs (already on disk — just marked done in todo), swept the pitch-deck items off todo per JR ("the deck is finished"), and shipped a PDF fix so the Contact Admin row shows only Sarvi. Demo is **2026-04-15 (tomorrow)**. JR's explicit next pick from the post-demo queue is the **CF Worker stale-while-revalidate cache (~1 day)**. Open with: "Demo's today. Want to post-mortem after, or jump into the CF Worker now?"

## State

- Build: PASS at `0dc60b5`. Vercel auto-deployed `4477325`.
- Apps Script: v2.21.0 live (unchanged).
- Branch: main (clean, pushed).
- Tests: none.
- Last commit: `0dc60b5` — "S65 lesson: one clarifying question per directive"

## This Session

- **Stage 9 close** (`42db536`): verified schema doc, decisions entries, lessons, and CLAUDE.md Architecture wording all already on disk from S61-S64. Single todo.md edit.
- **Pitch-deck sweep** (`4e1d0f4`): JR stated deck finalized; Slide 3 layout + Slide 4 Col 3 revisit + schedule re-seed cleanup all marked closed in todo.
- **PDF Contact Admin filter** (`4477325`): new `PRIMARY_CONTACT_EMAIL` constant in `src/constants.js` mirrors backend `CONFIG.ADMIN_EMAIL` (`sarvi@rainbowjeans.com`); `src/pdf/generate.js` narrows `adminContacts` to Sarvi only with fallback to any active non-owner admin. Non-ASCII audit (Python unicodedata) cleared generate.js — only em-dash, bullet, middle-dot, ★ BLACK STAR remain, all system-font-safe. S62 `stripEmoji` continues to scrub dynamic content.

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/App.jsx` | No | CF Worker work: `API_URL` at the top of the file is the single flip point when the Worker is ready. |
| 2 | `backend/Code.gs` | No | CF Worker doesn't touch Apps Script, but review payload shape of `getAllData` before designing the cache key. |
| 3 | `src/constants.js` | Yes | If Sarvi's email ever changes, `PRIMARY_CONTACT_EMAIL` is the one line. Same constant can be reused for future single-contact rendering. |
| 4 | `src/pdf/generate.js` | Yes | Fallback branch lives inside `generateSchedulePDF`; if Sarvi's row is ever deactivated the PDF silently falls back to all admins. |

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| CF Worker cache | JR green-light + Cloudflare account hands-on | ~1 day. Plan: Worker proxy → Apps Script, KV cache 60s TTL, SWR on reads, writes bypass. Free tier. Zero migration risk — flip `API_URL` in App.jsx to toggle. |
| S62 2-tab settings split + retroactive-default fix | JR green-light ("on Friday") | ~4-day scope. |
| Consecutive-days 6+ warning (Sarvi request) | Sarvi answers: PTO breaks streak? single day resets? warning vs hard block? | Defaults if no answer: yes / yes / warning. |
| Post-demo Sarvi-reported items | 2026-04-15 demo outcome | Capture during/after meeting. |

## Key Context

- **Meetings+PK is fully shipped and documented**: Stages 1-9 all ✅. Do not re-open unless Sarvi reports a bug.
- **The original PDF todo entry referenced "jsPDF font subset" and "App logo emoji"** — both stale. PDF uses HTML + `window.open` + browser print, not jsPDF. S62 already scrubbed all emoji from generate.js. If anyone revisits this, the `jsPDF` claim is wrong.
- **The PDF Contact fallback** is a belt: `employees.find(e => e.email === PRIMARY_CONTACT_EMAIL && e.active && !e.deleted)` — if Sarvi's row is ever deactivated in the Sheet, PDF silently reverts to showing every active non-owner admin. Worth noting in case multi-admin support lands post-demo.
- **No INTEGRATION.md / PROJECT-ROUTING.md in this repo** — cross-project sync step skipped (not applicable).

## Verify On Start

- [ ] `git log --oneline -5` shows `0dc60b5` at HEAD
- [ ] `npm run build` passes
- [ ] If next task is CF Worker: re-read `docs/todo.md:38-41` (S45 path 1 spec) + `backend/Code.gs` `getAllData` payload shape before designing cache key. API_URL is in `src/App.jsx` near the top.
- [ ] If Sarvi reported demo issues: capture them in `docs/todo.md` Post-demo section before touching code.
