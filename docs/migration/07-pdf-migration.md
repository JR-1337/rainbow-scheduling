# PDF Migration Plan-Data

**Last refreshed: 2026-04-29**

Research-only artifact. No code changes. Source class on every claim:
- **C** = codebase (path:line)
- **VD** = vendor technical docs (URL)
- **VM** = vendor marketing copy (URL, flagged)
- **IM** = independent measurement (cite)

---

## 1. Current PDF surfaces (factual)

### 1a. Generation sites (where PDFs come from today)

| Surface | Location | Technique |
|---|---|---|
| Schedule "Export PDF" / "Print" | Frontend `src/pdf/generate.js` | Builds an HTML document string, wraps it in a `Blob({type:'text/html;charset=utf-8'})`, opens it in a new tab via `window.open(url,'_blank',...)`. The opened document has an in-page "Print Schedule" button that calls `window.print()`; the user then chooses "Save as PDF" in the browser print dialog. There is no programmatic PDF binary produced. **C**: `src/pdf/generate.js:333-352` |
| Apps Script backend | `backend/Code.gs` | **No PDF generation exists today.** Only `Utilities.newBlob` calls in Code.gs are at lines 503 and 508, both inside `base64UrlEncodeString_` / `base64UrlDecodeToString_` — used as base64 helpers for JWT, not for PDF. There is no `getAs('application/pdf')` anywhere in Code.gs. **C**: `backend/Code.gs:503,508`; grep result 4 hits, none PDF |
| `sendBrandedScheduleEmail` | `backend/Code.gs:2144-2166` | Accepts pre-built HTML from the frontend EmailModal and calls `MailApp.sendEmail({htmlBody, body, ...})`. **No attachment parameter, no PDF.** **C**: `backend/Code.gs:2159` |

The 03-appscript-inventory.md already records this: **"pdf-vendor: 0 (no PDF generation detected)"**. **C**: `docs/migration/03-appscript-inventory.md:12`

### 1b. Current technique (frontend print-preview)

- **Layout**: A4 portrait, 3 pages by intent. Pages 1+2 = staff weeks (Sarvi + non-admin schedulables). Page 3 = other admins, announcement box, role/event legend, contact line, footer. Page-break enforced via CSS `break-before: page` on `.wk-block.staff + .wk-block.staff` and `.page-3`. **C**: `src/pdf/generate.js:254-263, 310-329`
- **Color regime**: Pure greyscale. No hue-based information (printer is B&W). Role signal carried by glyph (C1, C2, B, M, W, FS, FM) + border style. Holiday = "HOL" caption + heavy black top border. Announcement = double border + italic + "[!]" prefix. **C**: `src/pdf/generate.js:1-4, 17-27, 96, 79`
- **Font**: Inter (body) + Josefin Sans (header wordmark) loaded via `https://fonts.googleapis.com/css2?...&display=swap`. Network dependency at print time. **C**: `src/pdf/generate.js:244`
- **Output**: HTML doc, not a PDF binary. User must press the in-page "Print Schedule" button, then pick "Save as PDF" in the browser print dialog. **C**: `src/pdf/generate.js:300, 246-265`

### 1c. Sarvi-iPad / Safari constraints (LESSONS.md)

| Constraint | Source |
|---|---|
| HTML must declare `<meta charset="utf-8">` AND the Blob `type` must include `;charset=utf-8`, else iOS Safari falls back to Latin-1 and multi-byte chars (em-dash, bullet) render as garbage glyphs ("ae"). | `CONTEXT/LESSONS.md:91-93` |
| Keep em-dashes out of source HTML entirely. ASCII hyphens only. (Belt-and-braces against charset failures.) | `CONTEXT/LESSONS.md:92` |
| iOS Safari ignores `<a download>` on blob URLs and saves the blob as `*.blob`. Popup-blocked fallback must navigate the current tab to the blob URL — never use `<a download>`. | `CONTEXT/LESSONS.md:92`; `src/pdf/generate.js:343-348` |
| `window.open` must be called synchronously inside the click handler, BEFORE `await import('./pdf/generate')`. After `await`, browsers (Chrome + Safari) block popups for losing the user-gesture link. App passes a pre-opened blank tab as `targetWindow`. | `CONTEXT/LESSONS.md:204-206`; `src/pdf/generate.js:53, 335-339` |
| `-webkit-line-clamp` does not render in print popup; use `word-break` instead. | `CONTEXT/LESSONS.md:204-206` |

### 1d. Planned-but-unbuilt feature: EmailModal v2 PDF attachment

From `CONTEXT/TODO.md:28`:

> "PDF attachment for EmailModal v2 — produce PDF blob server-side via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`, attach to MailApp send. Frontend POSTs the print-preview HTML doc (already exists) to a new action. No new frontend deps."

Notes:
- The TODO is written against the current Apps Script architecture. `Utilities.newBlob(html, 'text/html').getAs('application/pdf')` is a Google-Apps-Script-only API surface; it has no Supabase/Vercel equivalent. **VD**: https://developers.google.com/apps-script/reference/utilities/utilities#newblobdata,-contenttype
- The proposed flow in the TODO is: frontend builds the HTML doc (already done by `src/pdf/generate.js`) → POST to a new Apps Script action → backend converts via `getAs('application/pdf')` → attached via `MailApp.sendEmail({attachments:[...]})`.
- After Supabase migration, the GAS conversion step disappears and must be replaced by one of the architectures in §3.
- Status: NOT BUILT. EmailModal currently sends HTML-only via `sendBrandedScheduleEmail` (`backend/Code.gs:2144-2166`); no `attachments` field, no PDF. **C**: `backend/Code.gs:2159`; `src/modals/EmailModal.jsx` (no `pdf|attachment|Blob|getAs` matches)

---

## 2. Library option matrix

Cells marked **VM** are vendor-marketing claims and are flagged as such.

| Library | Bundle (gzip, client-side use) | Layout fidelity to current HTML | UTF-8 / custom fonts | Image embedding | Page-break control | License | Maintenance |
|---|---|---|---|---|---|---|---|
| **jsPDF** v2.5+ | ~150 kB minified / ~50 kB gzipped core; +~100 kB if `jspdf-autotable` plugin used **IM**: bundlephobia.com/package/jspdf | LOW. Imperative draw API (`doc.text(x,y,...)`, `doc.rect(...)`). To render existing HTML you add `jspdf.html()` which uses `html2canvas` internally, rasterising to image (text not selectable). **VD**: https://github.com/parallax/jsPDF | UTF-8 needs explicit custom-font registration (`doc.addFont`, TTF as base64). Default fonts are PDF Type-1 (no full Unicode). **VD**: https://github.com/parallax/jsPDF/blob/master/docs/jspdf.md | Yes; `addImage` for PNG/JPEG. Fonts must be base64-embedded. | Manual (`doc.addPage()`); no CSS `break-before` semantics. | MIT | Active; 5k+ commits; latest release 2024 **VD**: https://github.com/parallax/jsPDF/releases |
| **pdf-lib** | ~330 kB min / ~100 kB gzipped **IM**: bundlephobia.com/package/pdf-lib | LOW. Primitive PDF object model — draw text, lines, rectangles. Designed for editing existing PDFs (forms, watermarks), not for rendering HTML. **VD**: https://pdf-lib.js.org/ | Custom font via `pdfDoc.embedFont(fontBytes)`; supports any TTF/OTF. | Yes (`embedPng`, `embedJpg`). | Manual page management. | MIT | Active. **VD**: https://github.com/Hopding/pdf-lib |
| **pdfmake** | ~1.0 MB minified / ~280 kB gzipped (includes Roboto by default) **IM**: bundlephobia.com/package/pdfmake | MEDIUM. Declarative JSON document spec (tables, columns, stacks). NOT HTML — would require rewriting `generate.js` HTML logic to pdfmake's DSL. **VD**: http://pdfmake.org/ | Built-in vfs_fonts (Roboto). Custom fonts via vfs_fonts builder. | Yes (data URIs or external). | Built-in `pageBreak: 'before'`. | MIT | Active; v0.2.x line. **VD**: https://github.com/bpampuch/pdfmake |
| **@react-pdf/renderer** | ~700-900 kB minified / ~250 kB gzipped **IM**: bundlephobia.com/package/@react-pdf/renderer | MEDIUM. React component model with a custom layout engine (Yoga/flexbox) — NOT a browser renderer. CSS subset only; no `break-before` keyword exact match (uses `<View break>` prop). **VD**: https://react-pdf.org/ | Custom fonts via `Font.register({src})`. | Yes (`<Image>`). | Component prop `break` or `wrap={false}`. | MIT | Active; v3.x. **VD**: https://github.com/diegomura/react-pdf |
| **Puppeteer** (Node) | N/A client-side. ~280 MB for full Chromium download server-side **VD**: https://pptr.dev/guides/installation — chromium download size noted at install | HIGHEST. Renders HTML in a real headless Chrome → exact CSS print fidelity (`@page`, `break-before`, `@media print`, custom fonts via Google Fonts URL). | Full browser stack: any UTF-8, any web font (incl. external CSS imports). | Full browser image stack. | Full CSS print spec. | Apache-2.0 | Active; maintained by Chrome team. **VD**: https://github.com/puppeteer/puppeteer |
| **Playwright** (Node) | N/A client-side. Chromium browser binary similar size to Puppeteer **VD**: https://playwright.dev/docs/browsers | HIGHEST (same as Puppeteer — also Chromium-based). `page.pdf()` only works in Chromium channel; not WebKit/Firefox. **VD**: https://playwright.dev/docs/api/class-page#page-pdf | Same as Puppeteer. | Same as Puppeteer. | Full CSS print spec. | Apache-2.0 | Active; Microsoft. **VD**: https://github.com/microsoft/playwright |

**Bundle-size note**: Numbers above are unverified by us at this exact date. Treat as IM-from-bundlephobia ranges, not point measurements. Re-measure before committing to a client-side option.

---

## 3. Architecture options

| Architecture | Cold start | Memory / runtime cost | Layout fidelity | Secret management | Notes |
|---|---|---|---|---|---|
| **A. Client-side library** (jsPDF, pdf-lib, pdfmake, react-pdf bundled into the SPA) | None (already loaded). Lazy-import keeps initial bundle smaller. | Browser RAM only; user's device. | LOW–MEDIUM (depends on library; see §2). None matches current HTML print exactly. | N/A. | Sarvi's iPad executes the generation. iPad Safari has historically been the breakage surface (LESSONS.md §1c). |
| **B. Vercel serverless function + Chromium** (Puppeteer or Playwright on a Vercel Node function with `@sparticuz/chromium`) | Cold-start 1-3s typical for chromium-on-lambda **IM**: https://github.com/Sparticuz/chromium/issues — multiple reports in 1-3s range. **VD**: https://github.com/Sparticuz/chromium README documents Lambda-size targeting. Vercel max function bundle 50 MB unzipped on Hobby/Pro **VD**: https://vercel.com/docs/functions/limitations | Memory: 1024 MB recommended for Chromium **VD**: https://github.com/Sparticuz/chromium#install. Vercel max 3008 MB on Pro **VD**: https://vercel.com/docs/functions/runtimes#size-limits | HIGHEST (real Chromium). | Vercel Environment Variables. | `@sparticuz/chromium` bundles a Lambda-optimized chromium binary (~50 MB compressed) within the 50 MB unzipped Vercel limit. **VD**: https://github.com/Sparticuz/chromium README |
| **C. Supabase Edge Function** (Deno runtime) | ~50-200ms typical Deno cold start **VM** flagged: https://supabase.com/docs/guides/functions ("Edge Functions are globally distributed, low-latency"). Independent benchmarks: e.g. https://deno.com/blog/anatomy-isolate-cloud (vendor) — flagged **VM**. | Memory limit 256 MB on Edge Functions **VD**: https://supabase.com/docs/guides/functions/limits | LOW–MEDIUM. Deno cannot run Chromium (no Chromium binary, no native Node). Available Deno PDF libs: `jsPDF` via npm-compat, `pdf-lib` via npm-compat, deno-puppeteer (calls a remote Chrome). No deno-native HTML→PDF Chromium-in-process. **VD**: https://docs.deno.com/runtime/manual/node/npm_specifiers; https://deno.land/x/puppeteer | Supabase Vault. | Edge function would need to call out to a remote Chrome (Browserless etc.) or use a non-HTML library. |
| **D. Vendor service** (Browserless, ApiFlash, PDFShift, DocRaptor) | Vendor-managed; ~100-500ms typical (vendor-claimed) **VM** flagged | Per-API-call cost. Browserless: from $200/mo for 10k requests **VM** flagged: https://www.browserless.io/pricing. ApiFlash: free tier 100 req/mo **VM** flagged: https://apiflash.com/pricing. PDFShift: from $9/mo 50 docs **VM** flagged: https://pdfshift.io/pricing. DocRaptor: from $15/mo 125 docs **VM** flagged: https://docraptor.com/pricing | HIGHEST when Chromium-based (Browserless = real Chromium); MEDIUM for HTML-renderer services. | API key in Vercel/Supabase env. | Adds an external dependency to the schedule-export critical path. |

**Vercel-specific caveats** (architecture B):
- `chrome-aws-lambda` (older) is deprecated; the maintained fork is `@sparticuz/chromium`. **VD**: https://github.com/alixaxel/chrome-aws-lambda#deprecation; https://github.com/Sparticuz/chromium
- Vercel Pro function bundle limit: 50 MB unzipped. `@sparticuz/chromium` README states it fits inside the AWS Lambda 50 MB layer limit. **VD**: https://github.com/Sparticuz/chromium#install; https://vercel.com/docs/functions/limitations
- Vercel function execution duration: Hobby max 10s, Pro max 60s, Enterprise max 900s **VD**: https://vercel.com/docs/functions/configuring-functions/duration

**Supabase Edge Function specifics** (architecture C):
- Runtime: Deno 1.x **VD**: https://supabase.com/docs/guides/functions/runtime
- npm specifiers supported (`import { ... } from 'npm:jspdf'`) **VD**: https://supabase.com/docs/guides/functions/import-maps
- Cannot bundle a chromium binary inside a 256 MB memory / function size budget. **VD**: https://supabase.com/docs/guides/functions/limits

---

## 4. Layout fidelity check

The current `src/pdf/generate.js` produces an HTML document with:
- Inline CSS styles tied to mm units (`8.5mm` cell heights, `5mm` page margins, A4 portrait `@page`).
- CSS print rules: `break-before: page`, `page-break-inside: avoid`, `display: table-header-group`, `-webkit-print-color-adjust: exact`.
- Web fonts via Google Fonts CSS import.
- Greyscale-only palette enforced by hand.

**C**: `src/pdf/generate.js:246-296`

Fidelity tradeoffs by library family:

| Family | Fidelity to current HTML print |
|---|---|
| Imperative draw API (jsPDF without `html()`, pdf-lib) | None. Would require rewriting the entire layout in their primitive API. |
| Imperative + html2canvas (jsPDF `.html()`) | Rasterises HTML → image embedded in PDF. Text is not selectable, multi-page splits often break grid rows mid-cell. **VD**: https://html2canvas.hertzen.com/ documents the canvas-first approach. |
| pdfmake | None to current HTML. Would require porting `generate.js` to pdfmake's JSON DSL (tables/columns/stacks). |
| @react-pdf/renderer | Partial. React component tree but custom Yoga layout engine — no `@page`, no full CSS print spec. Would require porting. |
| Puppeteer / Playwright (Chromium) | Exact. Chromium parses the existing HTML and runs the same `@media print` rules. Output is a real PDF (selectable text), not a rasterised image. `page.pdf({format:'A4'})` honors `@page`, `break-before`, `print-color-adjust`. **VD**: https://pptr.dev/api/puppeteer.page.pdf; https://playwright.dev/docs/api/class-page#page-pdf |

**Implication**: Anything that is not browser-rendered will require rewriting `generate.js`. Browser-rendered (Puppeteer/Playwright) preserves the existing HTML investment as-is.

---

## 5. Email attachment workflow

The TODO at `CONTEXT/TODO.md:28` describes the intended UX: send schedule email with PDF attached.

### 5a. Generate-then-attach paths

| Path | Steps |
|---|---|
| Inline binary attachment | (1) Frontend or server generates PDF binary. (2) Vercel/Edge function attaches PDF bytes to outbound email via Resend/SendGrid. (3) Recipient gets email with attachment. |
| Storage link | (1) PDF generated. (2) Uploaded to Supabase Storage with a signed URL or public URL. (3) Email body contains a link, not an attachment binary. |

### 5b. Vendor attachment size limits

| Vendor | Inline attachment max | Source |
|---|---|---|
| Resend | 40 MB combined per email **VD**: https://resend.com/docs/api-reference/emails/send-email | Resend docs |
| SendGrid | 30 MB total per email **VD**: https://docs.sendgrid.com/api-reference/mail-send/mail-send | SendGrid docs |
| Postmark | 10 MB total per email **VD**: https://postmarkapp.com/developer/api/email-api | Postmark docs |
| MailApp (current Apps Script) | 25 MB per message; quota of 100 recipients/day on consumer / 1500 on Workspace **VD**: https://developers.google.com/apps-script/guides/services/quotas | GAS quotas |

The current 14-day schedule PDF is text-only and likely well under 100 KB; size limits are not a binding constraint for this content.

### 5c. Supabase Storage as intermediate

- Bucket public or signed URL **VD**: https://supabase.com/docs/guides/storage
- Signed URLs default 7-day TTL configurable **VD**: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl
- Tradeoff: linked PDFs are easier on email size budgets but break offline ("Sarvi forwards the email to staff who open later") and add a public asset to the security model.

---

## 6. Migration sequencing options

| Phase | Scope |
|---|---|
| **Phase 1: parity-only** | Move the existing print-preview HTML generator to the new architecture as-is. Frontend `src/pdf/generate.js` is environment-agnostic (no Apps Script calls); it works unchanged after migration. EmailModal v2 PDF attachment NOT shipped. Risk: zero new PDF surface, only relocating the SPA. |
| **Phase 2: EmailModal v2 PDF attachment** | Pick architecture from §3 (B/C/D). Wire frontend EmailModal to: (a) generate the existing HTML doc, (b) POST it to a server endpoint (or generate client-side), (c) receive PDF binary, (d) include in email send. Replaces the planned `Utilities.newBlob().getAs('application/pdf')` flow. |
| **Phase 3 (optional): replace print-preview entirely** | If Sarvi prefers a deterministic single-click "download PDF" UX over the browser print dialog, swap the current HTML-print flow for a real PDF generator. Acceptable only if Phase 2 architecture proves stable. |

The phases are independent: Phase 1 can ship without Phase 2 ever shipping; Phase 3 is gated on Phase 2.

---

## 7. Cutover risks

| Risk | Mitigation surface |
|---|---|
| iPad Safari rendering regressions: any new generator must pass the LESSONS.md rules (UTF-8 charset, no em-dashes, no `<a download>` for blob URLs, synchronous popup open before await). **C**: `CONTEXT/LESSONS.md:91-93,204-211` | Re-test Sarvi's iPad after any swap. The current `src/pdf/generate.js:333-348` already encodes these rules. |
| Bundle-size hit if a client-side PDF library is chosen | Lazy-import (already done for `generateSchedulePDF` per LESSONS.md `:210-212`). Verify gzipped bundle delta against current `~/dist` baseline before commit. |
| Cold-start latency if Vercel function chosen | First request after idle adds 1-3s (chromium init). Warm requests <500ms. UX impact: schedule export feels sluggish on first click of the day. |
| Vercel 50 MB function bundle limit | `@sparticuz/chromium` ~50 MB compressed fits, but other deps must stay slim. **VD**: https://vercel.com/docs/functions/limitations |
| Supabase Edge Function 256 MB memory ceiling | Chromium will not fit. Edge function must call out to a vendor (Browserless) or a Vercel function — adds a hop. **VD**: https://supabase.com/docs/guides/functions/limits |
| Vendor lock-in if external PDF service chosen | Browserless / PDFShift API contracts; pricing tier overruns; outage on schedule day. |
| Font fallback: current HTML uses Google Fonts via external `<link>`. In a serverless renderer, network call adds latency and a failure mode. | Embed font binaries in the renderer or accept system-font fallback. |
| Loss of "Print" path: replacing print-preview with a server-generated PDF removes user's ability to tweak via browser print dialog (paper size, scale). | Phase 3 only after Sarvi confirms; Phase 2 leaves print-preview intact. |
| `sendBrandedScheduleEmail` known auth bug: checks `authResult.success` but `verifyAuth` returns `{authorized}` not `{success}`. Will silently 401 if hit. **C**: `docs/migration/03-appscript-inventory.md:725-727` | Fix during the migration, not before — affects whether the existing email flow is verifiable end-to-end. |

---

## 8. Flag-out

Items the main session should double-check:

1. **PDF-vendor count is zero today, not eight.** The task brief mentions "8 pdf-vendor functions" but `docs/migration/03-appscript-inventory.md:12` records "pdf-vendor: 0 (no PDF generation detected)" and grep on Code.gs confirms no `getAs('application/pdf')` and no PDF-bearing `Utilities.newBlob`. The `8` figure may have been confused with `email-vendor: 24` or `removed: 8`. Confirm before treating PDF as an existing migration surface — today it is purely a future-feature surface.
2. **Bundle-size figures in §2 are bundlephobia ranges**, not point measurements taken now. Re-run `npx bundlephobia <pkg>` or build a probe vite bundle before committing to a client-side library on size grounds.
3. **Vendor cold-start numbers in §3** for Vercel + chromium are anecdotal community ranges (1-3s); independent measurement on the actual Vercel project would be needed before treating them as deployment SLAs.
4. **Supabase Edge Function memory limit (256 MB)** is documented at https://supabase.com/docs/guides/functions/limits as of the cutoff but Supabase has changed limits before; verify current value at migration time.
5. **MailApp daily quotas**: post-migration the existing 100/1500-per-day quota disappears. Resend free tier is 100/day, 3000/month; SendGrid free is 100/day **VM** flagged (vendor pricing pages). Confirm OTR's actual outbound email volume before picking a tier.
6. **TODO.md line 28's proposed flow** ("frontend POSTs the print-preview HTML doc to a new action") was written for the Apps Script architecture. After Supabase migration, the "new action" is a Vercel function or Edge Function, not a `doPost`. Re-read the TODO with that translation in mind before scoping.
7. **No measurement** of whether `src/pdf/generate.js`'s greyscale-glyph design is preserved exactly under Chromium's `page.pdf()` vs the user's current "browser print → save as PDF" path. Phase 1 should include a side-by-side print-paper test on Sarvi's printer before declaring parity.
8. **Scope drift risk**: the brief asks for "EmailModal v2 PDF attachment" plan-data, but the same architecture choice also constrains future server-side rendering needs (e.g., scheduled weekly PDF auto-email, payroll aggregator export). Architecture B (Vercel + Chromium) generalises beyond email; architecture C (Edge + vendor) does not.
