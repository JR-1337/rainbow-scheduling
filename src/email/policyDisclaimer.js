// Static sick-day / late-arrival / shift-coverage / time-off policy block.
// Appended to every schedule distribution email (Group + Individual, HTML + plaintext).
// Edit here only — do not duplicate the text into the builders.

export const POLICY_DISCLAIMER_TEXT = `Sick Day, Late Arrival, and Shift Coverage Policy

Employees who will miss or be late for a scheduled shift must complete BOTH of the following steps:

1. Notify management by email. Email Sarvi at sarvi@rainbowjeans.com and BCC otr.scheduler@gmail.com. Refer to the staff manual for the criteria that qualify as a sick day.

2. Notify the store by phone. Call 416-967-7448 (press 1) at the scheduled start time of your shift -- for a 10:00 a.m. start, the call must occur at 10:00 a.m. Ask to speak with the cashier on duty. Notification must be given to a cashier; informing another staff member does not satisfy this requirement.

Failure to complete both steps, combined with non-attendance, will be recorded as a no-show.

Shift coverage. Once the schedule has been published, employees are responsible for the shifts assigned to them. If you become unable to work a published shift, it is your responsibility to arrange coverage.

Time-off requests. All time-off requests must be submitted no later than three (3) weeks before the start of the affected schedule period.`;

// HTML block — email-safe (table-based wouldn't add value here; a plain div with
// inline styles is sufficient and renders identically across Outlook / Gmail / Apple).
// Position: above the existing footer row in buildBrandedHtml.js.
export const POLICY_DISCLAIMER_HTML = `
      <tr>
        <td style="padding:14px 24px;border-top:1px solid #E5E7EB;background-color:#FFFFFF;">
          <div style="font-size:11px;font-weight:700;color:#5C5C5C;margin-bottom:6px;line-height:1.5;">Sick Day, Late Arrival, and Shift Coverage Policy</div>
          <div style="font-size:11px;color:#8B8580;line-height:1.5;">Employees who will miss or be late for a scheduled shift must complete <span style="color:#5C5C5C;font-weight:700;">both</span> of the following steps:</div>
          <ol style="font-size:11px;color:#8B8580;line-height:1.5;margin:6px 0;padding-left:20px;">
            <li style="margin-bottom:4px;"><span style="color:#5C5C5C;font-weight:700;">Notify management by email.</span> Email Sarvi at sarvi@rainbowjeans.com and BCC otr.scheduler@gmail.com. Refer to the staff manual for the criteria that qualify as a sick day.</li>
            <li><span style="color:#5C5C5C;font-weight:700;">Notify the store by phone.</span> Call 416-967-7448 (press 1) at the scheduled start time of your shift &mdash; for a 10:00 a.m. start, the call must occur at 10:00 a.m. Ask to speak with the <span style="color:#5C5C5C;font-weight:700;">cashier on duty</span>. Notification must be given to a cashier; informing another staff member does not satisfy this requirement.</li>
          </ol>
          <div style="font-size:11px;color:#8B8580;line-height:1.5;margin-top:6px;">Failure to complete both steps, combined with non-attendance, will be recorded as a <span style="color:#5C5C5C;font-weight:700;">no-show</span>.</div>
          <div style="font-size:11px;color:#8B8580;line-height:1.5;margin-top:8px;"><span style="color:#5C5C5C;font-weight:700;">Shift coverage.</span> Once the schedule has been published, employees are responsible for the shifts assigned to them. If you become unable to work a published shift, it is your responsibility to arrange coverage.</div>
          <div style="font-size:11px;color:#8B8580;line-height:1.5;margin-top:6px;"><span style="color:#5C5C5C;font-weight:700;">Time-off requests.</span> All time-off requests must be submitted no later than <span style="color:#5C5C5C;font-weight:700;">three (3) weeks</span> before the start of the affected schedule period.</div>
        </td>
      </tr>`;
