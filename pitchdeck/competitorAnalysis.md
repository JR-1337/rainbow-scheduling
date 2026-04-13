# Why off-the-shelf scheduling apps fail Ontario retail stores

**None of the three leading scheduling apps — 7shifts, When I Work, or Deputy — supports Ontario Employment Standards Act compliance out of the box.** All three default to US-centric labor rules (40-hour overtime thresholds, no 3-hour minimum pay enforcement, no 11-hour rest period validation), forcing a small Ontario retail store to manually configure, verify, and monitor compliance with zero automated guardrails. Combined with broken ADP Canada integrations, persistent mobile app reliability issues, and per-user pricing models that punish part-time retail workforces, these platforms create a gap between what small Ontario retailers actually need and what US-focused SaaS products deliver.

Each app was evaluated across eight dimensions critical to a 15–20 employee single-location Ontario retail store: ESA compliance, custom floor roles with visual colour-coding, ADP Workforce Now integration, mobile app quality, pricing, customer support, data portability, and retail-specific fit.

---

## Ontario ESA compliance is an afterthought in all three apps

The Ontario Employment Standards Act imposes three scheduling-related rules that differ materially from US standards: a **44-hour weekly overtime threshold** (not 40), a **3-hour minimum pay rule** when employees report for a scheduled shift, and an **11-hour minimum rest period** between shifts. None of the three apps enforces all three out of the box.

**7shifts** comes closest. When you select Ontario as your jurisdiction, it auto-populates some labour settings and supports a configurable overtime threshold. Its help documentation explicitly references "Reporting Pay" for Canadian provinces, noting that employees scheduled but sent home early are entitled to at least 3 hours at minimum wage. However, the critical 11-hour rest period between shifts is not documented for Ontario — 7shifts markets "clopening prevention" but its compliance documentation details California, New York City, and Philadelphia rules, not Ontario's specific 11-hour requirement. Compliance features require the **Pro tier at $79.99/month**, making them inaccessible on the free or Essentials plans.

**When I Work** defaults to a 40-hour weekly overtime threshold. Administrators can manually change it to 44 hours, but no Canadian province template exists to auto-configure it. There is **no mechanism for 3-hour minimum pay enforcement** — if a manager schedules a 2-hour shift, no warning appears. There is **no rest-period-between-shifts rule** or scheduling constraint. As one Connecteam analysis noted: *"It would have been beneficial to have some compliance support, such as warnings if your policies haven't met the legal leave requirement."* Ontario ESA compliance is entirely the employer's burden.

**Deputy** also defaults to 40-hour US overtime. Its much-marketed "Award Interpretation" feature — which automatically calculates complex pay rules — is **designed exclusively for Australian Modern Awards** under the Fair Work system and does not apply to Ontario or any Canadian jurisdiction. Deputy's "Labour Law Compliance" feature, available from the Lite tier ($5/user/month), focuses on US Fair Workweek laws and meal/rest break rules in American cities. No automated 3-hour minimum pay enforcement or 11-hour rest period validation exists. Custom pay rules can be configured manually, but this requires navigating Deputy's complex pay-rule builder and verifying accuracy without any system-provided guardrails.

The practical consequence is identical across all three: an Ontario store owner must research ESA requirements independently, manually configure every compliance setting, and continuously verify that the system hasn't reverted or miscalculated. No app alerts you when a published schedule violates Ontario law.

---

## ADP Workforce Now integration ranges from nonexistent to painful

For an Ontario store running ADP Workforce Now for payroll, the integration picture is bleak.

**7shifts explicitly states in its documentation: *"This integration is not available for ADP Canada."*** The US integration (which syncs regular hours, overtime, and tips in real-time via a Direct Connector) simply does not work for Canadian ADP instances. The only workaround is manual CSV export — downloading a formatted file from 7shifts and uploading it to ADP — which defeats the purpose of integration and introduces transcription risk. Even this requires a paid plan with time clocking enabled, and ADP charges a separate **$15/month per location** for the connector on the US side.

**When I Work** offers a direct ADP Workforce Now integration through ADP Marketplace that sends worked hours, pay rates, and PTO data. However, setup requires extensive manual mapping: *"The integration requires you to match When I Work objects (schedules, positions, hours types, users) to ADP Workforce Now objects (company, department, earning code, worker)."* Any hours that aren't properly matched simply don't transfer. Time-off hours sent to ADP do **not** automatically update ADP leave balances. The legacy version is just CSV export. The connector requires a separate purchase, and the integration is **not compatible with ADP Next Gen HCM**.

**Deputy** offers two integration variants through ADP Marketplace — one for existing Deputy customers and one for customers purchasing through ADP. The integration syncs employee data every 6 hours and can export timesheet data (file number, earning codes, hours, dollar amounts). However, if you already use ADP's own Time & Attendance module, the integration is **restricted to employee sync only** — no timesheet data transfers. The ADP connector requires a separate purchase at undisclosed pricing, and one ADP department maps to exactly one Deputy location with no many-to-one flexibility.

---

## Custom floor roles work, but with trade-offs unique to each app

All three apps support creating custom roles or positions with visual colour differentiation, though the implementation quality varies.

**7shifts** handles this well. Roles are fully customizable with colour selection from a dropdown, and shifts display colour-coded badges on the schedule grid based on assigned role. A "List by Role" layout groups employees under role headers. Roles and colour-coding appear available on all plans including the free tier. The schedule grid shows coverage at a glance.

**When I Work** supports custom positions with three colour view modes: shift colours, position colours, or job site colours. Each position gets its own row with a shift count, providing a clear coverage view. Colour-coding is available on all plans, though custom role permissions (controlling manager access levels) require the Pro tier. One G2 reviewer noted the colour-coding is functional but *"not as flexible as some users want"* in terms of customization.

**Deputy** arguably handles this best through its "Areas" system. Each area gets a preset or custom hex colour, and colours display on the schedule grid, in team member views, and carry over to Excel exports. The Core tier's micro-scheduling feature allows splitting a single shift across multiple areas — an employee works "Cashier" from 9–12 and "Men's Section" from 12–5, colour-differentiated within one shift. The limitation: area names cap at **32 characters**, and micro-scheduling timesheet approval only works on the web interface, not mobile.

---

## Mobile apps share a pattern of clock-in failures and freezing

Recent reviews across all three apps reveal a consistent pattern: functional day-to-day scheduling paired with intermittent but disruptive reliability failures, particularly around clock-in/out and notifications.

**7shifts** requires employees to install **two separate apps** — 7shifts for scheduling and 7Punches for time clocking — which users consistently flag as inconvenient. Capterra reviews report *"the app has a habit of logging everyone out, or the servers crashing in general"* making clock-in impossible. Android performance is notably worse than iOS: *"The worst thing about 7shifts is its inconsistent performance on Android devices."* The 7Punches app lacks a timer widget (employees can't see if they're clocked in) and has no dedicated "start break" button. No offline mode exists.

**When I Work** struggles most with concurrent usage. Everhour's testing found that *"during a retail shift change where multiple employees attempted to clock in at once, the app froze and delayed the process by several minutes"* — a critical failure for retail shift changes. Users report clock-in submissions silently failing: *"Many times I find that my clock in or clock out submission does not go through — it's like the app glitches & doesn't allow me to do anything, so I have to reach out to my supervisor to fix my timesheet."* GPS tracking is unreliable, and the app aggressively solicits feedback: *"This service/app is offensively persistent in bothering you for feedback...multiple times per day with no way to stop these requests."*

**Deputy** suffers from notification failures that can cascade into staffing problems. One Trustpilot reviewer reported: *"Not giving notifications so staff are turning up to unconfirmed shifts, us not being aware that our staff have not been able to claim shifts through the app wondering why there's hundreds of hours lost in unclaimed shifts up to 10k in a week."* Leave requests sometimes never reach management. The Android version is consistently described as more glitchy than iOS. Schedule updates experience sync delays, forcing employees to double-check with managers.

---

## Pricing reveals a structural mismatch with small retail economics

The cost picture differs dramatically by pricing model, and per-user pricing disproportionately punishes retail stores with many part-time workers.

**7shifts** charges **per location, not per user** — the most retail-friendly pricing model. The free Comp plan covers basic scheduling (likely capped at 15 employees in current plans, though sources conflict between 15 and 30). The Essentials tier costs ~$39.99/month per location but lacks compliance tools. Reaching Ontario ESA compliance features requires the **Pro tier at $79.99/month** — approximately **$960/year**. However, 7shifts operates on auto-renewing, non-refundable subscriptions that have generated significant complaints. One Trustpilot reviewer in April 2025 reported being *"shocked to see a charge of approximately $1,500"* after an unexpected auto-renewal.

**When I Work** charges **per user per month** with no free tier (only a 14-day trial). At the Essentials single-location rate of $2.50/user/month, 20 employees costs **$50/month**. The Pro tier needed for custom role permissions runs $3–5/user/month, or **$60–100/month** for 20 users. Annual cost ranges from **$600 to $1,200**. The per-user model means adding seasonal holiday help directly increases cost, and you pay the same rate for a 4-hour-per-week employee as a full-time worker.

**Deputy** is the most expensive option at **per-user pricing** starting at $5/user/month (Lite) through $9/user/month (Pro). For 20 employees at the Core tier needed for compliance features and micro-scheduling, the cost is **$130 USD/month (~$175–180 CAD)** or roughly **$1,560 USD (~$2,100 CAD) annually**. Deputy charges for all users including managers, bills for the full month even if an employee is added 5 days before month-end, and charges **1¢ USD per SMS segment** (7¢ internationally/to Canada) — a hidden cost that accumulates when publishing schedules via text.

| App | Pricing Model | Monthly Cost (20 users, compliance tier) | Annual Cost | Free Tier |
|-----|--------------|----------------------------------------|-------------|-----------|
| 7shifts | Per location | $79.99 USD (Pro) | ~$960 USD | Yes (limited) |
| When I Work | Per user | $60–100 USD (Pro) | ~$720–1,200 USD | No |
| Deputy | Per user | $130 USD (Core) | ~$1,560 USD | No |

---

## Customer support degrades rapidly beyond simple questions

All three apps receive mixed-to-poor support reviews, with a consistent pattern: simple questions get fast chat responses, but complex technical issues hit a wall.

**7shifts** offers chat, email, and phone support, but users report declining quality: *"Customer service has really gone downhill in the last 5 years,"* wrote a long-term Capterra user. PissedConsumer data shows only **13% of calling consumers** reported their issues resolved. 24/7 live support is restricted to top-tier plans. Billing dispute responses are described as *"robotic and dismissive, simply quoting 'non-refundable Terms of Service' without any attempt to help or escalate."*

**When I Work** has **no phone support by design**, offering only tickets and live chat during limited hours (weekdays 7am–7pm CST, weekends 9am–4:30pm CST). Live chat is restricted to admin/manager accounts — employees cannot access it. A decade-long customer wrote on Trustpilot: *"When I Work doesn't care and will not support. They have now lost one of their longest customers. Appalling customer service."*

**Deputy** receives the harshest support criticism. 24/7 live chat requires the Pro tier ($9/user/month). Phone support is effectively unavailable. Support is offshored from Deputy's Sydney headquarters, creating timezone friction for Canadian users. One Software Advice reviewer summarized: *"The customer support from Deputy is honestly some of the worst I've ever encountered. Everything is chat/email based, you can't get anyone on the phone and their entire support function is offshored, so I find myself having to explain things repeatedly."* A Capterra reviewer from April 2025 added: *"The customer services is absolutely disgraceful these days, you can't get support for account finance issues during weekends."*

---

## Data portability is adequate but requires proactive extraction

All three apps export data as CSV files, but none makes portability seamless.

**7shifts** retains data for **2 years after cancellation**, allowing reactivation within that window. Exports cover employee records, schedules, time-off data, worked hours, and payroll data — but only in CSV format. No API-based bulk export exists for non-developers.

**When I Work** issues the starkest warning: *"When you cancel, you immediately lose access to the account, and you can no longer view your data."* You must export everything before cancelling. Available exports include users, schedules, timesheets, time-off requests, and pay period hours. An account "hibernation" option preserves data for seasonal businesses without active payments. API access and webhooks for programmatic extraction require the Premium tier.

**Deputy** offers a dedicated Data Exporter tool that can export any system table filtered by date, employee, or location. CSV is the only format. No explicit post-cancellation data retention policy was found, leaving uncertainty about what happens to historical data if you leave.

---

## 7shifts is architecturally incompatible with retail

The most decisive finding is the industry-fit gap. **7shifts is explicitly and exclusively designed for restaurants** — not as a marketing position but as a product architecture decision. Every POS integration (50+) connects to restaurant systems (Toast, Square for Restaurants, Aloha, Lightspeed Restaurant). Sales-based labour forecasting uses restaurant transaction data and guest flow predictions. The tip pooling module ($24.99/month add-on), FOH/BOH department templates, section assignments for servers, and weather-based scheduling are all restaurant constructs. No retail customer stories exist anywhere on 7shifts.com. The "Built For" page lists bakeries, bars, cafes, juice bars, pizzerias, and pubs — **retail is entirely absent**.

**When I Work** is industry-agnostic — it lacks restaurant-specific clutter like tip tracking but also lacks retail-specific features like POS-integrated labour forecasting, department staffing analysis, or foot traffic correlation. Its team communication feature lives in a **separate app** (Work Chat), fragmenting the experience. No task management exists — you cannot attach floor duties like "restock shelves" to shifts. PTO accrual lacks carryover rules. One comprehensive 2026 assessment rated it **6.5/10**, noting it *"starts to feel limited as soon as you expect it to function like a complete, all-in-one workforce system."*

**Deputy** has the strongest retail case among the three, listing Ace Hardware as a customer and showing retail as 12% of its reviewer base. Its Areas system maps naturally to retail floor sections. However, its demand forecasting depends on POS integration, its compliance features target US/Australian jurisdictions, and its per-user pricing model punishes the part-time-heavy staffing typical of small retail. One Capterra reviewer captured this exactly: *"It's not the cheapest option if you have a lot of staff doing few hours, as it's a per user subscription."*

---

## Conclusion: the case for building custom

The investigation reveals seven defensible reasons why a custom-built solution better serves a small Ontario retail store than any of these three platforms:

1. **Ontario ESA is not a configuration problem — it's an absence.** No app provides automated enforcement of the 3-hour minimum pay rule, the 11-hour rest period, or even correct default overtime thresholds for Ontario. A custom system can encode these rules as hard constraints that physically prevent non-compliant schedules from being published.

2. **ADP Canada integration is broken or nonexistent.** 7shifts explicitly excludes ADP Canada. When I Work and Deputy offer integrations with extensive manual mapping requirements and hidden costs. A custom solution can build direct ADP Workforce Now API integration once and eliminate ongoing export friction.

3. **Per-user pricing punishes part-time retail workforces.** Deputy and When I Work charge the same monthly rate for a 4-hour-per-week employee as a 40-hour-per-week one. At $1,560–2,100 CAD annually for Deputy's compliance tier, the three-year cost ($4,700–6,300 CAD) approaches or exceeds the development cost of a purpose-built tool that has zero ongoing per-user fees.

4. **Restaurant-centric architecture cannot be reconfigured into retail architecture.** 7shifts is unusable for retail. Deputy and When I Work are functional but generic — they neither understand retail floor coverage patterns nor offer section-level staffing analytics. A custom solution can model the exact floor positions (Cashier, Backup Cashier, Men's Section, Women's Section, Floor Monitor) as first-class scheduling entities with coverage rules.

5. **Mobile reliability is a shared industry weakness.** All three apps show persistent patterns of clock-in failures, notification delays, and sync issues. A custom lightweight mobile interface — potentially a progressive web app — can be built for the specific clock-in and schedule-viewing needs of 20 employees without the bloat of a platform serving thousands of restaurants.

6. **Support quality degrades precisely when you need it most.** Complex configuration issues, billing disputes, and compliance questions — the moments when support matters most — receive the worst responses across all three platforms. A custom system eliminates vendor dependency for the features that matter most.

7. **Data ownership is unconditional.** With a custom system, all schedule history, employee records, and request logs live in a database the store controls. No export-before-cancellation deadlines. No 2-year retention windows. No vendor lock-in.