import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useIsMobile, MobileMenuDrawer, MobileAnnouncementPopup, MobileScheduleGrid, MobileMySchedule } from './MobileEmployeeView';
import { MobileAdminDrawer, MobileAdminScheduleGrid, MobileAnnouncementPanel, MobileEmployeeQuickView } from './MobileAdminView';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Mail, Save, Send, FileText, X,
  User, Users, Phone, Calendar, Check, AlertCircle, Star, Edit3, Trash2, UserX, UserCheck, Eye, LogOut, Shield, Settings, Key, MessageSquare, Loader, ClipboardList, ArrowRightLeft, ArrowRight, Bell, Zap, Clock, Menu
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// THEME - FlutterFlow inspired dark theme
// ═══════════════════════════════════════════════════════════════════════════════
export const THEME = {
  bg: { primary: '#0D0D1A', secondary: '#13132B', tertiary: '#1A1A3E', elevated: '#242452', hover: '#2D2D6B' },
  tooltip: { bg: '#050508', border: '#1a1a2e' },
  accent: { blue: '#4F46E5', purple: '#7C3AED', cyan: '#06B6D4', pink: '#EC4899' },
  text: { primary: '#F8FAFC', secondary: '#94A3B8', muted: '#64748B' },
  roles: { cashier: '#8B5CF6', backupCashier: '#A78BFA', mens: '#3B82F6', womens: '#F472B6', floorMonitor: '#F59E0B', none: '#475569' },
  border: { subtle: 'rgba(148, 163, 184, 0.1)', default: 'rgba(148, 163, 184, 0.2)', bright: 'rgba(79, 70, 229, 0.5)' },
  status: { success: '#10B981', warning: '#F59E0B', error: '#EF4444' },
  task: '#FBBF24',
};

// ═══════════════════════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycbxSDWA1uOnemfu2N33y3za7a2hreJIUddgCgQi4X32ObbWKeXHyQms7wxy2NyGw7gWbXA/exec';

/**
 * Make API call to Google Apps Script backend
 * Uses GET with URL parameters (workaround for POST issues with Apps Script)
 * @param {string} action - The action name (e.g., 'login', 'submitTimeOffRequest')
 * @param {object} payload - The data to send
 * @returns {Promise<{success: boolean, data?: any, error?: {code: string, message: string}}>}
 */
const apiCall = async (action, payload = {}, onProgress) => {
  try {
    const payloadJson = JSON.stringify(payload);
    console.log('API Call:', action, payload);
    
    // Encode payload as JSON in URL parameter
    const params = new URLSearchParams({ action, payload: payloadJson });
    const url = `${API_URL}?${params.toString()}`;
    
    // Check URL length - browsers/servers typically limit to ~8000 chars
    // If too long, try POST first, fall back to chunked GET
    if (url.length > 6000) {
      console.log(`Large payload (${url.length} chars), using POST`);
      try {
        // Apps Script POST: use text/plain to avoid CORS preflight
        const postResponse = await fetch(API_URL, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action, payload })
        });
        const postText = await postResponse.text();
        console.log('POST Response:', postText.substring(0, 200));
        try {
          const result = JSON.parse(postText);
          if (result.success !== undefined) return result;
        } catch (e) { /* POST failed or returned HTML redirect, fall through */ }
      } catch (e) {
        console.log('POST failed, falling back to chunked approach');
      }
      
      // Fallback: chunk the shifts array into smaller batches
      if (action === 'batchSaveShifts' && payload.shifts?.length > 10) {
        return await chunkedBatchSave(payload, onProgress);
      }
    }
    
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });
    
    const text = await response.text();
    console.log('API Response:', text.substring(0, 200));
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse response:', text);
      return { 
        success: false, 
        error: { code: 'PARSE_ERROR', message: 'Invalid response from server' }
      };
    }
  } catch (error) {
    console.error('API Error:', error);
    return { 
      success: false, 
      error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server. Please try again.' }
    };
  }
};

// Chunk large batchSaveShifts into multiple smaller GET requests
const chunkedBatchSave = async (payload, onProgress) => {
  const { shifts, periodDates, callerEmail } = payload;
  const CHUNK_SIZE = 15; // 15 shifts per request stays under URL limits (~4500 chars)
  let totalSaved = 0;
  let lastError = null;
  const totalChunks = Math.ceil(shifts.length / CHUNK_SIZE);
  
  // Build all shift keys for the full period (needed for delete logic on last chunk)
  const allShiftKeys = shifts.map(s => `${s.employeeId}-${s.date}`);
  
  for (let i = 0; i < shifts.length; i += CHUNK_SIZE) {
    const chunk = shifts.slice(i, i + CHUNK_SIZE);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const isLastChunk = (i + CHUNK_SIZE) >= shifts.length;
    
    // Report progress
    if (onProgress) onProgress(i + chunk.length, shifts.length, chunkNum, totalChunks);
    
    console.log(`Saving chunk ${chunkNum}/${totalChunks} (${chunk.length} shifts)`);
    
    const chunkPayload = {
      callerEmail,
      shifts: chunk,
      // Only send periodDates on last chunk (triggers cleanup of deleted shifts)
      // Also send allShiftKeys so backend knows which shifts to keep
      periodDates: isLastChunk ? periodDates : [],
      ...(isLastChunk ? { allShiftKeys } : {})
    };
    
    const params = new URLSearchParams({
      action: 'batchSaveShifts',
      payload: JSON.stringify(chunkPayload)
    });
    
    try {
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow'
      });
      const text = await response.text();
      const result = JSON.parse(text);
      
      if (result.success) {
        totalSaved += result.data?.savedCount || chunk.length;
      } else {
        lastError = result.error;
        console.error(`Chunk ${chunkNum} failed:`, result.error);
      }
    } catch (err) {
      lastError = { code: 'NETWORK_ERROR', message: err.message };
      console.error(`Chunk ${chunkNum} network error:`, err);
    }
  }
  
  if (lastError && totalSaved === 0) {
    return { success: false, error: lastError };
  }
  
  return { 
    success: true, 
    data: { savedCount: totalSaved },
    ...(lastError ? { warning: `Some chunks failed: ${lastError.message}` } : {})
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const STORE_HOURS = {
  sunday: { open: '11:00', close: '18:00' }, monday: { open: '11:00', close: '18:00' },
  tuesday: { open: '11:00', close: '18:00' }, wednesday: { open: '11:00', close: '18:00' },
  thursday: { open: '11:00', close: '19:00' }, friday: { open: '11:00', close: '19:00' },
  saturday: { open: '11:00', close: '19:00' },
};
const STAT_HOLIDAY_HOURS = { open: '12:00', close: '17:00' };
const STAT_HOLIDAYS_2026 = ['2026-01-01','2026-02-16','2026-04-03','2026-05-18','2026-07-01','2026-08-03','2026-09-07','2026-10-12','2026-12-25','2026-12-26'];

// Daily staffing targets - defaults (overridden by Settings tab if configured)
const DEFAULT_STAFFING_TARGETS = {
  sunday: 15, monday: 8, tuesday: 8, wednesday: 8,
  thursday: 10, friday: 10, saturday: 20
};

export const ROLES = [
  { id: 'cashier', name: 'Cash', fullName: 'Cashier', color: THEME.roles.cashier },
  { id: 'backupCashier', name: 'Cash2', fullName: 'Backup Cashier', color: THEME.roles.backupCashier },
  { id: 'mens', name: "Men's", fullName: "Men's Section", color: THEME.roles.mens },
  { id: 'womens', name: "Women's", fullName: "Women's Section", color: THEME.roles.womens },
  { id: 'floorMonitor', name: 'Monitor', fullName: 'Floor Monitor', color: THEME.roles.floorMonitor },
  { id: 'none', name: 'None', fullName: 'No Role', color: THEME.roles.none },
];

const PAY_PERIOD_START = new Date(2026, 0, 26); // January 26, 2026 (Monday) - using local timezone

// ═══════════════════════════════════════════════════════════════════════════════
// TIME OFF REQUEST - Status constants and sample data
// ═══════════════════════════════════════════════════════════════════════════════
const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CANCELLED: 'cancelled',
  REVOKED: 'revoked'
};

const REQUEST_STATUS_COLORS = {
  pending: THEME.status.warning,
  approved: THEME.status.success,
  denied: THEME.status.error,
  cancelled: THEME.text.muted,
  revoked: '#F97316' // Orange
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT OFFER (Give Away) - Status constants and sample data
// ═══════════════════════════════════════════════════════════════════════════════
const OFFER_STATUS = {
  AWAITING_RECIPIENT: 'awaiting_recipient',  // Waiting for Employee B to respond
  RECIPIENT_REJECTED: 'recipient_rejected',  // B declined (terminal)
  AWAITING_ADMIN: 'awaiting_admin',          // B accepted, admin reviewing
  APPROVED: 'approved',                       // Admin approved, shift reassigned (terminal)
  REJECTED: 'rejected',                       // Admin rejected transfer (terminal)
  CANCELLED: 'cancelled',                     // A cancelled before resolution (terminal)
  EXPIRED: 'expired',                         // Shift date passed while pending (terminal)
  REVOKED: 'revoked',                         // Admin revoked after approval (terminal)
};

const OFFER_STATUS_COLORS = {
  awaiting_recipient: '#8B5CF6',  // Purple - waiting on recipient
  recipient_rejected: THEME.text.muted,
  awaiting_admin: THEME.status.warning,  // Yellow - needs admin attention
  approved: THEME.status.success,
  rejected: THEME.status.error,
  cancelled: THEME.text.muted,
  expired: THEME.text.muted,
  revoked: '#F97316',  // Orange - revoked
};

const OFFER_STATUS_LABELS = {
  awaiting_recipient: 'Awaiting Reply',
  recipient_rejected: 'Declined by Recipient',
  awaiting_admin: 'Awaiting Admin',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
  revoked: 'Revoked',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT SWAP - Status constants and sample data
// ═══════════════════════════════════════════════════════════════════════════════
const SWAP_STATUS = {
  AWAITING_PARTNER: 'awaiting_partner',    // Waiting for Employee B to respond
  PARTNER_REJECTED: 'partner_rejected',    // B declined the swap (terminal)
  AWAITING_ADMIN: 'awaiting_admin',        // B accepted, admin reviewing
  APPROVED: 'approved',                     // Admin approved, shifts swapped (terminal)
  REJECTED: 'rejected',                     // Admin rejected (terminal)
  CANCELLED: 'cancelled',                   // Initiator cancelled before resolution (terminal)
  EXPIRED: 'expired',                       // One of the shift dates passed while pending (terminal)
  REVOKED: 'revoked',                       // Admin revoked after approval (terminal)
};

const SWAP_STATUS_COLORS = {
  awaiting_partner: '#8B5CF6',  // Purple - waiting on partner
  partner_rejected: THEME.text.muted,
  awaiting_admin: THEME.status.warning,  // Yellow - needs admin attention
  approved: THEME.status.success,
  rejected: THEME.status.error,
  cancelled: THEME.text.muted,
  expired: THEME.text.muted,
  revoked: '#F97316',  // Orange
};

const SWAP_STATUS_LABELS = {
  awaiting_partner: 'Awaiting Reply',
  partner_rejected: 'Declined by Partner',
  awaiting_admin: 'Awaiting Admin',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
  revoked: 'Revoked',
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════════
export const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
const getDayNameShort = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
export const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatDateLong = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const formatMonthWord = (date) => date.toLocaleDateString('en-US', { month: 'long' });
export const getWeekNumber = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.ceil((diff / 604800000) + 1);
};
export const isStatHoliday = (date) => STAT_HOLIDAYS_2026.includes(date.toISOString().split('T')[0]);

// Module-level override refs (synced from component state via useEffect)
// This avoids threading overrides as props through every child component
let _storeHoursOverrides = {}; // { "2026-02-14": { open: "10:00", close: "21:00" } }
let _staffingTargetOverrides = {}; // { "2026-02-14": 12 }

export const getStoreHoursForDate = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  // Per-date override takes priority
  if (_storeHoursOverrides[dateStr]) return _storeHoursOverrides[dateStr];
  // Then stat holiday defaults
  if (isStatHoliday(date)) return STAT_HOLIDAY_HOURS;
  // Then weekly defaults
  return STORE_HOURS[getDayName(date)];
};
const getPayPeriodDates = (periodIndex) => {
  const startDate = new Date(PAY_PERIOD_START.getFullYear(), PAY_PERIOD_START.getMonth(), PAY_PERIOD_START.getDate() + (periodIndex * 14));
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 13);
  const dates = [];
  for (let i = 0; i < 14; i++) { 
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i); 
    dates.push(d); 
  }
  return { startDate, endDate, dates };
};
const parseTime = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const formatTimeDisplay = (t) => { if (!t) return '--:--'; const [h, m] = t.split(':').map(Number); return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, '0')}${h >= 12 ? 'PM' : 'AM'}`; };
export const formatTimeShort = (t) => { if (!t) return '--'; const h = parseInt(t.split(':')[0]); return `${h > 12 ? h - 12 : h || 12}${h >= 12 ? 'p' : 'a'}`; };
const calculateHours = (s, e) => (parseTime(e) - parseTime(s)) / 60;

const getAvailabilityShading = (avail, storeHours) => {
  if (!avail.available) return { top: 100, bottom: 0 };
  const storeStart = parseTime(storeHours.open), storeEnd = parseTime(storeHours.close);
  const storeDuration = storeEnd - storeStart;
  const availStart = parseTime(avail.start), availEnd = parseTime(avail.end);
  return {
    top: Math.max(0, Math.min(100, ((availStart - storeStart) / storeDuration) * 100)),
    bottom: Math.max(0, Math.min(100, ((storeEnd - availEnd) / storeDuration) * 100))
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// PDF GENERATION - Dark theme matching app
// ═══════════════════════════════════════════════════════════════════════════════
const generateSchedulePDF = (employees, shifts, dates, periodInfo, announcement = null) => {
  const week1 = dates.slice(0, 7);
  const week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]);
  const weekNum2 = getWeekNumber(week2[0]);
  
  // Filter schedulable employees (exclude owner, exclude admins unless showOnSchedule)
  const schedulable = employees
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule);
  
  // Admin contacts
  const adminContacts = employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted);
  
  // Calculate hours for specific week only
  const calcWeekHours = (empId, weekDates) => {
    let t = 0;
    weekDates.forEach(d => { const s = shifts[`${empId}-${d.toISOString().split('T')[0]}`]; if (s) t += s.hours || 0; });
    return t;
  };
  
  // Announcement HTML (goes at top after header)
  const announcementHtml = (announcement && announcement.message) ? `
    <div style="margin:15px 0;padding:15px;background:linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);border-radius:8px;border-left:4px solid #3b82f6;">
      ${announcement.subject ? `<h3 style="margin:0 0 10px;color:#3b82f6;font-size:13px;font-weight:700;letter-spacing:0.5px;">📢 ${announcement.subject}</h3>` : '<h3 style="margin:0 0 10px;color:#3b82f6;font-size:13px;font-weight:700;">📢 Announcement</h3>'}
      <div style="color:#e2e8f0;font-size:11px;line-height:1.6;white-space:pre-wrap;">${announcement.message}</div>
    </div>
  ` : '';
  
  const makeWeekTable = (weekDates, weekNum) => {
    const headers = weekDates.map(d => {
      const hol = isStatHoliday(d);
      return `<th style="padding:8px 4px;border:1px solid #2d2d6b;background:${hol ? '#78350f' : '#1a1a2e'};font-size:11px;text-align:center;width:11%;">
        <div style="font-weight:600;color:${hol ? '#fbbf24' : '#e2e8f0'};text-transform:uppercase;font-size:9px;">${getDayNameShort(d)}</div>
        <div style="font-size:16px;font-weight:700;color:#fff;">${d.getDate()}</div>
      </th>`;
    }).join('');
    
    const rows = schedulable.map(emp => {
      const cells = weekDates.map(date => {
        const shift = shifts[`${emp.id}-${date.toISOString().split('T')[0]}`];
        if (!shift) return '<td style="padding:6px;border:1px solid #2d2d6b;background:#0f0f1a;"></td>';
        const role = ROLES.find(r => r.id === shift.role);
        return `<td style="padding:6px;border:1px solid #2d2d6b;background:${role?.color}20;text-align:center;">
          <div style="font-size:10px;font-weight:700;color:${role?.color};margin-bottom:2px;">${role?.name}</div>
          <div style="font-size:9px;color:#94a3b8;">${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)}</div>
          <div style="font-size:8px;color:#64748b;">${shift.hours}h</div>
          ${shift.task ? '<div style="font-size:8px;color:#fbbf24;margin-top:2px;">★</div>' : ''}
        </td>`;
      }).join('');
      
      const hours = calcWeekHours(emp.id, weekDates);
      const hoursColor = hours >= 40 ? '#ef4444' : hours >= 35 ? '#fbbf24' : '#22d3ee';
      
      return `<tr>
        <td style="padding:8px;border:1px solid #2d2d6b;background:#1a1a2e;">
          <div style="font-weight:600;font-size:11px;color:#fff;">${emp.name}</div>
          <div style="font-size:10px;color:${hoursColor};font-weight:600;">${hours.toFixed(1)}h</div>
        </td>
        ${cells}
      </tr>`;
    }).join('');
    
    return `
      <div style="margin-bottom:25px;">
        <div style="background:linear-gradient(135deg, #3b82f6, #8b5cf6);padding:10px 15px;border-radius:8px 8px 0 0;">
          <h3 style="margin:0;color:#fff;font-size:14px;font-weight:600;">Week ${weekNum}</h3>
          <p style="margin:2px 0 0;color:rgba(255,255,255,0.8);font-size:11px;">${formatDate(weekDates[0])} — ${formatDate(weekDates[6])}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-family:'Inter',Arial,sans-serif;">
          <thead><tr><th style="padding:8px;border:1px solid #2d2d6b;background:#1a1a2e;width:15%;font-size:10px;text-align:left;color:#94a3b8;text-transform:uppercase;">Employee</th>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };
  
  const legendItems = ROLES.filter(r => r.id !== 'none').map(r => 
    `<span style="margin-right:15px;font-size:10px;display:inline-flex;align-items:center;gap:5px;">
      <span style="display:inline-block;width:12px;height:12px;background:${r.color};border-radius:3px;"></span>
      <span style="color:#e2e8f0;">${r.fullName}</span>
    </span>`
  ).join('');
  
  // Admin contacts HTML
  const adminContactsHtml = adminContacts.length > 0 ? `
    <div style="margin-top:12px;padding:10px 15px;background:#1a1a2e;border-radius:8px;border:1px solid #2d2d6b;">
      <div style="font-weight:600;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Contact Admin</div>
      ${adminContacts.map(a => `<span style="margin-right:20px;font-size:11px;color:#e2e8f0;">${a.name}: <span style="color:#22d3ee;">${a.email}</span></span>`).join('')}
    </div>
  ` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Rainbow Schedule - Week ${weekNum1} & ${weekNum2}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @media print { 
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { margin: 0.3in; size: landscape; }
    }
    body { font-family: 'Inter', Arial, sans-serif; padding: 20px; margin: 0 auto; max-width: 1100px; background: #0a0a12; }
  </style>
</head>
<body style="background:#0a0a12;">
  <div style="text-align:center;margin-bottom:25px;padding-bottom:15px;border-bottom:2px solid #3b82f6;">
    <div style="font-family:'Josefin Sans',sans-serif;margin-bottom:5px;">
      <span style="color:#94a3b8;font-size:10px;letter-spacing:3px;">OVER THE</span><br>
      <span style="color:#fff;font-size:24px;letter-spacing:4px;font-weight:600;">RAINBOW</span>
    </div>
    <p style="margin:8px 0 0;font-size:12px;"><span style="background:linear-gradient(135deg, #3b82f6, #8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600;">Staff Schedule</span></p>
    <p style="margin:5px 0 0;color:#64748b;font-size:11px;">Week ${weekNum1} & ${weekNum2} • ${formatMonthWord(periodInfo.startDate)} ${periodInfo.startDate.getDate()} — ${formatMonthWord(periodInfo.endDate)} ${periodInfo.endDate.getDate()}, ${periodInfo.startDate.getFullYear()}</p>
  </div>
  
  ${announcementHtml}
  ${makeWeekTable(week1, weekNum1)}
  ${makeWeekTable(week2, weekNum2)}
  
  <div style="margin-top:20px;padding:12px 15px;background:#1a1a2e;border-radius:8px;border:1px solid #2d2d6b;">
    <div style="margin-bottom:6px;font-weight:600;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Legend</div>
    <div>${legendItems}<span style="font-size:10px;display:inline-flex;align-items:center;gap:5px;"><span style="color:#fbbf24;">★</span><span style="color:#e2e8f0;">Has Task</span></span></div>
  </div>
  ${adminContactsHtml}
</body>
</html>`;
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank', 'width=1100,height=750');
  if (printWindow) {
    printWindow.onload = () => setTimeout(() => { printWindow.focus(); printWindow.print(); }, 400);
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rainbow-Schedule-Week${weekNum1}-${weekNum2}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL BUILDER - Individual employee emails
// ═══════════════════════════════════════════════════════════════════════════════
const buildEmailContent = (emp, shifts, dates, periodInfo, adminContacts = [], announcement = null) => {
  const weekNum1 = getWeekNumber(dates[0]);
  const weekNum2 = getWeekNumber(dates[7]);
  const year = periodInfo.startDate.getFullYear();
  
  const startMonth = formatMonthWord(periodInfo.startDate);
  const startDayNum = periodInfo.startDate.getDate();
  const endMonth = formatMonthWord(periodInfo.endDate);
  const endDayNum = periodInfo.endDate.getDate();
  
  const subject = `New Schedule Published 🌈 Wk ${weekNum1}, ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}`;
  
  const scheduleLines = [];
  let totalHours = 0;
  
  dates.forEach(date => {
    const shift = shifts[`${emp.id}-${date.toISOString().split('T')[0]}`];
    if (shift) {
      const role = ROLES.find(r => r.id === shift.role);
      const dayStr = formatDateLong(date);
      const timeStr = `${formatTimeDisplay(shift.startTime)} - ${formatTimeDisplay(shift.endTime)}`;
      
      let line = `  ${dayStr}`;
      line += `\n  ${timeStr} • ${shift.hours}h • ${role?.fullName || 'No Role'}`;
      if (shift.task) line += `\n  ⭐ Task: ${shift.task}`;
      scheduleLines.push(line);
      totalHours += shift.hours || 0;
    }
  });
  
  if (scheduleLines.length === 0) return { subject, body: '', hasShifts: false };
  
  const adminLine = adminContacts.length > 0 
    ? `Contact: ${adminContacts.map(a => `${a.name} (${a.email})`).join(', ')}`
    : '';
  
  // Announcement section
  const announcementSection = (announcement && announcement.message) ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 ${announcement.subject || 'ANNOUNCEMENT'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${announcement.message}

` : '';
  
  const body = `Hi ${emp.name.split(' ')[0]}! 🌈

OVER THE RAINBOW - Staff Schedule
Week ${weekNum1} & ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}, ${year}
${announcementSection}
YOUR SHIFTS
───────────────────────────────────

${scheduleLines.join('\n\n')}

───────────────────────────────────
Total Hours: ${totalHours.toFixed(1)}h
───────────────────────────────────

📎 Full schedule PDF attached

${adminLine}

Over the Rainbow 🌈
www.rainbowjeans.com`;

  return { subject, body, hasShifts: true };
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS - Smaller/Compact
// ═══════════════════════════════════════════════════════════════════════════════
const GradientButton = ({ children, onClick, variant = 'primary', disabled = false, small = false, danger = false }) => (
  <button onClick={onClick} disabled={disabled}
    className={`${small ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-lg font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90`}
    style={{ 
      background: danger ? THEME.status.error : variant === 'primary' ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated, 
      border: variant === 'secondary' ? `1px solid ${THEME.border.default}` : 'none', 
      color: THEME.text.primary 
    }}>
    {children}
  </button>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-xs', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div className={`${sizes[size]} w-full rounded-xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col`} style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
        <div className="px-3 py-2 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <h2 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>
        <div className="p-3 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div className="mb-2">
    <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>{label} {required && <span style={{ color: THEME.status.error }}>*</span>}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-2 py-1.5 rounded-lg outline-none text-xs" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
  </div>
);

const Checkbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
    <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: checked ? THEME.accent.purple : THEME.bg.elevated, border: `2px solid ${checked ? THEME.accent.purple : THEME.border.default}` }} onClick={() => onChange(!checked)}>
      {checked && <Check size={10} color="white" />}
    </div>
    <span style={{ color: THEME.text.primary }}>{label}</span>
  </label>
);

const TimePicker = ({ value, onChange, label }) => {
  const hours = Array.from({ length: 18 }, (_, i) => (i + 6).toString().padStart(2, '0'));
  const [h, m] = (value || '11:00').split(':');
  return (
    <div className="mb-2">
      {label && <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>{label}</label>}
      <div className="flex gap-1">
        <select value={h} onChange={e => onChange(`${e.target.value}:${m}`)} className="flex-1 px-1.5 py-1 rounded-lg outline-none text-xs" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}>
          {hours.map(hr => <option key={hr} value={hr}>{parseInt(hr) > 12 ? parseInt(hr) - 12 : hr} {parseInt(hr) >= 12 ? 'PM' : 'AM'}</option>)}
        </select>
        <select value={m} onChange={e => onChange(`${h}:${e.target.value}`)} className="w-14 px-1.5 py-1 rounded-lg outline-none text-xs" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}>
          {['00', '15', '30', '45'].map(min => <option key={min} value={min}>:{min}</option>)}
        </select>
      </div>
    </div>
  );
};

const TaskStarTooltip = ({ task, show, triggerRef }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 150) });
    }
  }, [show, triggerRef]);
  if (!show) return null;
  return (
    <div className="fixed p-2 rounded-lg text-xs shadow-xl" style={{ top: pos.top, left: pos.left, maxWidth: 140, backgroundColor: THEME.tooltip.bg, border: `1px solid ${THEME.task}`, color: THEME.text.primary, zIndex: 99999 }}>
      {task}
    </div>
  );
};

// Button with tooltip
const TooltipButton = ({ children, onClick, variant = 'secondary', disabled = false, tooltip }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  
  useEffect(() => {
    if (show && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    }
  }, [show]);
  
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button ref={btnRef} onClick={onClick} disabled={disabled}
        className="px-2 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
        style={{ 
          background: variant === 'primary' ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated, 
          border: variant === 'secondary' ? `1px solid ${THEME.border.default}` : 'none', 
          color: THEME.text.primary 
        }}>
        {children}
      </button>
      {show && tooltip && (
        <div className="fixed px-2 py-1 rounded text-xs whitespace-nowrap" style={{ 
          top: pos.top, 
          left: pos.left, 
          transform: 'translateX(-50%)',
          backgroundColor: THEME.tooltip.bg, 
          border: `1px solid ${THEME.tooltip.border}`, 
          color: THEME.text.primary,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 99999
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INACTIVE EMPLOYEES PANEL
// ═══════════════════════════════════════════════════════════════════════════════
const InactiveEmployeesPanel = ({ isOpen, onClose, employees, onReactivate, onDelete }) => {
  const inactiveEmps = employees.filter(e => !e.active && !e.deleted && !e.isOwner);
  const deletedEmps = employees.filter(e => e.deleted && !e.isOwner);
  
  if (!isOpen) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Staff" size="md">
      {inactiveEmps.length === 0 && deletedEmps.length === 0 ? (
        <div className="text-center py-6">
          <UserCheck size={32} style={{ color: THEME.text.muted }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: THEME.text.secondary }}>All employees are active!</p>
        </div>
      ) : (
        <>
          {inactiveEmps.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: THEME.status.warning }}>
                <UserX size={12} /> Inactive ({inactiveEmps.length})
              </h3>
              <div className="space-y-1">
                {inactiveEmps.map(emp => (
                  <div key={emp.id} className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>{emp.name.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>{emp.name}</p>
                        <p className="text-xs" style={{ color: THEME.text.muted }}>{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => onReactivate(emp.id)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}>Reactivate</button>
                      <button onClick={() => onDelete(emp.id)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {deletedEmps.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: THEME.text.muted }}>
                <Trash2 size={12} /> Removed - History Only ({deletedEmps.length})
              </h3>
              <p className="text-xs mb-2" style={{ color: THEME.text.muted }}>These employees' past shifts are preserved on the schedule.</p>
              <div className="space-y-1">
                {deletedEmps.map(emp => (
                  <div key={emp.id} className="p-2 rounded-lg flex items-center justify-between opacity-60" style={{ backgroundColor: THEME.bg.tertiary }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>{emp.name.charAt(0)}</div>
                      <p className="text-xs" style={{ color: THEME.text.muted }}>{emp.name}</p>
                    </div>
                    <button onClick={() => onReactivate(emp.id)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>Restore</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE FORM - Very Compact
// ═══════════════════════════════════════════════════════════════════════════════
const EmployeeFormModal = ({ isOpen, onClose, onSave, onDelete, employee = null, currentUser = null, showToast }) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const defaultAvail = days.reduce((a, d) => ({ ...a, [d]: { available: true, start: STORE_HOURS[d].open, end: STORE_HOURS[d].close } }), {});
  const [formData, setFormData] = useState(employee || { name: '', email: '', phone: '', address: '', dob: '', active: true, isAdmin: false, isOwner: false, showOnSchedule: true, employmentType: 'part-time', availability: defaultAvail });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { setFormData(employee || { name: '', email: '', phone: '', address: '', dob: '', active: true, isAdmin: false, isOwner: false, showOnSchedule: true, employmentType: 'part-time', availability: defaultAvail }); setShowDeleteConfirm(false); }, [employee, isOpen]);

  // Admin protection checks
  const isEditingSelf = employee && currentUser && employee.email === currentUser.email;
  const isEditingOwner = employee?.isOwner;
  const currentUserIsOwner = currentUser?.isOwner;
  
  // Can only toggle admin status if:
  // - NOT editing the owner (owner is always admin)
  // - NOT editing yourself (can't demote yourself)
  const canToggleAdmin = !isEditingOwner && !isEditingSelf;
  
  // Can only delete if:
  // - NOT deleting yourself
  // - NOT deleting the owner
  const canDelete = !isEditingSelf && !isEditingOwner;
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => { 
    if (!formData.name || !formData.email) return; 
    setIsSaving(true);
    const success = await onSave({ ...formData, id: formData.id || `emp-${Date.now()}` }); 
    setIsSaving(false);
    if (success !== false) onClose(); // Only close if save didn't return false
  };
  const toggleDay = (d) => setFormData({ ...formData, availability: { ...formData.availability, [d]: { ...formData.availability[d], available: !formData.availability[d].available } } });
  const updateTime = (d, f, v) => setFormData({ ...formData, availability: { ...formData.availability, [d]: { ...formData.availability[d], [f]: v } } });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Edit Employee' : 'Add Employee'} size="xl">
      {showDeleteConfirm ? (
        <div className="text-center py-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.error + '20' }}>
            <Trash2 size={20} style={{ color: THEME.status.error }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: THEME.text.primary }}>Remove {employee?.name}?</h3>
          <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>They'll be removed from scheduling but their past shifts will be preserved.</p>
          <div className="flex justify-center gap-2">
            <GradientButton variant="secondary" small onClick={() => setShowDeleteConfirm(false)}>Cancel</GradientButton>
            <GradientButton danger small onClick={async () => { 
              setIsSaving(true);
              const success = await onDelete(employee.id); 
              setIsSaving(false);
              if (success !== false) onClose(); 
            }} disabled={isSaving}>
              {isSaving ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {isSaving ? 'Removing...' : 'Remove'}
            </GradientButton>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <Input label="DOB" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
          </div>
          <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          
          {employee && (
            <>
              <div className="mt-2 flex gap-2">
                <div className="flex-1 p-1.5 rounded-lg flex items-center justify-between" style={{ backgroundColor: formData.active ? THEME.status.success + '15' : THEME.status.warning + '15' }}>
                  <span className="text-xs flex items-center gap-1" style={{ color: formData.active ? THEME.status.success : THEME.status.warning }}>
                    {formData.active ? <UserCheck size={12} /> : <UserX size={12} />}
                    {formData.active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => setFormData({ ...formData, active: !formData.active })} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.primary }}>
                    {formData.active ? 'Set Inactive' : 'Set Active'}
                  </button>
                </div>
                
                <div className="flex-1 p-1.5 rounded-lg flex items-center justify-between" style={{ backgroundColor: formData.isAdmin ? THEME.accent.purple + '15' : THEME.bg.tertiary }}>
                  <span className="text-xs flex items-center gap-1" style={{ color: formData.isAdmin ? THEME.accent.purple : THEME.text.muted }}>
                    <Shield size={12} />
                    {formData.isOwner ? 'Owner' : formData.isAdmin ? 'Admin' : 'Staff'}
                  </span>
                  {!formData.isOwner && canToggleAdmin && (
                    <button onClick={() => setFormData({ ...formData, isAdmin: !formData.isAdmin, showOnSchedule: formData.isAdmin ? true : false })} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.primary }}>
                      {formData.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  )}
                  {!formData.isOwner && !canToggleAdmin && isEditingSelf && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ color: THEME.text.muted }}>
                      Can't change own status
                    </span>
                  )}
                </div>
              </div>
              
              {/* Show on Schedule checkbox for admins */}
              {formData.isAdmin && !formData.isOwner && (
                <div className="mt-2 p-1.5 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <span className="text-xs" style={{ color: THEME.text.secondary }}>Show on schedule grid?</span>
                  <button 
                    onClick={() => setFormData({ ...formData, showOnSchedule: !formData.showOnSchedule })} 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: formData.showOnSchedule ? THEME.status.success : THEME.bg.elevated, color: formData.showOnSchedule ? '#fff' : THEME.text.muted }}>
                    {formData.showOnSchedule ? 'Yes' : 'No'}
                  </button>
                </div>
              )}
              
              {/* Employment Type toggle - Full-time / Part-time */}
              <div className="mt-2 p-1.5 rounded-lg flex items-center justify-between" style={{ backgroundColor: formData.employmentType === 'full-time' ? THEME.accent.blue + '15' : THEME.bg.tertiary }}>
                <span className="text-xs flex items-center gap-1" style={{ color: formData.employmentType === 'full-time' ? THEME.accent.blue : THEME.text.secondary }}>
                  <Clock size={12} />
                  Employment Type
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setFormData({ ...formData, employmentType: 'full-time' })} 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: formData.employmentType === 'full-time' ? THEME.accent.blue : THEME.bg.elevated, color: formData.employmentType === 'full-time' ? '#fff' : THEME.text.muted }}>
                    Full-Time
                  </button>
                  <button 
                    onClick={() => setFormData({ ...formData, employmentType: 'part-time' })} 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: formData.employmentType === 'part-time' ? THEME.accent.purple : THEME.bg.elevated, color: formData.employmentType === 'part-time' ? '#fff' : THEME.text.muted }}>
                    Part-Time
                  </button>
                </div>
              </div>
              
              {/* Reset Password - Admin only, not for self or owner */}
              {!isEditingSelf && !isEditingOwner && (
                <div className="mt-2 p-1.5 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <span className="text-xs flex items-center gap-1" style={{ color: THEME.text.secondary }}>
                    <Key size={12} />
                    Password
                  </span>
                  <button 
                    onClick={async () => {
                      const result = await apiCall('resetPassword', {
                        callerEmail: currentUser.email,
                        targetEmail: formData.email
                      });
                      if (result.success) {
                        if (showToast) showToast('success', `Password reset for ${formData.name}. They'll be prompted to set a new one on next login.`);
                      } else {
                        if (showToast) showToast('error', result.error?.message || 'Failed to reset password');
                      }
                    }}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: THEME.status.warning + '20', color: THEME.status.warning }}>
                    Reset to Default
                  </button>
                </div>
              )}
            </>
          )}
          
          <div className="mt-3">
            <label className="block text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Availability</label>
            <div className="grid grid-cols-7 gap-1">
              {days.map(d => {
                const av = formData.availability[d];
                return (
                  <div key={d} className="text-center">
                    <button onClick={() => toggleDay(d)} className="w-full px-1 py-1 rounded text-xs font-medium mb-1" style={{ backgroundColor: av.available ? THEME.accent.purple : THEME.bg.elevated, color: av.available ? 'white' : THEME.text.muted }}>
                      {d.slice(0, 3)}
                    </button>
                    {av.available ? (
                      <div className="space-y-1">
                        <select value={av.start} onChange={e => updateTime(d, 'start', e.target.value)} className="w-full px-0.5 py-0.5 rounded text-center" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, fontSize: '9px' }}>
                          {Array.from({ length: 14 }, (_, i) => i + 6).map(h => <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</option>)}
                        </select>
                        <select value={av.end} onChange={e => updateTime(d, 'end', e.target.value)} className="w-full px-0.5 py-0.5 rounded text-center" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, fontSize: '9px' }}>
                          {Array.from({ length: 14 }, (_, i) => i + 6).map(h => <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="text-xs py-2" style={{ color: THEME.text.muted }}>Off</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            {employee && canDelete && <GradientButton danger small onClick={() => setShowDeleteConfirm(true)}><Trash2 size={10} />Remove</GradientButton>}
            {employee && !canDelete && (
              <span className="text-xs py-1" style={{ color: THEME.text.muted }}>
                {isEditingSelf ? "Can't remove yourself" : isEditingOwner ? "Can't remove owner" : ''}
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <GradientButton variant="secondary" small onClick={onClose} disabled={isSaving}>Cancel</GradientButton>
              <GradientButton small onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                {isSaving ? 'Saving...' : (employee ? 'Save' : 'Add')}
              </GradientButton>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT EDITOR - Very Compact
// ═══════════════════════════════════════════════════════════════════════════════
// Default booking times - uses store hours for that day
const getDefaultBookingTimes = (date) => {
  const storeHours = getStoreHoursForDate(date);
  return { start: storeHours.open, end: storeHours.close };
};

const ShiftEditorModal = ({ isOpen, onClose, onSave, employee, date, existingShift, totalPeriodHours }) => {
  const storeHours = getStoreHoursForDate(date);
  const isHoliday = isStatHoliday(date);
  const defaultTimes = getDefaultBookingTimes(date);
  const [shiftData, setShiftData] = useState({ startTime: existingShift?.startTime || defaultTimes.start, endTime: existingShift?.endTime || defaultTimes.end, role: existingShift?.role || 'none', task: existingShift?.task || '' });

  useEffect(() => { 
    const dt = getDefaultBookingTimes(date);
    setShiftData({ startTime: existingShift?.startTime || dt.start, endTime: existingShift?.endTime || dt.end, role: existingShift?.role || 'none', task: existingShift?.task || '' }); 
  }, [existingShift, date]);

  const shiftHours = calculateHours(shiftData.startTime, shiftData.endTime);
  const projectedTotal = totalPeriodHours - (existingShift?.hours || 0) + shiftHours;

  const handleSave = () => { onSave({ employeeId: employee.id, employeeName: employee.name, date: date.toISOString().split('T')[0], ...shiftData, hours: shiftHours }); onClose(); };
  const handleDelete = () => { onSave({ employeeId: employee.id, date: date.toISOString().split('T')[0], deleted: true }); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Shift" size="sm">
      <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}>{employee.name.charAt(0)}</div>
          <div>
            <p className="font-medium text-xs" style={{ color: THEME.text.primary }}>{employee.name}</p>
            <p className="text-xs" style={{ color: THEME.text.secondary }}>{formatDateLong(date)} {isHoliday && <span style={{ color: THEME.status.warning }}>• Hol</span>}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <TimePicker label="Start" value={shiftData.startTime} onChange={t => setShiftData({ ...shiftData, startTime: t })} />
        <TimePicker label="End" value={shiftData.endTime} onChange={t => setShiftData({ ...shiftData, endTime: t })} />
      </div>
      
      <div className="mb-2">
        <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Role</label>
        <div className="grid grid-cols-3 gap-1">
          {ROLES.map(r => <button key={r.id} onClick={() => setShiftData({ ...shiftData, role: r.id })} className="px-1.5 py-1 rounded text-xs font-medium" style={{ backgroundColor: shiftData.role === r.id ? r.color : THEME.bg.elevated, color: shiftData.role === r.id ? 'white' : THEME.text.primary, border: `1px solid ${shiftData.role === r.id ? r.color : THEME.border.default}` }}>{r.name}</button>)}
        </div>
      </div>
      
      <div className="mb-2">
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Task <Star size={8} fill={THEME.task} color={THEME.task} className="inline" /></label>
        <input value={shiftData.task} onChange={e => setShiftData({ ...shiftData, task: e.target.value })} placeholder="Optional..." className="w-full px-2 py-1.5 rounded-lg outline-none text-xs" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
      </div>
      
      <div className="p-2 rounded-lg mb-3 grid grid-cols-2 gap-2 text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div><span className="text-xs" style={{ color: THEME.text.muted }}>SHIFT</span><p className="text-lg font-bold" style={{ color: THEME.accent.cyan }}>{shiftHours.toFixed(1)}h</p></div>
        <div><span className="text-xs" style={{ color: THEME.text.muted }}>PERIOD</span><p className="text-lg font-bold" style={{ color: projectedTotal >= 44 ? THEME.status.error : projectedTotal >= 40 ? THEME.status.warning : THEME.accent.cyan }}>{projectedTotal.toFixed(1)}h</p></div>
      </div>
      
      <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
        {existingShift && <GradientButton danger small onClick={handleDelete}><Trash2 size={10} /></GradientButton>}
        <div className="flex gap-2 ml-auto">
          <GradientButton variant="secondary" small onClick={onClose}>Cancel</GradientButton>
          <GradientButton small onClick={handleSave}><Check size={12} />Save</GradientButton>
        </div>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL MODAL - Compact
// ═══════════════════════════════════════════════════════════════════════════════
const EmailModal = ({ isOpen, onClose, employees, shifts, dates, periodInfo, announcement, onComplete }) => {
  // Filter schedulable employees only (exclude owner, exclude admins unless showOnSchedule)
  const emailableEmps = employees
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule);
  
  // Admin contacts for email footer
  const adminContacts = employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted);
  
  const [selected, setSelected] = useState(emailableEmps.reduce((a, e) => ({ ...a, [e.id]: true }), {}));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [results, setResults] = useState([]);
  const [emailMode, setEmailMode] = useState('group'); // 'group' or 'individual'
  
  const toggle = id => setSelected(p => ({ ...p, [id]: !p[id] }));
  const toggleAll = () => { const all = Object.values(selected).every(Boolean); setSelected(emailableEmps.reduce((a, e) => ({ ...a, [e.id]: !all }), {})); };
  
  const handleSend = () => {
    setSending(true);
    const selectedEmps = emailableEmps.filter(e => selected[e.id]);
    const emailResults = [];
    
    const weekNum1 = getWeekNumber(dates[0]);
    const weekNum2 = getWeekNumber(dates[7]);
    const year = periodInfo.startDate.getFullYear();
    const startMonth = formatMonthWord(periodInfo.startDate);
    const startDayNum = periodInfo.startDate.getDate();
    const endMonth = formatMonthWord(periodInfo.endDate);
    const endDayNum = periodInfo.endDate.getDate();
    
    const adminLine = adminContacts.length > 0 
      ? `Contact: ${adminContacts.map(a => `${a.name} (${a.email})`).join(', ')}`
      : '';
    
    // Announcement section for emails
    const announcementSection = (announcement && announcement.message) ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 ${announcement.subject || 'ANNOUNCEMENT'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${announcement.message}

` : '';
    
    if (emailMode === 'group') {
      // Send ONE email with all recipients
      const emails = selectedEmps.map(e => e.email).join(',');
      const subject = `New Schedule Published 🌈 Wk ${weekNum1}, ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}`;
      
      const body = `Hi Team! 🌈

OVER THE RAINBOW - Staff Schedule
Week ${weekNum1} & ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}, ${year}
${announcementSection}
📎 Full schedule PDF attached

Please check your shifts and contact admin if you have any questions.

${adminLine}

Over the Rainbow 🌈
www.rainbowjeans.com`;

      const mailtoLink = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
      
      selectedEmps.forEach(emp => emailResults.push({ emp, status: 'included' }));
      setResults(emailResults);
      setTimeout(() => { setSending(false); setSent(true); }, 800);
      
    } else {
      // Send individual emails
      selectedEmps.forEach((emp, i) => {
        const { subject, body, hasShifts } = buildEmailContent(emp, shifts, dates, periodInfo, adminContacts, announcement);
        if (!hasShifts) { emailResults.push({ emp, status: 'skipped', reason: 'No shifts' }); return; }
        const mailtoLink = `mailto:${emp.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        emailResults.push({ emp, status: 'sent' });
        setTimeout(() => window.open(mailtoLink, '_blank'), i * 600);
      });
      
      setResults(emailResults);
      setTimeout(() => { setSending(false); setSent(true); }, selectedEmps.length * 600 + 500);
    }
  };
  
  const handleClose = () => { setSent(false); setSending(false); setResults([]); onComplete(); onClose(); };
  
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Publish Schedule" size="md">
      {!sent ? (
        <>
          {/* Email mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg mb-3" style={{ backgroundColor: THEME.bg.tertiary }}>
            <button 
              onClick={() => setEmailMode('group')}
              className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all"
              style={{ 
                backgroundColor: emailMode === 'group' ? THEME.accent.purple : 'transparent',
                color: emailMode === 'group' ? '#fff' : THEME.text.muted
              }}>
              📧 One Email (Group)
            </button>
            <button 
              onClick={() => setEmailMode('individual')}
              className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all"
              style={{ 
                backgroundColor: emailMode === 'individual' ? THEME.accent.purple : 'transparent',
                color: emailMode === 'individual' ? '#fff' : THEME.text.muted
              }}>
              📬 Individual Emails
            </button>
          </div>
          
          <div className="p-2 rounded-lg mb-3 text-xs" style={{ backgroundColor: emailMode === 'group' ? THEME.status.success + '15' : THEME.status.warning + '15', border: `1px solid ${emailMode === 'group' ? THEME.status.success + '30' : THEME.status.warning + '30'}` }}>
            {emailMode === 'group' ? (
              <p style={{ color: THEME.status.success }}>✓ One email to all — attach PDF once!</p>
            ) : (
              <p style={{ color: THEME.status.warning }}>⚠ Opens separate email for each person — attach PDF to each</p>
            )}
          </div>
          
          {/* Announcement indicator */}
          {announcement && announcement.message && (
            <div className="p-2 rounded-lg mb-3 text-xs" style={{ backgroundColor: THEME.accent.blue + '15', border: `1px solid ${THEME.accent.blue}30` }}>
              <p style={{ color: THEME.accent.blue }}>
                📢 <strong>{announcement.subject || 'Announcement'}</strong> will be included in {emailMode === 'group' ? 'email' : 'all emails'}
              </p>
            </div>
          )}
          
          <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>Select recipients ({selectedCount}):</p>
          <div className="mb-2"><Checkbox checked={Object.values(selected).every(Boolean)} onChange={toggleAll} label="Select All" /></div>
          <div className="space-y-1 max-h-32 overflow-y-auto p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
            {emailableEmps.map(e => {
              const hasShifts = dates.some(d => shifts[`${e.id}-${d.toISOString().split('T')[0]}`]);
              return (
                <div key={e.id} className="flex items-center justify-between">
                  <Checkbox checked={selected[e.id]} onChange={() => toggle(e.id)} label={e.name} />
                  {!hasShifts && <span className="text-xs" style={{ color: THEME.text.muted }}>(no shifts)</span>}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            <GradientButton variant="secondary" small onClick={handleClose}>Cancel</GradientButton>
            <GradientButton small onClick={handleSend} disabled={sending || selectedCount === 0}>
              {sending ? '...' : <><Send size={10} />{emailMode === 'group' ? 'Open Email' : `Send ${selectedCount}`}</>}
            </GradientButton>
          </div>
        </>
      ) : (
        <div className="text-center py-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.success + '20' }}>
            <Check size={20} style={{ color: THEME.status.success }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: THEME.text.primary }}>
            {emailMode === 'group' ? 'Email Ready!' : 'Emails Opened!'}
          </h3>
          <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>
            {emailMode === 'group' 
              ? 'Attach the PDF and click Send in your email app.' 
              : 'Attach the PDF to each email and send.'}
          </p>
          <div className="text-left p-2 rounded-lg mb-3 max-h-28 overflow-y-auto" style={{ backgroundColor: THEME.bg.tertiary }}>
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 text-xs">
                <span style={{ color: THEME.text.primary }}>{r.emp.name}</span>
                <span style={{ color: r.status === 'skipped' ? THEME.text.muted : THEME.status.success }}>
                  {r.status === 'skipped' ? r.reason : '✓'}
                </span>
              </div>
            ))}
          </div>
          <GradientButton small onClick={handleClose}>Done</GradientButton>
        </div>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE CELL
// ═══════════════════════════════════════════════════════════════════════════════
// Check if employee has approved time off for a specific date
const hasApprovedTimeOffForDate = (employeeEmail, dateStr, timeOffRequests) => {
  if (!timeOffRequests || !employeeEmail) return false;
  return timeOffRequests.some(req => 
    req.email === employeeEmail && 
    req.status === 'approved' && 
    req.datesRequested.split(',').includes(dateStr)
  );
};

const ScheduleCell = ({ shift, date, onClick, availability, storeHours, isDeleted = false, hasApprovedTimeOff = false, isLocked = false }) => {
  const [showTask, setShowTask] = useState(false);
  const starRef = useRef(null);
  const role = shift ? ROLES.find(r => r.id === shift.role) : null;
  const isHoliday = isStatHoliday(date);
  const shading = getAvailabilityShading(availability, storeHours);
  const isFullyUnavailable = !availability.available;
  const hasPartial = availability.available && (shading.top > 5 || shading.bottom > 5);
  
  // Determine if cell is clickable (locked cells can still show tooltips, just can't edit)
  const isClickable = !isDeleted && !isLocked;
  
  return (
    <>
      <div onClick={isClickable ? onClick : undefined} className={`h-14 rounded-lg transition-all relative overflow-hidden ${isClickable ? 'cursor-pointer group' : isLocked && shift ? 'cursor-default' : isLocked ? 'cursor-not-allowed' : ''}`}
        style={{ backgroundColor: shift ? role?.color + '25' : THEME.bg.tertiary, border: `1px solid ${shift ? role?.color + '50' : THEME.border.default}` }}>
        
        {isHoliday && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: THEME.status.warning }} />}
        
        {isFullyUnavailable && !shift && !isDeleted && (
          <div className="absolute inset-0 opacity-60" style={{ background: `repeating-linear-gradient(45deg, transparent, transparent 3px, ${THEME.bg.hover} 3px, ${THEME.bg.hover} 6px)` }} />
        )}
        
        {hasApprovedTimeOff && !shift && !isDeleted && (
          <div className="absolute inset-0 opacity-70" style={{ background: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${THEME.accent.cyan}30 3px, ${THEME.accent.cyan}30 6px)` }} />
        )}
        
        {hasPartial && shading.top > 5 && !shift && !isDeleted && (
          <div className="absolute top-0 left-0 right-0" style={{ height: `${shading.top}%`, background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(45,45,107,0.7) 2px, rgba(45,45,107,0.7) 4px)` }} />
        )}
        
        {hasPartial && shading.bottom > 5 && !shift && !isDeleted && (
          <div className="absolute bottom-0 left-0 right-0" style={{ height: `${shading.bottom}%`, background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(45,45,107,0.7) 2px, rgba(45,45,107,0.7) 4px)` }} />
        )}
        
        {shift ? (
          <div className="p-1.5 h-full flex flex-col justify-between relative">
            {shift.task && (
              <div ref={starRef} className="absolute top-1 right-1 cursor-pointer" onMouseEnter={() => setShowTask(true)} onMouseLeave={() => setShowTask(false)}>
                <Star size={10} fill={THEME.task} color={THEME.task} />
              </div>
            )}
            <span className="text-xs font-semibold truncate pr-3" style={{ color: role?.color }}>{role?.name}</span>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
              <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>{shift.hours}h</span>
            </div>
          </div>
        ) : (
          !isDeleted && !isLocked && (
            <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={14} style={{ color: THEME.text.muted }} />
            </div>
          )
        )}
        {isClickable && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" style={{ border: `2px solid ${THEME.accent.purple}` }} />}
      </div>
      <TaskStarTooltip task={shift?.task} show={showTask} triggerRef={starRef} />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE ROW
// ═══════════════════════════════════════════════════════════════════════════════
const EmployeeRow = ({ employee, dates, shifts, onCellClick, getEmployeeHours, onEdit, isDeleted = false, onShowTooltip, onHideTooltip, timeOffRequests = [], isLocked = false }) => {
  const [showEdit, setShowEdit] = useState(false);
  const rowRef = useRef(null);
  const hours = getEmployeeHours(employee.id);

  const handleMouseEnter = () => {
    setShowEdit(true);
    if (rowRef.current && onShowTooltip) {
      onShowTooltip(employee, hours, rowRef, isDeleted);
    }
  };
  
  const handleMouseLeave = () => {
    setShowEdit(false);
    if (onHideTooltip) onHideTooltip();
  };

  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: '140px repeat(7, 1fr)', backgroundColor: THEME.border.subtle, opacity: isDeleted ? 0.5 : 1 }}>
      <div ref={rowRef} className="p-1.5" style={{ backgroundColor: THEME.bg.secondary }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: isDeleted ? THEME.bg.elevated : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: isDeleted ? THEME.text.muted : 'white' }}>{employee.name.split(' ').map(n => n[0]).join('')}</div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-xs truncate" style={{ color: isDeleted ? THEME.text.muted : THEME.text.primary }}>{employee.name}</p>
            <p className="text-xs font-semibold" style={{ color: isDeleted ? THEME.text.muted : hours >= 40 ? THEME.status.error : hours >= 35 ? THEME.status.warning : THEME.accent.cyan }}>{hours.toFixed(1)}h</p>
          </div>
          {showEdit && !isDeleted && <button onClick={e => { e.stopPropagation(); onEdit(employee); }} className="p-0.5 rounded hover:scale-110 flex-shrink-0" style={{ backgroundColor: THEME.bg.elevated }}><Edit3 size={10} style={{ color: THEME.accent.purple }} /></button>}
        </div>
      </div>
      
      {dates.map((date, i) => {
        const dayName = getDayName(date);
        const av = employee.availability[dayName];
        const storeHrs = getStoreHoursForDate(date);
        const shift = shifts[`${employee.id}-${date.toISOString().split('T')[0]}`];
        const dateStr = date.toISOString().split('T')[0];
        const approvedTimeOff = hasApprovedTimeOffForDate(employee.email, dateStr, timeOffRequests);
        return (
          <div key={i} className="p-0.5" style={{ backgroundColor: THEME.bg.secondary }}>
            <ScheduleCell shift={shift} date={date} availability={av} storeHours={storeHrs} onClick={() => !isDeleted && !isLocked && onCellClick(employee, date, shift)} isDeleted={isDeleted} hasApprovedTimeOff={approvedTimeOff} isLocked={isLocked} />
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT BACKGROUND - FlutterFlow style (static)
// ═══════════════════════════════════════════════════════════════════════════════
export const GradientBackground = () => (
  <div className="fixed inset-0 -z-10" style={{ 
    background: `linear-gradient(135deg, ${THEME.bg.primary} 0%, #080810 40%, #0a0a18 60%, ${THEME.bg.primary} 100%)`
  }}>
    <div className="absolute top-0 left-0 w-96 h-96 opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${THEME.accent.purple} 0%, transparent 70%)` }} />
    <div className="absolute bottom-0 right-0 w-80 h-80 opacity-15 blur-3xl" style={{ background: `radial-gradient(circle, ${THEME.accent.blue} 0%, transparent 70%)` }} />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// LOGO COMPONENT - Matching font style
// ═══════════════════════════════════════════════════════════════════════════════
const Logo = () => (
  <div className="flex flex-col items-center leading-none" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
    <span className="text-xs tracking-[0.25em] font-light" style={{ color: THEME.text.primary }}>OVER THE</span>
    <span className="text-lg tracking-[0.15em] font-semibold -mt-0.5" style={{ color: THEME.text.primary }}>RAINBOW</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN - Staff: email only, Admin: email + password
// ═══════════════════════════════════════════════════════════════════════════════
const LoginScreen = ({ onLogin, onLoadingComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // First-login password change state
  const [pendingUser, setPendingUser] = useState(null); // Employee data waiting for password change
  const [showFirstLoginPassword, setShowFirstLoginPassword] = useState(false);
  
  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await apiCall('login', { 
      email: email.toLowerCase().trim(), 
      password 
    });
    
    setLoading(false);
    
    if (result.success) {
      // Check if using default password — force password change before proceeding
      if (result.data.usingDefaultPassword) {
        setPendingUser(result.data.employee);
        setShowFirstLoginPassword(true);
      } else {
        onLogin(result.data.employee);
      }
    } else {
      setError(result.error?.message || 'Login failed. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
        <div className="text-center mb-6">
          <div style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            <p className="text-xs tracking-widest" style={{ color: THEME.text.muted }}>OVER THE</p>
            <h1 className="text-2xl font-semibold tracking-wider" style={{ color: THEME.text.primary }}>RAINBOW</h1>
          </div>
          <p className="text-sm mt-2" style={{ color: THEME.accent.purple }}>Staff Scheduling</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('password-input')?.focus()}
            placeholder="your.email@example.com"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg outline-none text-sm"
            style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Password</label>
          <input 
            id="password-input"
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg outline-none text-sm"
            style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          />
          <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>First time? Use your employee ID as password</p>
        </div>
        
        {error && <p className="text-xs mb-3" style={{ color: THEME.status.error }}>{error}</p>}
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
          style={{ 
            background: loading ? THEME.bg.tertiary : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, 
            color: '#fff',
            opacity: loading ? 0.7 : 1 
          }}>
          {loading ? <><Loader size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
        </button>
      </div>
      
      {/* First-login forced password change modal */}
      {pendingUser && (
        <ChangePasswordModal
          isOpen={showFirstLoginPassword}
          onClose={() => {}} 
          currentUser={pendingUser}
          isFirstLogin={true}
          onSuccess={() => {
            // Password changed successfully — proceed with login
            onLogin(pendingUser);
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST TIME OFF MODAL - Main menu with 3 request types
// ═══════════════════════════════════════════════════════════════════════════════
const RequestTimeOffModal = ({ isOpen, onClose, onSelectType, currentUser }) => {
  if (!isOpen) return null;
  
  const isAdmin = currentUser?.isAdmin || false;
  
  const requestTypes = [
    { 
      id: 'days-off', 
      name: 'Days Off', 
      description: 'Request specific days or a block of time off',
      icon: Calendar,
      available: true,
      color: THEME.accent.cyan,
      adminOnly: false
    },
    { 
      id: 'shift-swap', 
      name: 'Shift Swap', 
      description: isAdmin ? 'Not available for admins' : 'Trade a shift with another employee',
      icon: Users,
      available: !isAdmin,
      color: THEME.accent.purple,
      adminOnly: false
    },
    { 
      id: 'shift-offer', 
      name: 'Take My Shift', 
      description: isAdmin ? 'Not available for admins' : 'Give away your shift to someone else',
      icon: User,
      available: !isAdmin,
      color: THEME.accent.pink,
      adminOnly: false
    }
  ];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div className="max-w-sm w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: THEME.text.primary }}>
            <Calendar size={16} style={{ color: THEME.accent.cyan }} />
            Shift Changes
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-xs mb-3" style={{ color: THEME.text.muted }}>What type of request would you like to make?</p>
          {requestTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => type.available && onSelectType(type.id)}
                disabled={!type.available}
                className="w-full p-3 rounded-lg text-left transition-all flex items-start gap-3"
                style={{ 
                  backgroundColor: type.available ? THEME.bg.tertiary : THEME.bg.elevated,
                  border: `1px solid ${type.available ? type.color + '30' : THEME.border.subtle}`,
                  opacity: type.available ? 1 : 0.5,
                  cursor: type.available ? 'pointer' : 'not-allowed'
                }}
              >
                <div className="p-2 rounded-lg" style={{ backgroundColor: type.color + '20' }}>
                  <Icon size={16} style={{ color: type.available ? type.color : THEME.text.muted }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-2" style={{ color: type.available ? THEME.text.primary : THEME.text.muted }}>
                    {type.name}
                    {!type.available && isAdmin && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>Employees Only</span>}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DAYS OFF MODAL - Date picker for specific days/block request
// ═══════════════════════════════════════════════════════════════════════════════
const RequestDaysOffModal = ({ isOpen, onClose, onSubmit, currentUser, timeOffRequests = [], shiftOffers = [], shiftSwaps = [], shifts = {} }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDates([]);
      setViewMonth(new Date());
      setIsSubmitting(false);
      setReason('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // GLOBAL CHECK: User can only have ONE pending request across all types
  const hasPendingTimeOff = timeOffRequests.some(req => 
    req.email === currentUser?.email && 
    req.status === 'pending'
  );
  const hasPendingOffer = shiftOffers.some(offer => 
    offer.offererEmail === currentUser?.email && 
    ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)
  );
  const hasPendingSwap = shiftSwaps.some(swap => 
    swap.initiatorEmail === currentUser?.email && 
    ['awaiting_partner', 'awaiting_admin'].includes(swap.status)
  );
  const hasPendingRequest = hasPendingTimeOff || hasPendingOffer || hasPendingSwap;
  
  // Determine which type of pending request for better messaging
  const pendingRequestType = hasPendingTimeOff ? 'time-off request' : 
                             hasPendingOffer ? 'Take My Shift request' : 
                             hasPendingSwap ? 'shift swap request' : null;
  
  // Check if user is scheduled to work on a specific date
  const isScheduledToWork = (dateStr) => {
    if (!currentUser?.id) return false;
    const shiftKey = `${currentUser.id}-${dateStr}`;
    return !!shifts[shiftKey];
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate calendar days for current view month
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();
  
  const calendarDays = [];
  // Add padding for days before month starts
  for (let i = 0; i < startPad; i++) {
    calendarDays.push(null);
  }
  // Add actual days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }
  
  const toggleDate = (date) => {
    if (!date || date < today) return;
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr].sort()
    );
  };
  
  const isSelected = (date) => {
    if (!date) return false;
    return selectedDates.includes(date.toISOString().split('T')[0]);
  };
  
  const isPast = (date) => {
    if (!date) return false;
    return date < today;
  };
  
  const handleSubmit = () => {
    if (selectedDates.length === 0) return;
    setIsSubmitting(true);
    
    const request = {
      requestId: `TOR-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      name: currentUser.name,
      email: currentUser.email,
      datesRequested: selectedDates.join(','),
      status: 'pending',
      reason: reason.trim(),
      createdTimestamp: new Date().toISOString(),
      decidedTimestamp: '',
      decidedBy: '',
      revokedTimestamp: '',
      revokedBy: ''
    };
    
    onSubmit(request);
    onClose();
  };
  
  const formatSelectedSummary = () => {
    if (selectedDates.length === 0) return 'No dates selected';
    if (selectedDates.length === 1) {
      const d = new Date(selectedDates[0] + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    const dates = [...selectedDates].sort();
    const groups = [];
    let start = dates[0], end = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(end + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      if ((curr - prev) / 86400000 === 1) { end = dates[i]; }
      else { groups.push({ start, end }); start = dates[i]; end = dates[i]; }
    }
    groups.push({ start, end });
    const fmt = (g) => {
      const s = new Date(g.start + 'T12:00:00'), e = new Date(g.end + 'T12:00:00');
      if (g.start === g.end) return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (s.getMonth() === e.getMonth()) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}`;
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };
    return `${groups.map(fmt).join(', ')} (${dates.length} days)`;
  };
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div className="max-w-sm w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: THEME.text.primary }}>
            <Calendar size={16} style={{ color: THEME.accent.cyan }} />
            Request Days Off
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>
        
        <div className="p-4">
          {/* Warning: already has pending request */}
          {hasPendingRequest ? (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
              <AlertCircle size={24} style={{ color: THEME.status.warning, margin: '0 auto 8px' }} />
              <p className="text-sm font-medium mb-1" style={{ color: THEME.status.warning }}>One request at a time</p>
              <p className="text-xs" style={{ color: THEME.text.secondary }}>You already have a pending {pendingRequestType}. Please wait for it to be resolved before making another request.</p>
            </div>
          ) : (
          <>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              className="p-1 rounded hover:bg-white/10"
              style={{ color: THEME.text.secondary }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold" style={{ color: THEME.text.primary }}>
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              className="p-1 rounded hover:bg-white/10"
              style={{ color: THEME.text.secondary }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium py-1" style={{ color: THEME.text.muted }}>
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              const dateStr = date ? date.toISOString().split('T')[0] : '';
              const scheduled = date && isScheduledToWork(dateStr);
              const isDisabled = !date || isPast(date) || scheduled;
              
              return (
                <button
                  key={i}
                  onClick={() => !scheduled && toggleDate(date)}
                  disabled={isDisabled}
                  className="aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center relative"
                  style={{
                    backgroundColor: isSelected(date) ? THEME.accent.cyan : scheduled ? THEME.bg.elevated : date ? THEME.bg.tertiary : 'transparent',
                    color: isSelected(date) ? '#000' : isDisabled ? THEME.text.muted + '50' : date ? THEME.text.primary : 'transparent',
                    cursor: !isDisabled ? 'pointer' : 'not-allowed',
                    border: date?.toDateString() === new Date().toDateString() ? `2px solid ${THEME.accent.purple}` : scheduled ? `2px solid ${THEME.status.error}40` : '2px solid transparent'
                  }}
                  title={scheduled ? 'You are scheduled to work – use Take My Shift or Swap instead' : isPast(date) ? 'Past dates cannot be selected' : ''}
                >
                  {date?.getDate()}
                  {scheduled && <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THEME.status.error }} />}
                </button>
              );
            })}
          </div>
          
          {/* Info about blocked scheduled days */}
          <div className="mt-2 p-2 rounded-lg flex items-start gap-2" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
            <AlertCircle size={14} style={{ color: THEME.text.muted, flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: THEME.text.muted }}>
              Days you're scheduled to work (marked with <span style={{ color: THEME.status.error }}>●</span>) cannot be requested off. Use <strong>Take My Shift</strong> or <strong>Shift Swap</strong> instead.
            </p>
          </div>
          
          {/* Selected summary */}
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
            <p className="text-xs" style={{ color: THEME.text.muted }}>Selected:</p>
            <p className="text-sm font-medium" style={{ color: selectedDates.length > 0 ? THEME.accent.cyan : THEME.text.muted }}>
              {formatSelectedSummary()}
            </p>
          </div>
          
          {/* Reason field */}
          <div className="mt-3">
            <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
              Reason <span style={{ color: THEME.text.muted }}>(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Family vacation, medical appointment..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg resize-none"
              style={{ 
                backgroundColor: THEME.bg.tertiary, 
                border: `1px solid ${THEME.border.default}`,
                color: THEME.text.primary,
                outline: 'none'
              }}
              maxLength={200}
            />
            <p className="text-xs mt-1 text-right" style={{ color: THEME.text.muted }}>
              {reason.length}/200
            </p>
          </div>
          
          {/* Tip */}
          <p className="text-xs mt-3" style={{ color: THEME.text.muted }}>
            💡 Tip: Click dates to select/deselect. You can select multiple individual days or a continuous block.
          </p>
          
          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button 
              onClick={onClose} 
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg"
              style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={selectedDates.length === 0 || isSubmitting}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
            >
              {isSubmitting ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
              Submit Request
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// OFFER SHIFT MODAL - Give away a shift to another employee
// ═══════════════════════════════════════════════════════════════════════════════
const OfferShiftModal = ({ isOpen, onClose, onSubmit, currentUser, employees, shifts, shiftOffers, timeOffRequests = [], shiftSwaps = [] }) => {
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedShift(null);
      setSelectedRecipient(null);
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Defensive: ensure we have valid data
  const safeShifts = shifts || {};
  const safeShiftOffers = shiftOffers || [];
  const safeEmployees = employees || [];
  const safeTimeOffRequests = timeOffRequests || [];
  const safeShiftSwaps = shiftSwaps || [];
  
  // Get current user's future shifts (not today, not past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // GLOBAL CHECK: User can only have ONE pending request across all types
  const hasPendingTimeOff = safeTimeOffRequests.some(req => 
    req.email === currentUser?.email && 
    req.status === 'pending'
  );
  const hasPendingOfferCheck = safeShiftOffers.some(offer => 
    offer.offererEmail === currentUser?.email && 
    ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)
  );
  const hasPendingSwap = safeShiftSwaps.some(swap => 
    swap.initiatorEmail === currentUser?.email && 
    ['awaiting_partner', 'awaiting_admin'].includes(swap.status)
  );
  const hasPendingOffer = hasPendingTimeOff || hasPendingOfferCheck || hasPendingSwap;
  
  // Determine which type of pending request for better messaging
  const pendingRequestType = hasPendingTimeOff ? 'time-off request' : 
                             hasPendingOfferCheck ? 'Take My Shift request' : 
                             hasPendingSwap ? 'shift swap request' : null;
  
  const myFutureShifts = Object.entries(safeShifts)
    .filter(([key, shift]) => {
      if (!shift) return false;
      // Key format: "emp-2-2026-02-05" - date is always last 10 chars (YYYY-MM-DD)
      if (key.length < 11) return false; // Safety check
      const dateStr = key.slice(-10);
      const empId = key.slice(0, -11); // Everything before the last dash and date
      if (empId !== currentUser?.id) return false;
      // Parse date properly - add T12:00:00 to avoid timezone issues
      const shiftDate = new Date(dateStr + 'T12:00:00');
      const tomorrowNoon = new Date(tomorrow);
      tomorrowNoon.setHours(12, 0, 0, 0);
      return shiftDate >= tomorrowNoon; // Must be at least tomorrow
    })
    .map(([key, shift]) => {
      const dateStr = key.slice(-10);
      return { key, dateStr, ...shift };
    })
    .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
  
  // Check if shift is already being offered (has pending/awaiting offer)
  const isShiftAlreadyOffered = (dateStr) => {
    return safeShiftOffers.some(offer => 
      offer.offererEmail === currentUser?.email && 
      offer.shiftDate === dateStr &&
      ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)
    );
  };
  
  // Get eligible recipients (active employees, not current user, not admins)
  const eligibleRecipients = safeEmployees.filter(emp => 
    emp.active && 
    !emp.deleted && 
    emp.email !== currentUser?.email &&
    !emp.isOwner &&
    !emp.isAdmin // Admins cannot be recipients
  );
  
  // Check if recipient already works on selected date
  const recipientWorksOnDate = (recipientId, dateStr) => {
    const shiftKey = `${recipientId}-${dateStr}`;
    return !!safeShifts[shiftKey];
  };
  
  const handleSelectRecipient = (emp) => {
    if (!selectedShift) return;
    
    if (recipientWorksOnDate(emp.id, selectedShift.dateStr)) {
      setError(`${emp.name} is already working on ${formatDateLong(new Date(selectedShift.dateStr))}.`);
      setSelectedRecipient(null);
    } else {
      setError('');
      setSelectedRecipient(emp);
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedShift || !selectedRecipient) return;
    
    setIsSubmitting(true);
    
    // Generate offer ID: OFFER-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const offerId = `OFFER-${dateStr}-${randomSuffix}`;
    
    const newOffer = {
      offerId,
      offererName: currentUser.name,
      offererEmail: currentUser.email,
      recipientName: selectedRecipient.name,
      recipientEmail: selectedRecipient.email,
      shiftDate: selectedShift.dateStr,
      shiftStart: selectedShift.startTime,
      shiftEnd: selectedShift.endTime,
      shiftRole: selectedShift.role || 'none',
      status: 'awaiting_recipient',
      recipientNote: '',
      adminNote: '',
      createdTimestamp: new Date().toISOString(),
      recipientRespondedTimestamp: '',
      adminDecidedTimestamp: '',
      adminDecidedBy: '',
      cancelledTimestamp: '',
    };
    
    // Simulate brief delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onSubmit(newOffer);
    setIsSubmitting(false);
    onClose();
  };
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.fullName : 'No Role';
  };
  
  const getRoleColor = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.color : THEME.roles.none;
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div className="max-w-md w-full rounded-xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.accent.pink}20, ${THEME.bg.secondary})` }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: THEME.text.primary }}>
            <User size={16} style={{ color: THEME.accent.pink }} />
            Take My Shift
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Warning: already has pending offer */}
          {hasPendingOffer ? (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
              <AlertCircle size={24} style={{ color: THEME.status.warning, margin: '0 auto 8px' }} />
              <p className="text-sm font-medium mb-1" style={{ color: THEME.status.warning }}>One request at a time</p>
              <p className="text-xs" style={{ color: THEME.text.secondary }}>You already have a pending {pendingRequestType}. Please wait for it to be resolved before making another request.</p>
            </div>
          ) : (
          <>
          {/* Step 1: Select Your Shift */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>1. Select your shift to give away</p>
            {myFutureShifts.length === 0 ? (
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
                <p className="text-xs" style={{ color: THEME.text.muted }}>You have no upcoming shifts to offer.</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {myFutureShifts.map(shift => {
                  const isOffered = isShiftAlreadyOffered(shift.dateStr);
                  const isSelected = selectedShift?.key === shift.key;
                  const shiftDate = new Date(shift.dateStr);
                  
                  return (
                    <button
                      key={shift.key}
                      onClick={() => !isOffered && setSelectedShift(shift)}
                      disabled={isOffered}
                      className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                      style={{ 
                        backgroundColor: isSelected ? THEME.accent.pink + '20' : THEME.bg.tertiary,
                        border: `1px solid ${isSelected ? THEME.accent.pink : THEME.border.subtle}`,
                        opacity: isOffered ? 0.5 : 1,
                        cursor: isOffered ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-center w-10">
                          <div className="text-xs font-bold" style={{ color: THEME.text.primary }}>{getDayNameShort(shiftDate)}</div>
                          <div className="text-xs" style={{ color: THEME.text.muted }}>{formatDate(shiftDate)}</div>
                        </div>
                        <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
                        <div>
                          <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                            {formatTimeDisplay(shift.startTime)} – {formatTimeDisplay(shift.endTime)}
                          </div>
                          <div className="text-xs flex items-center gap-1" style={{ color: getRoleColor(shift.role) }}>
                            {getRoleName(shift.role)}
                          </div>
                        </div>
                      </div>
                      {isOffered && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.status.warning + '20', color: THEME.status.warning }}>
                          Pending
                        </span>
                      )}
                      {isSelected && !isOffered && (
                        <Check size={14} style={{ color: THEME.accent.pink }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Step 2: Select Recipient */}
          {selectedShift && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>2. Who will take this shift?</p>
              {error && (
                <div className="mb-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.error + '20', border: `1px solid ${THEME.status.error}30` }}>
                  <AlertCircle size={14} style={{ color: THEME.status.error }} />
                  <span className="text-xs" style={{ color: THEME.status.error }}>{error}</span>
                </div>
              )}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {eligibleRecipients.map(emp => {
                  const isSelected = selectedRecipient?.id === emp.id;
                  const alreadyWorks = recipientWorksOnDate(emp.id, selectedShift.dateStr);
                  
                  return (
                    <button
                      key={emp.id}
                      onClick={() => !alreadyWorks && handleSelectRecipient(emp)}
                      disabled={alreadyWorks}
                      className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                      style={{ 
                        backgroundColor: isSelected ? THEME.accent.pink + '20' : alreadyWorks ? THEME.bg.elevated : THEME.bg.tertiary,
                        border: `1px solid ${isSelected ? THEME.accent.pink : THEME.border.subtle}`,
                        opacity: alreadyWorks ? 0.5 : 1,
                        cursor: alreadyWorks ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ 
                          background: alreadyWorks ? THEME.bg.tertiary : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                          color: alreadyWorks ? THEME.text.muted : 'white'
                        }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-medium flex items-center gap-1" style={{ color: alreadyWorks ? THEME.text.muted : THEME.text.primary }}>
                            {emp.name}
                            {emp.isAdmin && <Shield size={10} style={{ color: THEME.accent.purple }} />}
                          </div>
                          <div className="text-xs" style={{ color: THEME.text.muted }}>{emp.email}</div>
                        </div>
                      </div>
                      {alreadyWorks && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}>
                          Already Working
                        </span>
                      )}
                      {isSelected && !alreadyWorks && (
                        <Check size={14} style={{ color: THEME.accent.pink }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 flex justify-end gap-2 flex-shrink-0" style={{ borderTop: `1px solid ${THEME.border.subtle}`, backgroundColor: THEME.bg.tertiary }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedShift || !selectedRecipient || isSubmitting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
            style={{ 
              background: selectedShift && selectedRecipient ? `linear-gradient(135deg, ${THEME.accent.pink}, ${THEME.accent.purple})` : THEME.bg.elevated,
              color: selectedShift && selectedRecipient ? 'white' : THEME.text.muted,
              opacity: (!selectedShift || !selectedRecipient || isSubmitting) ? 0.5 : 1
            }}
          >
            {isSubmitting ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
            Send Offer
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SWAP SHIFT MODAL - Exchange shifts with another employee
// ═══════════════════════════════════════════════════════════════════════════════
const SwapShiftModal = ({ isOpen, onClose, onSubmit, currentUser, employees, shifts, shiftSwaps, timeOffRequests = [], shiftOffers = [] }) => {
  const [step, setStep] = useState(1); // 1: select your shift, 2: select partner, 3: select their shift
  const [selectedMyShift, setSelectedMyShift] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedTheirShift, setSelectedTheirShift] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedMyShift(null);
      setSelectedPartner(null);
      setSelectedTheirShift(null);
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Defensive: ensure we have valid data
  const safeShifts = shifts || {};
  const safeShiftSwaps = shiftSwaps || [];
  const safeEmployees = employees || [];
  const safeTimeOffRequests = timeOffRequests || [];
  const safeShiftOffers = shiftOffers || [];
  
  // Get dates for future shifts (not today, not past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // GLOBAL CHECK: User can only have ONE pending request across all types
  const hasPendingTimeOff = safeTimeOffRequests.some(req => 
    req.email === currentUser?.email && 
    req.status === 'pending'
  );
  const hasPendingOffer = safeShiftOffers.some(offer => 
    offer.offererEmail === currentUser?.email && 
    ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)
  );
  const hasPendingSwapCheck = safeShiftSwaps.some(swap => 
    swap.initiatorEmail === currentUser?.email && 
    ['awaiting_partner', 'awaiting_admin'].includes(swap.status)
  );
  const hasPendingSwap = hasPendingTimeOff || hasPendingOffer || hasPendingSwapCheck;
  
  // Determine which type of pending request for better messaging
  const pendingRequestType = hasPendingTimeOff ? 'time-off request' : 
                             hasPendingOffer ? 'Take My Shift request' : 
                             hasPendingSwapCheck ? 'shift swap request' : null;
  
  // Helper to get future shifts for an employee
  const getFutureShifts = (empId) => {
    return Object.entries(safeShifts)
      .filter(([key, shift]) => {
        if (!shift) return false;
        if (key.length < 11) return false;
        const dateStr = key.slice(-10);
        const keyEmpId = key.slice(0, -11);
        if (keyEmpId !== empId) return false;
        const shiftDate = new Date(dateStr + 'T12:00:00');
        const tomorrowNoon = new Date(tomorrow);
        tomorrowNoon.setHours(12, 0, 0, 0);
        return shiftDate >= tomorrowNoon;
      })
      .map(([key, shift]) => {
        const dateStr = key.slice(-10);
        return { key, dateStr, ...shift };
      })
      .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
  };
  
  const myFutureShifts = getFutureShifts(currentUser?.id);
  
  // Check if a swap already exists for these two shifts (prevents duplicate swaps)
  const isSwapAlreadyPending = (myShiftDate, theirShiftDate, partnerEmail) => {
    return safeShiftSwaps.some(swap => {
      if (!['awaiting_partner', 'awaiting_admin'].includes(swap.status)) return false;
      // Check both directions
      const matchForward = swap.initiatorEmail === currentUser?.email && 
                          swap.initiatorShiftDate === myShiftDate &&
                          swap.partnerEmail === partnerEmail &&
                          swap.partnerShiftDate === theirShiftDate;
      const matchReverse = swap.partnerEmail === currentUser?.email &&
                          swap.partnerShiftDate === myShiftDate &&
                          swap.initiatorEmail === partnerEmail &&
                          swap.initiatorShiftDate === theirShiftDate;
      return matchForward || matchReverse;
    });
  };
  
  // Get eligible partners (active employees, not current user, not admins)
  const eligiblePartners = safeEmployees.filter(emp => 
    emp.active && 
    !emp.deleted && 
    emp.email !== currentUser?.email &&
    !emp.isOwner &&
    !emp.isAdmin
  );
  
  // Get selected partner's future shifts
  const partnerFutureShifts = selectedPartner ? getFutureShifts(selectedPartner.id) : [];
  
  const handleSelectPartner = (emp) => {
    setSelectedPartner(emp);
    setSelectedTheirShift(null);
    setError('');
    setStep(3);
  };
  
  const handleSelectTheirShift = (shift) => {
    // Check if this swap is already pending
    if (isSwapAlreadyPending(selectedMyShift.dateStr, shift.dateStr, selectedPartner.email)) {
      setError('There is already a pending swap request involving these shifts.');
      return;
    }
    setSelectedTheirShift(shift);
    setError('');
  };
  
  const handleSubmit = async () => {
    if (!selectedMyShift || !selectedPartner || !selectedTheirShift) return;
    
    setIsSubmitting(true);
    
    // Generate swap ID: SWAP-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const swapId = `SWAP-${dateStr}-${randomSuffix}`;
    
    const newSwap = {
      swapId,
      initiatorName: currentUser.name,
      initiatorEmail: currentUser.email,
      initiatorShiftDate: selectedMyShift.dateStr,
      initiatorShiftStart: selectedMyShift.startTime,
      initiatorShiftEnd: selectedMyShift.endTime,
      initiatorShiftRole: selectedMyShift.role || 'none',
      partnerName: selectedPartner.name,
      partnerEmail: selectedPartner.email,
      partnerShiftDate: selectedTheirShift.dateStr,
      partnerShiftStart: selectedTheirShift.startTime,
      partnerShiftEnd: selectedTheirShift.endTime,
      partnerShiftRole: selectedTheirShift.role || 'none',
      status: 'awaiting_partner',
      partnerNote: '',
      adminNote: '',
      createdTimestamp: new Date().toISOString(),
      partnerRespondedTimestamp: '',
      adminDecidedTimestamp: '',
      adminDecidedBy: '',
      revokedTimestamp: '',
      revokedBy: '',
    };
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onSubmit(newSwap);
    setIsSubmitting(false);
    onClose();
  };
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.fullName : 'No Role';
  };
  
  const getRoleColor = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.color : THEME.roles.none;
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div className="max-w-md w-full rounded-xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.accent.purple}20, ${THEME.bg.secondary})` }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: THEME.text.primary }}>
            <ArrowRightLeft size={16} style={{ color: THEME.accent.purple }} />
            Swap Shifts
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Warning: already has pending swap */}
          {hasPendingSwap ? (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
              <AlertCircle size={24} style={{ color: THEME.status.warning, margin: '0 auto 8px' }} />
              <p className="text-sm font-medium mb-1" style={{ color: THEME.status.warning }}>One swap at a time</p>
              <p className="text-xs" style={{ color: THEME.text.secondary }}>You already have a pending {pendingRequestType}. Please wait for it to be resolved before making another request.</p>
            </div>
          ) : (
          <>
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: step >= s ? THEME.accent.purple : THEME.bg.tertiary,
                    color: step >= s ? 'white' : THEME.text.muted
                  }}
                >
                  {s}
                </div>
                {s < 3 && <div className="w-6 h-px" style={{ backgroundColor: step > s ? THEME.accent.purple : THEME.border.default }} />}
              </div>
            ))}
          </div>
          <div className="text-center text-xs mb-3" style={{ color: THEME.text.muted }}>
            {step === 1 && 'Select your shift to swap'}
            {step === 2 && 'Select who to swap with'}
            {step === 3 && 'Select their shift you want'}
          </div>
          
          {/* Step 1: Select Your Shift */}
          {step === 1 && (
            <div>
              {myFutureShifts.length === 0 ? (
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <p className="text-xs" style={{ color: THEME.text.muted }}>You have no upcoming shifts to swap.</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {myFutureShifts.map(shift => {
                    const isSelected = selectedMyShift?.key === shift.key;
                    const shiftDate = new Date(shift.dateStr + 'T12:00:00');
                    
                    return (
                      <button
                        key={shift.key}
                        onClick={() => { setSelectedMyShift(shift); setStep(2); }}
                        className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                        style={{ 
                          backgroundColor: isSelected ? THEME.accent.purple + '20' : THEME.bg.tertiary,
                          border: `1px solid ${isSelected ? THEME.accent.purple : THEME.border.subtle}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-center w-12">
                            <div className="text-xs font-bold" style={{ color: THEME.text.primary }}>{getDayNameShort(shiftDate)}</div>
                            <div className="text-xs" style={{ color: THEME.text.muted }}>{formatDate(shiftDate)}</div>
                          </div>
                          <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
                          <div>
                            <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                              {formatTimeDisplay(shift.startTime)} – {formatTimeDisplay(shift.endTime)}
                            </div>
                            <div className="text-xs" style={{ color: getRoleColor(shift.role) }}>
                              {getRoleName(shift.role)}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={14} style={{ color: THEME.accent.purple }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Select Partner */}
          {step === 2 && (
            <div>
              {/* Show selected shift summary */}
              {selectedMyShift && (
                <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: THEME.accent.purple + '10', border: `1px solid ${THEME.accent.purple}30` }}>
                  <p className="text-xs" style={{ color: THEME.text.muted }}>Your shift:</p>
                  <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                    {getDayNameShort(new Date(selectedMyShift.dateStr + 'T12:00:00'))}, {formatDate(new Date(selectedMyShift.dateStr + 'T12:00:00'))} • {formatTimeDisplay(selectedMyShift.startTime)} – {formatTimeDisplay(selectedMyShift.endTime)}
                  </p>
                </div>
              )}
              
              <p className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Who do you want to swap with?</p>
              {eligiblePartners.length === 0 ? (
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <p className="text-xs" style={{ color: THEME.text.muted }}>No eligible employees to swap with.</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {eligiblePartners.map(emp => {
                    const theirShifts = getFutureShifts(emp.id);
                    const hasShifts = theirShifts.length > 0;
                    
                    return (
                      <button
                        key={emp.id}
                        onClick={() => hasShifts && handleSelectPartner(emp)}
                        disabled={!hasShifts}
                        className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                        style={{ 
                          backgroundColor: THEME.bg.tertiary,
                          border: `1px solid ${THEME.border.subtle}`,
                          opacity: hasShifts ? 1 : 0.5,
                          cursor: hasShifts ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ 
                            background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                            color: 'white'
                          }}>
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>{emp.name}</div>
                            <div className="text-xs" style={{ color: THEME.text.muted }}>
                              {hasShifts ? `${theirShifts.length} upcoming shift${theirShifts.length > 1 ? 's' : ''}` : 'No upcoming shifts'}
                            </div>
                          </div>
                        </div>
                        {hasShifts && <ChevronRight size={14} style={{ color: THEME.text.muted }} />}
                      </button>
                    );
                  })}
                </div>
              )}
              
              <button 
                onClick={() => setStep(1)} 
                className="mt-3 text-xs flex items-center gap-1"
                style={{ color: THEME.text.muted }}
              >
                <ChevronLeft size={12} /> Back to your shifts
              </button>
            </div>
          )}
          
          {/* Step 3: Select Their Shift */}
          {step === 3 && selectedPartner && (
            <div>
              {/* Show selected shift summary */}
              {selectedMyShift && (
                <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: THEME.accent.purple + '10', border: `1px solid ${THEME.accent.purple}30` }}>
                  <p className="text-xs" style={{ color: THEME.text.muted }}>Your shift:</p>
                  <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                    {getDayNameShort(new Date(selectedMyShift.dateStr + 'T12:00:00'))}, {formatDate(new Date(selectedMyShift.dateStr + 'T12:00:00'))} • {formatTimeDisplay(selectedMyShift.startTime)} – {formatTimeDisplay(selectedMyShift.endTime)}
                  </p>
                </div>
              )}
              
              <p className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Select {selectedPartner.name}'s shift you want:</p>
              
              {error && (
                <div className="mb-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.error + '20', border: `1px solid ${THEME.status.error}30` }}>
                  <AlertCircle size={14} style={{ color: THEME.status.error }} />
                  <span className="text-xs" style={{ color: THEME.status.error }}>{error}</span>
                </div>
              )}
              
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {partnerFutureShifts.map(shift => {
                  const isSelected = selectedTheirShift?.key === shift.key;
                  const shiftDate = new Date(shift.dateStr + 'T12:00:00');
                  
                  return (
                    <button
                      key={shift.key}
                      onClick={() => handleSelectTheirShift(shift)}
                      className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                      style={{ 
                        backgroundColor: isSelected ? THEME.accent.purple + '20' : THEME.bg.tertiary,
                        border: `1px solid ${isSelected ? THEME.accent.purple : THEME.border.subtle}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-center w-12">
                          <div className="text-xs font-bold" style={{ color: THEME.text.primary }}>{getDayNameShort(shiftDate)}</div>
                          <div className="text-xs" style={{ color: THEME.text.muted }}>{formatDate(shiftDate)}</div>
                        </div>
                        <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
                        <div>
                          <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                            {formatTimeDisplay(shift.startTime)} – {formatTimeDisplay(shift.endTime)}
                          </div>
                          <div className="text-xs" style={{ color: getRoleColor(shift.role) }}>
                            {getRoleName(shift.role)}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} style={{ color: THEME.accent.purple }} />}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => { setStep(2); setSelectedTheirShift(null); }} 
                className="mt-3 text-xs flex items-center gap-1"
                style={{ color: THEME.text.muted }}
              >
                <ChevronLeft size={12} /> Back to partner selection
              </button>
            </div>
          )}
          </>
          )}
        </div>
        
        {/* Footer */}
        {!hasPendingSwap && (
          <div className="px-4 py-3 flex justify-end gap-2 flex-shrink-0" style={{ borderTop: `1px solid ${THEME.border.subtle}`, backgroundColor: THEME.bg.tertiary }}>
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedMyShift || !selectedPartner || !selectedTheirShift || isSubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
              style={{ 
                background: selectedMyShift && selectedPartner && selectedTheirShift ? `linear-gradient(135deg, ${THEME.accent.purple}, ${THEME.accent.blue})` : THEME.bg.elevated,
                color: selectedMyShift && selectedPartner && selectedTheirShift ? 'white' : THEME.text.muted,
                opacity: (!selectedMyShift || !selectedPartner || !selectedTheirShift || isSubmitting) ? 0.5 : 1
              }}
            >
              {isSubmitting ? <Loader size={12} className="animate-spin" /> : <ArrowRightLeft size={12} />}
              Request Swap
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION - Reusable wrapper for collapsible content
// ═══════════════════════════════════════════════════════════════════════════════
const CollapsibleSection = ({ title, icon: Icon, iconColor, badge, badgeColor, children, defaultOpen = true, notificationCount, onOpen }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;
  
  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    // Call onOpen when expanding (to mark as seen)
    if (newIsOpen && onOpen) {
      onOpen();
    }
  };
  
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:opacity-90 transition-opacity"
        style={{ backgroundColor: THEME.bg.tertiary }}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} style={{ color: iconColor || THEME.accent.cyan }} />}
          <span className="text-sm font-semibold" style={{ color: THEME.text.primary }}>{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: (badgeColor || THEME.accent.cyan) + '20', color: badgeColor || THEME.accent.cyan }}>
              {badge}
            </span>
          )}
          {/* New/Unseen notification indicator */}
          {notificationCount > 0 && !isOpen && (
            <span className="px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1" style={{ backgroundColor: THEME.accent.pink, color: 'white' }}>
              <Bell size={10} />
              {notificationCount} new
            </span>
          )}
        </div>
        <ChevronIcon size={16} style={{ color: THEME.text.muted }} />
      </button>
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN TIME OFF PANEL - Admin view of all time off requests
// ═══════════════════════════════════════════════════════════════════════════════
const AdminTimeOffPanel = ({ requests, onApprove, onDeny, onRevoke, currentAdminEmail }) => {
  const [filter, setFilter] = useState('pending');
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Filter requests based on selected filter
  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'settled') return ['approved', 'denied', 'cancelled', 'revoked'].includes(r.status);
    return r.status === filter;
  });
  
  // Sort: pending by created date (oldest first for queue), settled by decided date (newest first)
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (filter === 'pending') {
      return new Date(a.createdTimestamp) - new Date(b.createdTimestamp);
    }
    return new Date(b.decidedTimestamp || b.createdTimestamp) - new Date(a.decidedTimestamp || a.createdTimestamp);
  });
  
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  
  const formatRequestDates = (datesStr) => {
    const dates = datesStr.split(',').sort();
    if (dates.length === 1) {
      const d = new Date(dates[0] + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    const groups = [];
    let start = dates[0], end = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(end + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      if ((curr - prev) / 86400000 === 1) { end = dates[i]; }
      else { groups.push({ start, end }); start = dates[i]; end = dates[i]; }
    }
    groups.push({ start, end });
    const fmt = (g) => {
      const s = new Date(g.start + 'T12:00:00'), e = new Date(g.end + 'T12:00:00');
      if (g.start === g.end) return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (s.getMonth() === e.getMonth()) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}`;
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };
    return `${groups.map(fmt).join(', ')} (${dates.length} days)`;
  };
  
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  
  const getStatusLabel = (status) => {
    const labels = { pending: 'Pending', approved: 'Approved', denied: 'Denied', cancelled: 'Cancelled', revoked: 'Revoked' };
    return labels[status] || status;
  };
  
  // Check if request has any future dates (for revoke eligibility)
  const hasFutureDates = (datesStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = datesStr.split(',');
    return dates.some(d => new Date(d + 'T12:00:00') >= today);
  };
  
  const handleApprove = (request) => {
    onApprove(request.requestId, '');
  };
  
  const openDenyModal = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setDenyModalOpen(true);
  };
  
  const handleDeny = () => {
    if (selectedRequest) {
      onDeny(selectedRequest.requestId, adminNotes);
      setDenyModalOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    }
  };
  
  const openRevokeModal = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setRevokeModalOpen(true);
  };
  
  const handleRevoke = () => {
    if (selectedRequest) {
      onRevoke(selectedRequest.requestId, adminNotes);
      setRevokeModalOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    }
  };
  
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      {/* Header */}
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: THEME.text.primary }}>
        <ClipboardList size={16} style={{ color: THEME.accent.purple }} />
        Time Off Requests
      </h2>
      
      {/* Filter tabs - matching other panels */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { id: 'pending', label: 'Pending', count: pendingCount },
          { id: 'settled', label: 'Settled' },
          { id: 'all', label: 'All' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            style={{
              backgroundColor: filter === f.id ? THEME.accent.purple + '20' : THEME.bg.tertiary,
              color: filter === f.id ? THEME.accent.purple : THEME.text.secondary,
              border: `1px solid ${filter === f.id ? THEME.accent.purple + '50' : THEME.border.subtle}`
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span className="px-1 rounded text-xs" style={{ backgroundColor: THEME.accent.purple, color: 'white' }}>{f.count}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* Requests list */}
      {sortedRequests.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardList size={32} style={{ color: THEME.text.muted, margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: THEME.text.muted }}>
            {filter === 'pending' ? 'No pending requests' : 'No requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRequests.map(request => (
            <div
              key={request.requestId}
              className="p-3 rounded-lg"
              style={{
                backgroundColor: request.status === 'pending' ? THEME.status.warning + '10' : THEME.bg.tertiary,
                border: `1px solid ${request.status === 'pending' ? THEME.status.warning + '30' : THEME.border.subtle}`
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Employee name */}
                  <p className="text-sm font-semibold" style={{ color: THEME.text.primary }}>
                    {request.name}
                  </p>
                  
                  {/* Dates */}
                  <p className="text-xs mt-0.5" style={{ color: THEME.accent.cyan }}>
                    {formatRequestDates(request.datesRequested)}
                  </p>
                  
                  {/* Submitted time */}
                  <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>
                    Submitted {formatTimestamp(request.createdTimestamp)}
                  </p>
                  
                  {/* Employee's reason (for pending requests) */}
                  {request.reason && request.status === 'pending' && (
                    <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated }}>
                      <span style={{ color: THEME.text.muted }}>Reason: </span>
                      <span style={{ color: THEME.text.secondary }}>{request.reason}</span>
                    </div>
                  )}
                  
                  {/* Employee's reason for settled requests (always show) */}
                  {request.reason && request.status !== 'pending' && (
                    <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated }}>
                      <span style={{ color: THEME.text.muted }}>Employee's reason: </span>
                      <span style={{ color: THEME.text.secondary }}>{request.reason}</span>
                    </div>
                  )}
                  
                  {/* Decided info for settled */}
                  {request.status !== 'pending' && request.decidedTimestamp && (
                    <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>
                      {request.status === 'cancelled' ? 'Cancelled' : `Decided`} {formatTimestamp(request.decidedTimestamp)}
                      {request.decidedBy && request.status !== 'cancelled' && ` by ${request.decidedBy.split('@')[0]}`}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {/* Status badge */}
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: REQUEST_STATUS_COLORS[request.status] + '20',
                      color: REQUEST_STATUS_COLORS[request.status]
                    }}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                  
                  {/* Action buttons */}
                  {request.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleApprove(request)}
                        className="px-2 py-1 text-xs font-medium rounded flex items-center gap-1 hover:opacity-80"
                        style={{ backgroundColor: THEME.status.success, color: 'white' }}
                      >
                        <Check size={10} />
                        Approve
                      </button>
                      <button
                        onClick={() => openDenyModal(request)}
                        className="px-2 py-1 text-xs font-medium rounded flex items-center gap-1 hover:opacity-80"
                        style={{ backgroundColor: THEME.status.error, color: 'white' }}
                      >
                        <X size={10} />
                        Deny
                      </button>
                    </div>
                  )}
                  
                  {/* Revoke button for approved requests with future dates */}
                  {request.status === 'approved' && hasFutureDates(request.datesRequested) && (
                    <button
                      onClick={() => openRevokeModal(request)}
                      className="px-2 py-1 text-xs font-medium rounded flex items-center gap-1 hover:opacity-80"
                      style={{ backgroundColor: '#F97316', color: 'white' }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Deny Modal */}
      {denyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => setDenyModalOpen(false)}>
          <div className="max-w-sm w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
              <h2 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>Deny Request</h2>
              <button onClick={() => setDenyModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: THEME.text.secondary }}><X size={16} /></button>
            </div>
            <div className="p-3">
              <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
                Denying time off for <strong>{selectedRequest?.name}</strong>: {selectedRequest && formatRequestDates(selectedRequest.datesRequested)}
              </p>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Reason for denial (optional but recommended)"
                className="w-full px-2 py-1.5 rounded-lg outline-none text-xs resize-none"
                style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, minHeight: 60 }}
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setDenyModalOpen(false)} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}>Cancel</button>
                <button onClick={handleDeny} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.status.error, color: 'white' }}>Deny Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Revoke Modal */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => setRevokeModalOpen(false)}>
          <div className="max-w-sm w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
              <h2 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>Revoke Approved Time Off</h2>
              <button onClick={() => setRevokeModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: THEME.text.secondary }}><X size={16} /></button>
            </div>
            <div className="p-3">
              <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
                Revoking approved time off for <strong>{selectedRequest?.name}</strong>: {selectedRequest && formatRequestDates(selectedRequest.datesRequested)}
              </p>
              <p className="text-xs mb-2 p-2 rounded" style={{ backgroundColor: THEME.status.warning + '20', color: THEME.status.warning }}>
                ⚠️ The employee will be notified that their approved time off has been revoked.
              </p>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Reason for revoking (recommended)"
                className="w-full px-2 py-1.5 rounded-lg outline-none text-xs resize-none"
                style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, minHeight: 60 }}
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setRevokeModalOpen(false)} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}>Cancel</button>
                <button onClick={handleRevoke} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: '#F97316', color: 'white' }}>Revoke Time Off</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MY REQUESTS PANEL - Employee's own time off requests
// ═══════════════════════════════════════════════════════════════════════════════
const MyRequestsPanel = ({ requests, currentUserEmail, onCancel, notificationCount, onOpen }) => {
  // Filter to show only this user's requests
  const myRequests = requests.filter(r => r.email === currentUserEmail);
  
  // Sort: pending first, then by date (newest first)
  const sortedRequests = [...myRequests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
  });
  
  const formatRequestDates = (datesStr) => {
    const dates = datesStr.split(',').sort();
    if (dates.length === 1) {
      const d = new Date(dates[0] + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    const groups = [];
    let start = dates[0], end = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(end + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      if ((curr - prev) / 86400000 === 1) { end = dates[i]; }
      else { groups.push({ start, end }); start = dates[i]; end = dates[i]; }
    }
    groups.push({ start, end });
    const fmt = (g) => {
      const s = new Date(g.start + 'T12:00:00'), e = new Date(g.end + 'T12:00:00');
      if (g.start === g.end) return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (s.getMonth() === e.getMonth()) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}`;
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };
    return `${groups.map(fmt).join(', ')} (${dates.length} days)`;
  };
  
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      denied: 'Denied',
      cancelled: 'Cancelled',
      revoked: 'Revoked'
    };
    return labels[status] || status;
  };
  
  const pendingCount = myRequests.filter(r => r.status === 'pending').length;
  
  if (myRequests.length === 0) {
    return null; // Don't show section if no requests
  }
  
  return (
    <CollapsibleSection 
      title="My Time Off Requests"
      icon={Calendar}
      iconColor={THEME.accent.cyan}
      badge={pendingCount || undefined}
      badgeColor={THEME.status.warning}
      defaultOpen={false}
      notificationCount={notificationCount}
      onOpen={onOpen}
    >
      <div className="space-y-2">
        {sortedRequests.map(request => (
          <div key={request.requestId} className="p-2 rounded-lg" style={{ 
            backgroundColor: request.status === 'pending' ? THEME.status.warning + '10' : THEME.bg.tertiary, 
            border: `1px solid ${request.status === 'pending' ? THEME.status.warning + '30' : THEME.border.subtle}` 
          }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {/* Dates */}
                <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                  {formatRequestDates(request.datesRequested)}
                </p>
                
                {/* Submitted date */}
                <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>
                  Submitted {formatTimestamp(request.createdTimestamp)}
                </p>
                
                {/* My reason (always show if present) */}
                {request.reason && (
                  <div className="mt-1 p-1.5 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated }}>
                    <span style={{ color: THEME.text.muted }}>My reason: </span>
                    <span style={{ color: THEME.text.secondary }}>{request.reason}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-1">
                {/* Status badge */}
                <span 
                  className="text-xs font-medium px-1.5 py-0.5 rounded"
                  style={{ 
                    backgroundColor: REQUEST_STATUS_COLORS[request.status] + '20',
                    color: REQUEST_STATUS_COLORS[request.status]
                  }}
                >
                  {getStatusLabel(request.status)}
                </span>
                
                {/* Cancel button for pending requests */}
                {request.status === 'pending' && (
                  <button
                    onClick={() => onCancel(request.requestId)}
                    className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1 hover:opacity-80"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}
                  >
                    <X size={8} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MY TIME OFF PANEL - Admin's personal time off requests (shown below schedule)
// ═══════════════════════════════════════════════════════════════════════════════
const AdminMyTimeOffPanel = ({ requests, currentUserEmail, onCancel }) => {
  // Filter to show only this admin's requests
  const myRequests = requests.filter(r => r.email === currentUserEmail);
  
  // Sort: pending first, then by date (newest first)
  const sortedRequests = [...myRequests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
  });
  
  const formatRequestDates = (datesStr) => {
    const dates = datesStr.split(',').sort();
    if (dates.length === 1) {
      const d = new Date(dates[0] + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    const groups = [];
    let start = dates[0], end = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(end + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      if ((curr - prev) / 86400000 === 1) { end = dates[i]; }
      else { groups.push({ start, end }); start = dates[i]; end = dates[i]; }
    }
    groups.push({ start, end });
    const fmt = (g) => {
      const s = new Date(g.start + 'T12:00:00'), e = new Date(g.end + 'T12:00:00');
      if (g.start === g.end) return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (s.getMonth() === e.getMonth()) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}`;
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };
    return `${groups.map(fmt).join(', ')} (${dates.length} days)`;
  };
  
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      denied: 'Denied',
      cancelled: 'Cancelled',
      revoked: 'Revoked'
    };
    return labels[status] || status;
  };
  
  const pendingCount = myRequests.filter(r => r.status === 'pending').length;
  
  // Always show for admins, even if empty (so they know they can request time off)
  return (
    <CollapsibleSection 
      title="My Time Off Requests"
      icon={Calendar}
      iconColor={THEME.accent.cyan}
      badge={pendingCount || undefined}
      badgeColor={THEME.status.warning}
      defaultOpen={false}
    >
      {myRequests.length === 0 ? (
        <div className="text-center py-3">
          <Calendar size={20} style={{ color: THEME.text.muted, margin: '0 auto 8px' }} />
          <p className="text-xs" style={{ color: THEME.text.muted }}>No time off requests yet</p>
          <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>Use "Shift Changes" button to request time off</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRequests.map(request => (
            <div key={request.requestId} className="p-2 rounded-lg" style={{ 
              backgroundColor: request.status === 'pending' ? THEME.status.warning + '10' : THEME.bg.tertiary, 
              border: `1px solid ${request.status === 'pending' ? THEME.status.warning + '30' : THEME.border.subtle}` 
            }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Dates */}
                  <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                    {formatRequestDates(request.datesRequested)}
                  </p>
                  
                  {/* Submitted date */}
                  <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>
                    Submitted {formatTimestamp(request.createdTimestamp)}
                  </p>
                  
                  {/* Who approved/denied */}
                  {request.status !== 'pending' && request.decidedBy && (
                    <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>
                      {request.status === 'approved' ? 'Approved' : request.status === 'denied' ? 'Denied' : 'Decided'} by {request.decidedBy === currentUserEmail ? 'you' : request.decidedBy.split('@')[0]}
                    </p>
                  )}
                  
                  {/* Admin reason/note if present */}
                  {request.reason && request.status !== 'pending' && (
                    <div className="mt-1 p-1.5 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated }}>
                      <span style={{ color: THEME.text.muted }}>Note: </span>
                      <span style={{ color: THEME.text.secondary }}>{request.reason}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  {/* Status badge */}
                  <span 
                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                    style={{ 
                      backgroundColor: REQUEST_STATUS_COLORS[request.status] + '20',
                      color: REQUEST_STATUS_COLORS[request.status]
                    }}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                  
                  {/* Cancel button for pending requests */}
                  {request.status === 'pending' && (
                    <button
                      onClick={() => onCancel(request.requestId)}
                      className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1 hover:opacity-80"
                      style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}
                    >
                      <X size={8} />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SHIFT OFFERS PANEL - Admin view of all shift offer requests
// ═══════════════════════════════════════════════════════════════════════════════
const AdminShiftOffersPanel = ({ offers, onApprove, onReject, onRevoke, currentAdminEmail }) => {
  const [filter, setFilter] = useState('awaiting_admin');
  
  // Get today for date comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter offers based on selected filter
  const filteredOffers = offers.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'awaiting_admin') return o.status === 'awaiting_admin';
    if (filter === 'awaiting_recipient') return o.status === 'awaiting_recipient';
    if (filter === 'settled') return ['approved', 'rejected', 'cancelled', 'expired', 'recipient_rejected', 'revoked'].includes(o.status);
    return o.status === filter;
  });
  
  // Sort: awaiting_admin first (needs action), then approved (can revoke), then by date
  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (a.status === 'awaiting_admin' && b.status !== 'awaiting_admin') return -1;
    if (b.status === 'awaiting_admin' && a.status !== 'awaiting_admin') return 1;
    if (a.status === 'approved' && b.status !== 'approved') return -1;
    if (b.status === 'approved' && a.status !== 'approved') return 1;
    return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
  });
  
  const pendingAdminCount = offers.filter(o => o.status === 'awaiting_admin').length;
  const pendingRecipientCount = offers.filter(o => o.status === 'awaiting_recipient').length;
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.fullName : 'No Role';
  };
  
  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'awaiting_admin', label: 'Needs Approval', count: pendingAdminCount },
          { id: 'awaiting_recipient', label: 'Awaiting Reply', count: pendingRecipientCount },
          { id: 'settled', label: 'Settled' },
          { id: 'all', label: 'All' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            style={{
              backgroundColor: filter === f.id ? THEME.accent.pink + '20' : THEME.bg.tertiary,
              color: filter === f.id ? THEME.accent.pink : THEME.text.secondary,
              border: `1px solid ${filter === f.id ? THEME.accent.pink + '50' : THEME.border.subtle}`
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span className="px-1 rounded text-xs" style={{ backgroundColor: THEME.accent.pink, color: 'white' }}>{f.count}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* Offers list */}
      {sortedOffers.length === 0 ? (
        <div className="p-4 text-center rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
          <p className="text-xs" style={{ color: THEME.text.muted }}>No Take My Shift requests in this category</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedOffers.map(offer => {
            const shiftDate = new Date(offer.shiftDate + 'T12:00:00');
            const canApprove = offer.status === 'awaiting_admin';
            const canRevoke = offer.status === 'approved' && shiftDate >= today;
            
            return (
              <div key={offer.offerId} className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Offer summary */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: THEME.text.primary }}>{offer.offererName}</span>
                      <ArrowRight size={10} style={{ color: THEME.text.muted }} />
                      <span className="text-xs font-medium" style={{ color: THEME.text.primary }}>{offer.recipientName}</span>
                    </div>
                    
                    {/* Shift details */}
                    <div className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
                      {getDayNameShort(shiftDate)}, {formatDate(shiftDate)} • {formatTimeDisplay(offer.shiftStart)} – {formatTimeDisplay(offer.shiftEnd)} • {getRoleName(offer.shiftRole)}
                    </div>
                    
                    {/* Status and notes */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: OFFER_STATUS_COLORS[offer.status] + '20', color: OFFER_STATUS_COLORS[offer.status] }}>
                        {OFFER_STATUS_LABELS[offer.status]}
                      </span>
                      {offer.recipientNote && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>"{offer.recipientNote}"</span>
                      )}
                      {offer.status === 'revoked' && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>
                          Revoked {offer.revokedTimestamp ? new Date(offer.revokedTimestamp).toLocaleDateString() : ''}
                        </span>
                      )}
                    </div>
                    
                    {/* Timestamps */}
                    <div className="text-xs mt-1" style={{ color: THEME.text.muted }}>
                      Submitted {new Date(offer.createdTimestamp).toLocaleDateString()}
                      {offer.recipientRespondedTimestamp && ` • Accepted ${new Date(offer.recipientRespondedTimestamp).toLocaleDateString()}`}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {canApprove && (
                      <>
                        <button
                          onClick={() => onReject(offer.offerId)}
                          className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                          style={{ backgroundColor: THEME.status.error, color: 'white' }}
                        >
                          <X size={10} /> Reject
                        </button>
                        <button
                          onClick={() => onApprove(offer.offerId)}
                          className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                          style={{ backgroundColor: THEME.status.success, color: 'white' }}
                        >
                          <Check size={10} /> Approve
                        </button>
                      </>
                    )}
                    {canRevoke && onRevoke && (
                      <button
                        onClick={() => onRevoke(offer.offerId)}
                        className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                        style={{ backgroundColor: '#F97316', color: 'white' }}
                      >
                        <X size={10} /> Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MY SHIFT OFFERS PANEL - Employee view of shift offers they have sent
// ═══════════════════════════════════════════════════════════════════════════════
const MyShiftOffersPanel = ({ offers, currentUserEmail, onCancel }) => {
  // Filter to only offers from this user
  const myOffers = offers.filter(o => o.offererEmail === currentUserEmail);
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.fullName : 'No Role';
  };
  
  // Sort: pending first, then by date
  const sortedOffers = [...myOffers].sort((a, b) => {
    const aActive = ['awaiting_recipient', 'awaiting_admin'].includes(a.status);
    const bActive = ['awaiting_recipient', 'awaiting_admin'].includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
  });
  
  if (sortedOffers.length === 0) {
    return (
      <div className="text-center py-2">
        <p className="text-xs" style={{ color: THEME.text.muted }}>No Take My Shift requests sent</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {sortedOffers.map(offer => {
        const shiftDate = new Date(offer.shiftDate + 'T12:00:00');
        const canCancel = ['awaiting_recipient', 'awaiting_admin'].includes(offer.status);
        
        return (
          <div key={offer.offerId} className="p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                  Offered to {offer.recipientName}
                </div>
                <div className="text-xs" style={{ color: THEME.text.secondary }}>
                  {getDayNameShort(shiftDate)}, {formatDate(shiftDate)} • {formatTimeDisplay(offer.shiftStart)} – {formatTimeDisplay(offer.shiftEnd)}
                </div>
                {offer.recipientNote && (
                  <div className="text-xs italic mt-1" style={{ color: THEME.text.muted }}>Note: "{offer.recipientNote}"</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: OFFER_STATUS_COLORS[offer.status] + '20', color: OFFER_STATUS_COLORS[offer.status] }}>
                  {OFFER_STATUS_LABELS[offer.status]}
                </span>
                {canCancel && (
                  <button
                    onClick={() => onCancel(offer.offerId)}
                    className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}
                  >
                    <X size={8} /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INCOMING OFFERS PANEL - Offers sent TO this employee (need response)
// ═══════════════════════════════════════════════════════════════════════════════
const IncomingOffersPanel = ({ offers, currentUserEmail, onAccept, onReject }) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  
  // Filter to only offers TO this user that need response
  const incomingOffers = offers.filter(o => o.recipientEmail === currentUserEmail && o.status === 'awaiting_recipient');
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.fullName : 'No Role';
  };
  
  const handleRejectClick = (offer) => {
    setSelectedOffer(offer);
    setRejectNote('');
    setRejectModalOpen(true);
  };
  
  const handleConfirmReject = () => {
    if (selectedOffer) {
      onReject(selectedOffer.offerId, rejectNote);
    }
    setRejectModalOpen(false);
    setSelectedOffer(null);
  };
  
  if (incomingOffers.length === 0) {
    return null; // Don't show section if no incoming offers
  }
  
  return (
    <>
      <CollapsibleSection 
        title={`Incoming Take My Shift (${incomingOffers.length})`}
        icon={ArrowRight}
        iconColor={THEME.accent.pink}
        badge={incomingOffers.length}
        badgeColor={THEME.status.warning}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {incomingOffers.map(offer => {
            const shiftDate = new Date(offer.shiftDate + 'T12:00:00');
            
            return (
              <div key={offer.offerId} className="p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                      {offer.offererName} wants you to take their shift
                    </div>
                    <div className="text-xs" style={{ color: THEME.text.secondary }}>
                      {getDayNameShort(shiftDate)}, {formatDate(shiftDate)} • {formatTimeDisplay(offer.shiftStart)} – {formatTimeDisplay(offer.shiftEnd)} • {getRoleName(offer.shiftRole)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleRejectClick(offer)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onAccept(offer.offerId)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
      
      {/* Reject Note Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => setRejectModalOpen(false)}>
          <div className="max-w-sm w-full rounded-xl overflow-hidden" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, backgroundColor: THEME.bg.tertiary }}>
              <h3 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>Decline Take My Shift Request</h3>
            </div>
            <div className="p-4">
              <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>Add a note (optional):</p>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="e.g., Sorry, I have another commitment that day"
                className="w-full px-3 py-2 rounded-lg text-xs resize-none"
                style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                rows={2}
              />
            </div>
            <div className="px-4 py-3 flex justify-end gap-2" style={{ borderTop: `1px solid ${THEME.border.subtle}`, backgroundColor: THEME.bg.tertiary }}>
              <button onClick={() => setRejectModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>
                Cancel
              </button>
              <button onClick={handleConfirmReject} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.status.error, color: 'white' }}>
                Decline Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECEIVED OFFERS HISTORY - Shows offers user received that are beyond initial response
// ═══════════════════════════════════════════════════════════════════════════════
const ReceivedOffersHistoryPanel = ({ offers, currentUserEmail, notificationCount, onOpen }) => {
  // Offers where user is recipient and NOT awaiting their response (already responded or resolved)
  const historyOffers = offers.filter(o => 
    o.recipientEmail === currentUserEmail && 
    o.status !== 'awaiting_recipient'
  );
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.fullName : 'No Role';
  };
  
  // Sort: active first (awaiting_admin), then by date
  const sortedOffers = [...historyOffers].sort((a, b) => {
    if (a.status === 'awaiting_admin' && b.status !== 'awaiting_admin') return -1;
    if (b.status === 'awaiting_admin' && a.status !== 'awaiting_admin') return 1;
    return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
  });
  
  if (sortedOffers.length === 0) {
    return null;
  }
  
  const activeCount = sortedOffers.filter(o => o.status === 'awaiting_admin').length;
  
  return (
    <CollapsibleSection 
      title="Take My Shift History (Received)"
      icon={ArrowRight}
      iconColor={THEME.accent.pink}
      badge={activeCount || undefined}
      badgeColor={THEME.status.warning}
      defaultOpen={false}
      notificationCount={notificationCount}
      onOpen={onOpen}
    >
      <div className="space-y-2">
        {sortedOffers.map(offer => {
          const shiftDate = new Date(offer.shiftDate + 'T12:00:00');
          const isActive = offer.status === 'awaiting_admin';
          
          return (
            <div key={offer.offerId} className="p-2 rounded-lg" style={{ 
              backgroundColor: isActive ? THEME.status.warning + '10' : THEME.bg.tertiary, 
              border: `1px solid ${isActive ? THEME.status.warning + '30' : THEME.border.subtle}` 
            }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                    From {offer.offererName}
                  </div>
                  <div className="text-xs" style={{ color: THEME.text.secondary }}>
                    {getDayNameShort(shiftDate)}, {formatDate(shiftDate)} • {formatTimeDisplay(offer.shiftStart)} – {formatTimeDisplay(offer.shiftEnd)}
                  </div>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                  backgroundColor: OFFER_STATUS_COLORS[offer.status] + '20', 
                  color: OFFER_STATUS_COLORS[offer.status] 
                }}>
                  {OFFER_STATUS_LABELS[offer.status]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INCOMING SWAPS PANEL - Swap requests sent TO this employee (need response)
// ═══════════════════════════════════════════════════════════════════════════════
const IncomingSwapsPanel = ({ swaps, currentUserEmail, onAccept, onReject }) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  
  // Filter to only swaps TO this user that need response
  const incomingSwaps = swaps.filter(s => s.partnerEmail === currentUserEmail && s.status === 'awaiting_partner');
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.name : '—';
  };
  
  const getRoleColor = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.color : THEME.text.muted;
  };
  
  const handleRejectClick = (swap) => {
    setSelectedSwap(swap);
    setRejectNote('');
    setRejectModalOpen(true);
  };
  
  const handleConfirmReject = () => {
    if (selectedSwap) {
      onReject(selectedSwap.swapId, rejectNote);
    }
    setRejectModalOpen(false);
    setSelectedSwap(null);
  };
  
  if (incomingSwaps.length === 0) {
    return null;
  }
  
  return (
    <>
      <CollapsibleSection 
        title={`Incoming Swap Requests (${incomingSwaps.length})`}
        icon={ArrowRightLeft}
        iconColor={THEME.accent.purple}
        badge={incomingSwaps.length}
        badgeColor={THEME.status.warning}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {incomingSwaps.map(swap => {
            const theirShiftDate = new Date(swap.initiatorShiftDate + 'T12:00:00');
            const myShiftDate = new Date(swap.partnerShiftDate + 'T12:00:00');
            
            return (
              <div key={swap.swapId} className="p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1" style={{ color: THEME.text.primary }}>
                      {swap.initiatorName} wants to swap shifts with you
                    </div>
                    <div className="text-xs mb-1 p-1.5 rounded" style={{ backgroundColor: THEME.accent.purple + '10' }}>
                      <span style={{ color: THEME.text.muted }}>They give: </span>
                      <span style={{ color: THEME.text.primary }}>{getDayNameShort(theirShiftDate)}, {formatDate(theirShiftDate)} • {formatTimeDisplay(swap.initiatorShiftStart)} – {formatTimeDisplay(swap.initiatorShiftEnd)}</span>
                      <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.initiatorShiftRole) + '30', color: getRoleColor(swap.initiatorShiftRole) }}>
                        {getRoleName(swap.initiatorShiftRole)}
                      </span>
                    </div>
                    <div className="text-xs p-1.5 rounded" style={{ backgroundColor: THEME.accent.cyan + '10' }}>
                      <span style={{ color: THEME.text.muted }}>You give: </span>
                      <span style={{ color: THEME.text.primary }}>{getDayNameShort(myShiftDate)}, {formatDate(myShiftDate)} • {formatTimeDisplay(swap.partnerShiftStart)} – {formatTimeDisplay(swap.partnerShiftEnd)}</span>
                      <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.partnerShiftRole) + '30', color: getRoleColor(swap.partnerShiftRole) }}>
                        {getRoleName(swap.partnerShiftRole)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleRejectClick(swap)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onAccept(swap.swapId)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
      
      {/* Reject Note Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => setRejectModalOpen(false)}>
          <div className="max-w-sm w-full rounded-xl overflow-hidden" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, backgroundColor: THEME.bg.tertiary }}>
              <h3 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>Decline Swap Request</h3>
            </div>
            <div className="p-4">
              <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>Add a note (optional):</p>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="e.g., Sorry, that shift doesn't work for me"
                className="w-full px-3 py-2 rounded-lg text-xs resize-none"
                style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                rows={2}
              />
            </div>
            <div className="px-4 py-3 flex justify-end gap-2" style={{ borderTop: `1px solid ${THEME.border.subtle}`, backgroundColor: THEME.bg.tertiary }}>
              <button onClick={() => setRejectModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>
                Cancel
              </button>
              <button onClick={handleConfirmReject} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.status.error, color: 'white' }}>
                Decline Swap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MY SWAPS PANEL - Employee view of swap requests they have initiated
// ═══════════════════════════════════════════════════════════════════════════════
const MySwapsPanel = ({ swaps, currentUserEmail, onCancel }) => {
  const mySwaps = swaps.filter(s => s.initiatorEmail === currentUserEmail);
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.name : '—';
  };
  
  const getRoleColor = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.color : THEME.text.muted;
  };
  
  // Sort: pending first, then by date
  const sortedSwaps = [...mySwaps].sort((a, b) => {
    const aActive = ['awaiting_partner', 'awaiting_admin'].includes(a.status);
    const bActive = ['awaiting_partner', 'awaiting_admin'].includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
  });
  
  if (sortedSwaps.length === 0) {
    return (
      <div className="text-center py-2">
        <p className="text-xs" style={{ color: THEME.text.muted }}>No swap requests sent</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {sortedSwaps.map(swap => {
        const myShiftDate = new Date(swap.initiatorShiftDate + 'T12:00:00');
        const theirShiftDate = new Date(swap.partnerShiftDate + 'T12:00:00');
        const canCancel = ['awaiting_partner', 'awaiting_admin'].includes(swap.status);
        
        return (
          <div key={swap.swapId} className="p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                  Swap with {swap.partnerName}
                </div>
                <div className="text-xs space-y-0.5">
                  <div style={{ color: THEME.text.secondary }}>
                    <span style={{ color: THEME.text.muted }}>You: </span>
                    {getDayNameShort(myShiftDate)}, {formatDate(myShiftDate)}
                    <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.initiatorShiftRole) + '20', color: getRoleColor(swap.initiatorShiftRole) }}>
                      {getRoleName(swap.initiatorShiftRole)}
                    </span>
                  </div>
                  <div style={{ color: THEME.text.secondary }}>
                    <span style={{ color: THEME.text.muted }}>Them: </span>
                    {getDayNameShort(theirShiftDate)}, {formatDate(theirShiftDate)}
                    <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.partnerShiftRole) + '20', color: getRoleColor(swap.partnerShiftRole) }}>
                      {getRoleName(swap.partnerShiftRole)}
                    </span>
                  </div>
                </div>
                {swap.partnerNote && (
                  <div className="text-xs italic mt-1" style={{ color: THEME.text.muted }}>Note: "{swap.partnerNote}"</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: SWAP_STATUS_COLORS[swap.status] + '20', color: SWAP_STATUS_COLORS[swap.status] }}>
                  {SWAP_STATUS_LABELS[swap.status]}
                </span>
                {canCancel && (
                  <button
                    onClick={() => onCancel(swap.swapId)}
                    className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}
                  >
                    <X size={8} /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECEIVED SWAPS HISTORY PANEL - Shows swaps user received that are beyond initial response
// ═══════════════════════════════════════════════════════════════════════════════
const ReceivedSwapsHistoryPanel = ({ swaps, currentUserEmail, notificationCount, onOpen }) => {
  // Swaps where user is partner and NOT awaiting their response
  const historySwaps = swaps.filter(s => 
    s.partnerEmail === currentUserEmail && 
    s.status !== 'awaiting_partner'
  );
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.name : '—';
  };
  
  const getRoleColor = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.color : THEME.text.muted;
  };
  
  // Sort: active first (awaiting_admin), then by date
  const sortedSwaps = [...historySwaps].sort((a, b) => {
    if (a.status === 'awaiting_admin' && b.status !== 'awaiting_admin') return -1;
    if (b.status === 'awaiting_admin' && a.status !== 'awaiting_admin') return 1;
    return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
  });
  
  if (sortedSwaps.length === 0) {
    return null;
  }
  
  const activeCount = sortedSwaps.filter(s => s.status === 'awaiting_admin').length;
  
  return (
    <CollapsibleSection 
      title="Swap History (Received)"
      icon={ArrowRightLeft}
      iconColor={THEME.accent.purple}
      badge={activeCount || undefined}
      badgeColor={THEME.status.warning}
      defaultOpen={false}
      notificationCount={notificationCount}
      onOpen={onOpen}
    >
      <div className="space-y-2">
        {sortedSwaps.map(swap => {
          const theirShiftDate = new Date(swap.initiatorShiftDate + 'T12:00:00');
          const myShiftDate = new Date(swap.partnerShiftDate + 'T12:00:00');
          const isActive = swap.status === 'awaiting_admin';
          
          return (
            <div key={swap.swapId} className="p-2 rounded-lg" style={{ 
              backgroundColor: isActive ? THEME.status.warning + '10' : THEME.bg.tertiary, 
              border: `1px solid ${isActive ? THEME.status.warning + '30' : THEME.border.subtle}` 
            }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                    From {swap.initiatorName}
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div style={{ color: THEME.text.secondary }}>
                      <span style={{ color: THEME.text.muted }}>Their: </span>
                      {getDayNameShort(theirShiftDate)}, {formatDate(theirShiftDate)}
                      <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.initiatorShiftRole) + '20', color: getRoleColor(swap.initiatorShiftRole) }}>
                        {getRoleName(swap.initiatorShiftRole)}
                      </span>
                    </div>
                    <div style={{ color: THEME.text.secondary }}>
                      <span style={{ color: THEME.text.muted }}>Your: </span>
                      {getDayNameShort(myShiftDate)}, {formatDate(myShiftDate)}
                      <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.partnerShiftRole) + '20', color: getRoleColor(swap.partnerShiftRole) }}>
                        {getRoleName(swap.partnerShiftRole)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                  backgroundColor: SWAP_STATUS_COLORS[swap.status] + '20', 
                  color: SWAP_STATUS_COLORS[swap.status] 
                }}>
                  {SWAP_STATUS_LABELS[swap.status]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SHIFT SWAPS PANEL - Admin view of all swap requests
// ═══════════════════════════════════════════════════════════════════════════════
const AdminShiftSwapsPanel = ({ swaps, onApprove, onReject, onRevoke, currentAdminEmail }) => {
  const [filter, setFilter] = useState('awaiting_admin');
  
  // Get today for date comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter swaps based on selected filter
  const filteredSwaps = swaps.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'awaiting_admin') return s.status === 'awaiting_admin';
    if (filter === 'awaiting_partner') return s.status === 'awaiting_partner';
    if (filter === 'settled') return ['approved', 'rejected', 'cancelled', 'expired', 'partner_rejected', 'revoked'].includes(s.status);
    return s.status === filter;
  });
  
  // Sort: awaiting_admin first, then approved (can revoke), then by date
  const sortedSwaps = [...filteredSwaps].sort((a, b) => {
    if (a.status === 'awaiting_admin' && b.status !== 'awaiting_admin') return -1;
    if (b.status === 'awaiting_admin' && a.status !== 'awaiting_admin') return 1;
    if (a.status === 'approved' && b.status !== 'approved') return -1;
    if (b.status === 'approved' && a.status !== 'approved') return 1;
    return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
  });
  
  const pendingAdminCount = swaps.filter(s => s.status === 'awaiting_admin').length;
  const pendingPartnerCount = swaps.filter(s => s.status === 'awaiting_partner').length;
  
  const getRoleName = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.name : '—';
  };
  
  const getRoleColor = (roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    return role ? role.color : THEME.text.muted;
  };
  
  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'awaiting_admin', label: 'Needs Approval', count: pendingAdminCount },
          { id: 'awaiting_partner', label: 'Awaiting Reply', count: pendingPartnerCount },
          { id: 'settled', label: 'Settled' },
          { id: 'all', label: 'All' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-2 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1"
            style={{
              backgroundColor: filter === f.id ? THEME.accent.purple : THEME.bg.tertiary,
              color: filter === f.id ? 'white' : THEME.text.muted
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: THEME.status.warning, color: '#000' }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Swaps list */}
      {sortedSwaps.length === 0 ? (
        <div className="text-center py-4">
          <ArrowRightLeft size={24} style={{ color: THEME.text.muted, margin: '0 auto 8px' }} />
          <p className="text-xs" style={{ color: THEME.text.muted }}>
            {filter === 'awaiting_admin' ? 'No swaps awaiting approval' : 'No swap requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSwaps.map(swap => {
            const initiatorShiftDate = new Date(swap.initiatorShiftDate + 'T12:00:00');
            const partnerShiftDate = new Date(swap.partnerShiftDate + 'T12:00:00');
            const canApprove = swap.status === 'awaiting_admin';
            
            // Check if BOTH shifts are in the future for revoke eligibility
            const bothFuture = initiatorShiftDate >= today && partnerShiftDate >= today;
            const canRevoke = swap.status === 'approved' && bothFuture;
            
            return (
              <div key={swap.swapId} className="p-3 rounded-lg" style={{ 
                backgroundColor: canApprove ? THEME.status.warning + '10' : THEME.bg.tertiary,
                border: `1px solid ${canApprove ? THEME.status.warning + '30' : THEME.border.subtle}`
              }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Initiator and Partner names */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: THEME.text.primary }}>{swap.initiatorName}</span>
                      <ArrowRightLeft size={10} style={{ color: THEME.text.muted }} />
                      <span className="text-xs font-medium" style={{ color: THEME.text.primary }}>{swap.partnerName}</span>
                    </div>
                    
                    {/* Shift details with roles */}
                    <div className="text-xs mb-2 space-y-1">
                      <div style={{ color: THEME.text.secondary }}>
                        <span style={{ color: THEME.text.muted }}>{swap.initiatorName}'s shift: </span>
                        {getDayNameShort(initiatorShiftDate)}, {formatDate(initiatorShiftDate)} • {formatTimeDisplay(swap.initiatorShiftStart)} – {formatTimeDisplay(swap.initiatorShiftEnd)}
                        <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.initiatorShiftRole) + '30', color: getRoleColor(swap.initiatorShiftRole) }}>
                          {getRoleName(swap.initiatorShiftRole)}
                        </span>
                      </div>
                      <div style={{ color: THEME.text.secondary }}>
                        <span style={{ color: THEME.text.muted }}>{swap.partnerName}'s shift: </span>
                        {getDayNameShort(partnerShiftDate)}, {formatDate(partnerShiftDate)} • {formatTimeDisplay(swap.partnerShiftStart)} – {formatTimeDisplay(swap.partnerShiftEnd)}
                        <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.partnerShiftRole) + '30', color: getRoleColor(swap.partnerShiftRole) }}>
                          {getRoleName(swap.partnerShiftRole)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status and notes */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: SWAP_STATUS_COLORS[swap.status] + '20', color: SWAP_STATUS_COLORS[swap.status] }}>
                        {SWAP_STATUS_LABELS[swap.status]}
                      </span>
                      {swap.partnerNote && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>"{swap.partnerNote}"</span>
                      )}
                      {swap.status === 'revoked' && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>
                          Revoked {swap.revokedTimestamp ? new Date(swap.revokedTimestamp).toLocaleDateString() : ''}
                        </span>
                      )}
                    </div>
                    
                    {/* Timestamps */}
                    <div className="text-xs mt-1" style={{ color: THEME.text.muted }}>
                      Submitted {new Date(swap.createdTimestamp).toLocaleDateString()}
                      {swap.partnerRespondedTimestamp && ` • Accepted ${new Date(swap.partnerRespondedTimestamp).toLocaleDateString()}`}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {canApprove && (
                      <>
                        <button
                          onClick={() => onReject(swap.swapId)}
                          className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                          style={{ backgroundColor: THEME.status.error, color: 'white' }}
                        >
                          <X size={10} /> Reject
                        </button>
                        <button
                          onClick={() => onApprove(swap.swapId)}
                          className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                          style={{ backgroundColor: THEME.status.success, color: 'white' }}
                        >
                          <Check size={10} /> Approve
                        </button>
                      </>
                    )}
                    {canRevoke && onRevoke && (
                      <button
                        onClick={() => onRevoke(swap.swapId)}
                        className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                        style={{ backgroundColor: '#F97316', color: 'white' }}
                      >
                        <X size={10} /> Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE VIEW - Read-only full schedule, shows only own tasks
// ═══════════════════════════════════════════════════════════════════════════════
const EmployeeScheduleCell = ({ shift, date, loggedInEmpId, storeHours, isTimeOff = false, isUnavailable = false }) => {
  const [showTask, setShowTask] = useState(false);
  const starRef = useRef(null);
  const role = shift ? ROLES.find(r => r.id === shift.role) : null;
  const isHoliday = isStatHoliday(date);
  const isOwnShift = shift?.employeeId === loggedInEmpId;
  const showTaskStar = shift?.task && isOwnShift;
  
  return (
    <>
      <div className="h-14 rounded-lg relative overflow-hidden"
        style={{ 
          backgroundColor: isTimeOff ? THEME.text.muted + '15' : isUnavailable && !shift ? THEME.bg.primary : (shift ? role?.color + '25' : THEME.bg.tertiary), 
          border: `1px solid ${isTimeOff ? THEME.text.muted + '30' : isUnavailable && !shift ? THEME.border.subtle : (shift ? role?.color + '50' : THEME.border.default)}`,
          opacity: isTimeOff ? 0.7 : isUnavailable && !shift ? 0.5 : 1
        }}>
        
        {isHoliday && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: THEME.status.warning }} />}
        
        {isTimeOff && !shift ? (
          <div className="p-1.5 h-full flex flex-col items-center justify-center">
            <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>Time Off</span>
          </div>
        ) : isUnavailable && !shift ? (
          <div className="p-1.5 h-full flex flex-col items-center justify-center">
            <span className="text-xs" style={{ color: THEME.text.muted, fontSize: '9px' }}>Unavailable</span>
          </div>
        ) : shift ? (
          <div className="p-1.5 h-full flex flex-col justify-between relative">
            {showTaskStar && (
              <div ref={starRef} className="absolute top-1 right-1 cursor-pointer" onMouseEnter={() => setShowTask(true)} onMouseLeave={() => setShowTask(false)}>
                <Star size={10} fill={THEME.task} color={THEME.task} />
              </div>
            )}
            <span className="text-xs font-semibold truncate pr-3" style={{ color: role?.color }}>{role?.name}</span>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
              <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>{shift.hours}h</span>
            </div>
          </div>
        ) : null}
      </div>
      {showTaskStar && <TaskStarTooltip task={shift?.task} show={showTask} triggerRef={starRef} />}
    </>
  );
};

const EmployeeViewRow = ({ employee, dates, shifts, loggedInEmpId, getEmployeeHours, timeOffRequests = [] }) => {
  const hours = getEmployeeHours(employee.id);
  const isMe = employee.id === loggedInEmpId;
  
  // Check if employee has approved time off for a specific date
  const hasApprovedTimeOff = (dateStr) => {
    return timeOffRequests.some(req => 
      req.email === employee.email && 
      req.status === 'approved' &&
      req.datesRequested.split(',').includes(dateStr)
    );
  };

  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: '140px repeat(7, 1fr)', backgroundColor: THEME.border.subtle }}>
      <div className="p-1.5" style={{ backgroundColor: isMe ? THEME.accent.purple + '15' : THEME.bg.secondary }}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: isMe ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated, color: isMe ? 'white' : THEME.text.muted }}>{employee.name.split(' ').map(n => n[0]).join('')}</div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-xs truncate flex items-center gap-1" style={{ color: isMe ? THEME.accent.purple : THEME.text.primary }}>
              {employee.name}
              {isMe && <span className="text-xs" style={{ color: THEME.accent.cyan }}>(You)</span>}
            </p>
            <p className="text-xs font-semibold" style={{ color: hours >= 40 ? THEME.status.error : hours >= 35 ? THEME.status.warning : THEME.accent.cyan }}>{hours.toFixed(1)}h</p>
          </div>
        </div>
      </div>
      
      {dates.map((date, i) => {
        const storeHrs = getStoreHoursForDate(date);
        const dateStr = date.toISOString().split('T')[0];
        const shift = shifts[`${employee.id}-${dateStr}`];
        const isTimeOff = hasApprovedTimeOff(dateStr);
        const dayName = getDayName(date);
        const avail = employee.availability?.[dayName];
        const isUnavailable = avail && !avail.available;
        return (
          <div key={i} className="p-0.5" style={{ backgroundColor: isMe ? THEME.accent.purple + '10' : THEME.bg.secondary }}>
            <EmployeeScheduleCell shift={shift ? { ...shift, employeeId: employee.id } : null} date={date} loggedInEmpId={loggedInEmpId} storeHours={storeHrs} isTimeOff={isTimeOff} isUnavailable={isUnavailable} />
          </div>
        );
      })}
    </div>
  );
};

const EmployeeView = ({ employees, shifts, dates, periodInfo, currentUser, onLogout, timeOffRequests, onCancelRequest, onSubmitRequest, shiftOffers, onSubmitOffer, onCancelOffer, onAcceptOffer, onRejectOffer, shiftSwaps, onSubmitSwap, onCancelSwap, onAcceptSwap, onRejectSwap, periodIndex = 0, onPeriodChange, isEditMode = false, announcement }) => {
  const [activeWeek, setActiveWeek] = useState(1);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [daysOffModalOpen, setDaysOffModalOpen] = useState(false);
  const [offerShiftModalOpen, setOfferShiftModalOpen] = useState(false);
  const [swapShiftModalOpen, setSwapShiftModalOpen] = useState(false);
  
  // Mobile-specific state
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAnnouncementOpen, setMobileAnnouncementOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState('week1'); // 'week1' | 'week2' | 'my-schedule'
  
  // Change password modal
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  // Track which resolved requests the user has seen (to show notifications)
  // Initialize with ALL currently resolved items so only NEW resolutions during session show notifications
  const [seenRequestIds, setSeenRequestIds] = useState(() => {
    const initialSeen = new Set();
    
    // Mark all currently resolved time-off requests as seen
    timeOffRequests
      .filter(r => r.email === currentUser.email && ['approved', 'denied', 'revoked'].includes(r.status))
      .forEach(r => initialSeen.add(r.requestId));
    
    // Mark all currently resolved offers (as offerer) as seen
    shiftOffers
      .filter(o => o.offererEmail === currentUser.email && ['approved', 'rejected'].includes(o.status))
      .forEach(o => initialSeen.add(o.offerId));
    
    // Mark all currently resolved offers (as recipient) as seen
    shiftOffers
      .filter(o => o.recipientEmail === currentUser.email && ['approved', 'rejected'].includes(o.status))
      .forEach(o => initialSeen.add(`recv-${o.offerId}`));
    
    // Mark all currently resolved swaps (as initiator) as seen
    shiftSwaps
      .filter(s => s.initiatorEmail === currentUser.email && ['approved', 'rejected'].includes(s.status))
      .forEach(s => initialSeen.add(s.swapId));
    
    // Mark all currently resolved swaps (as partner) as seen  
    shiftSwaps
      .filter(s => s.partnerEmail === currentUser.email && ['approved', 'rejected'].includes(s.status))
      .forEach(s => initialSeen.add(`recv-${s.swapId}`));
    
    return initialSeen;
  });
  
  // Helper to mark requests as seen
  const markAsSeen = (ids) => {
    if (ids.length === 0) return;
    setSeenRequestIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.add(id));
      return newSet;
    });
  };
  
  // Calculate unseen resolved requests for notifications
  // Only items resolved AFTER page load will show as unseen (notifications)
  const myTimeOffRequests = timeOffRequests.filter(r => r.email === currentUser.email);
  const unseenTimeOffIds = myTimeOffRequests
    .filter(r => ['approved', 'denied', 'revoked'].includes(r.status) && !seenRequestIds.has(r.requestId))
    .map(r => r.requestId);
  
  // Shift Offers (as offerer): approved/rejected by admin
  const myOffers = shiftOffers.filter(o => o.offererEmail === currentUser.email);
  const unseenOfferIds = myOffers
    .filter(o => ['approved', 'rejected'].includes(o.status) && !seenRequestIds.has(o.offerId))
    .map(o => o.offerId);
  
  // Shift Offers (as recipient): approved/rejected by admin on offers I accepted
  const offersIAccepted = shiftOffers.filter(o => o.recipientEmail === currentUser.email && ['approved', 'rejected'].includes(o.status));
  const unseenReceivedOfferIds = offersIAccepted
    .filter(o => !seenRequestIds.has(`recv-${o.offerId}`))
    .map(o => `recv-${o.offerId}`);
  
  // Shift Swaps (as initiator): approved/rejected by admin  
  const mySwaps = shiftSwaps.filter(s => s.initiatorEmail === currentUser.email);
  const unseenSwapIds = mySwaps
    .filter(s => ['approved', 'rejected'].includes(s.status) && !seenRequestIds.has(s.swapId))
    .map(s => s.swapId);
  
  // Shift Swaps (as partner): approved/rejected by admin on swaps I accepted
  const swapsIAccepted = shiftSwaps.filter(s => s.partnerEmail === currentUser.email && ['approved', 'rejected'].includes(s.status));
  const unseenReceivedSwapIds = swapsIAccepted
    .filter(s => !seenRequestIds.has(`recv-${s.swapId}`))
    .map(s => `recv-${s.swapId}`);
  
  const week1 = dates.slice(0, 7), week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]), weekNum2 = getWeekNumber(week2[0]);
  const currentDates = activeWeek === 1 ? week1 : week2;
  
  // Schedulable employees (exclude owner, exclude admins unless showOnSchedule)
  const schedulableEmployees = [...employees]
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule)
    .sort((a, b) => {
      // Sarvi always first
      const aIsSarvi = a.name.toLowerCase() === 'sarvi';
      const bIsSarvi = b.name.toLowerCase() === 'sarvi';
      if (aIsSarvi && !bIsSarvi) return -1;
      if (bIsSarvi && !aIsSarvi) return 1;
      
      // Full-time before part-time
      const aFT = a.employmentType === 'full-time';
      const bFT = b.employmentType === 'full-time';
      if (aFT && !bFT) return -1;
      if (bFT && !aFT) return 1;
      
      // Alphabetical within same type
      return a.name.localeCompare(b.name);
    });
  
  // Admin contacts for display
  const adminContacts = employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted);
  
  const getEmpHours = (id) => { 
    let t = 0; 
    currentDates.forEach(d => { 
      const s = shifts[`${id}-${d.toISOString().split('T')[0]}`]; 
      if (s) t += s.hours || 0; 
    }); 
    return t; 
  };
  
  // Period total for summary stats
  const getPeriodHours = (id) => {
    let t = 0;
    dates.forEach(d => { const s = shifts[`${id}-${d.toISOString().split('T')[0]}`]; if (s) t += s.hours || 0; });
    return t;
  };
  
  const myTotalHours = getPeriodHours(currentUser.id);
  const myShiftsCount = dates.filter(d => shifts[`${currentUser.id}-${d.toISOString().split('T')[0]}`]).length;
  
  const handleSelectRequestType = (type) => {
    setRequestModalOpen(false);
    if (type === 'days-off') {
      setDaysOffModalOpen(true);
    } else if (type === 'shift-offer') {
      setOfferShiftModalOpen(true);
    } else if (type === 'shift-swap') {
      setSwapShiftModalOpen(true);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    const hasAnnouncement = !isEditMode && announcement?.message;
    const mobileWeek1 = dates.slice(0, 7), mobileWeek2 = dates.slice(7, 14);
    const mobileWeekNum1 = getWeekNumber(mobileWeek1[0]), mobileWeekNum2 = getWeekNumber(mobileWeek2[0]);
    
    // Total notification count for hamburger badge
    const totalNotifications = unseenTimeOffIds.length + unseenOfferIds.length + unseenReceivedOfferIds.length + unseenSwapIds.length + unseenReceivedSwapIds.length;
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
        <GradientBackground />
        
        {/* Mobile Header - Sticky */}
        <header className="sticky top-0" style={{ backgroundColor: THEME.bg.secondary, borderBottom: 'none', zIndex: 100 }}>
          {/* Row 1: Hamburger + centered RAINBOW logo + Bell */}
          <div className="flex items-center px-3 pt-3 pb-2" style={{ position: 'relative' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg relative flex-shrink-0"
              style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.primary, zIndex: 1 }}
            >
              <Menu size={18} />
              {totalNotifications > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: THEME.status.error, fontSize: '9px', color: 'white', fontWeight: 700 }}>
                  {totalNotifications > 9 ? '9+' : totalNotifications}
                </div>
              )}
            </button>
            <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: "'Josefin Sans', sans-serif" }}>
              <p style={{ color: THEME.text.muted, fontSize: '8px', letterSpacing: '0.2em' }}>OVER THE</p>
              <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '16px', letterSpacing: '0.12em', lineHeight: 1 }}>RAINBOW</p>
            </div>
            <div className="ml-auto" style={{ zIndex: 1 }}>
              <button
                onClick={() => hasAnnouncement && setMobileAnnouncementOpen(true)}
                className="p-1.5 rounded-lg flex-shrink-0"
                style={{
                  backgroundColor: hasAnnouncement ? THEME.accent.blue + '20' : THEME.bg.tertiary,
                  color: hasAnnouncement ? THEME.accent.blue : THEME.text.muted,
                  border: hasAnnouncement ? `1px solid ${THEME.accent.blue}40` : 'none'
                }}
              >
                <Bell size={18} fill={hasAnnouncement ? THEME.accent.blue : 'none'} />
              </button>
            </div>
          </div>

          {/* Row 2: Period nav centered, bigger */}
          <div className="flex items-center justify-center px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPeriodChange && onPeriodChange(periodIndex - 1)}
                className="p-1 rounded"
                style={{ color: THEME.text.secondary }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '13px' }}>
                  {formatDate(periodInfo.startDate)} – {formatDate(periodInfo.endDate)}
                </p>
                {periodIndex === 0 && <p className="font-medium" style={{ color: THEME.accent.cyan, fontSize: '10px', marginTop: 1 }}>Current Period</p>}
                {periodIndex > 0 && <p className="font-medium" style={{ color: THEME.accent.purple, fontSize: '10px', marginTop: 1 }}>Future</p>}
                {periodIndex < 0 && <p className="font-medium" style={{ color: THEME.text.muted, fontSize: '10px', marginTop: 1 }}>Past</p>}
              </div>
              <button
                onClick={() => onPeriodChange && onPeriodChange(periodIndex + 1)}
                className="p-1 rounded"
                style={{ color: THEME.text.secondary }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Row 3: Status banner */}
          <div className="px-3 pb-2">
            {isEditMode ? (
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
                <Loader size={12} className="animate-pulse" style={{ color: THEME.status.warning }} />
                <span className="text-xs font-medium" style={{ color: THEME.status.warning }}>Schedule pending — not yet published</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.success + '15', border: `1px solid ${THEME.status.success}30` }}>
                <Eye size={12} style={{ color: THEME.status.success }} />
                <span className="text-xs font-medium" style={{ color: THEME.status.success }}>Schedule is LIVE</span>
              </div>
            )}
          </div>

          {/* Row 4: Raised Filing Tabs */}
          <div className="flex items-end px-3" style={{ marginBottom: -1 }}>
            {[
              { id: 'week1', label: `Wk ${mobileWeekNum1}` },
              { id: 'week2', label: `Wk ${mobileWeekNum2}` },
              { id: 'my-schedule', label: 'Mine' }
            ].map(tab => {
              const isActive = mobileActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMobileActiveTab(tab.id)}
                  className="px-4 py-2 text-xs relative"
                  style={{
                    backgroundColor: isActive ? THEME.bg.primary : THEME.bg.tertiary,
                    color: isActive ? THEME.accent.purple : THEME.text.muted,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    borderTop: `2px solid ${isActive ? THEME.accent.purple : 'transparent'}`,
                    borderLeft: `1px solid ${isActive ? THEME.border.default : 'transparent'}`,
                    borderRight: `1px solid ${isActive ? THEME.border.default : 'transparent'}`,
                    borderBottom: isActive ? 'none' : `1px solid ${THEME.border.default}`,
                    marginRight: -1,
                    zIndex: isActive ? 10 : 1,
                    fontWeight: isActive ? 700 : 500,
                    boxShadow: isActive ? `0 -2px 8px ${THEME.accent.purple}15` : 'none',
                    fontSize: isActive ? '12px' : '11px'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
            {/* Fill rest of bottom border */}
            <div className="flex-1" style={{ borderBottom: `1px solid ${THEME.border.default}` }} />
          </div>
        </header>

        {/* Main Content */}
        <main className="p-2">
          
          {/* Week 1 / Week 2 Grid */}
          {(mobileActiveTab === 'week1' || mobileActiveTab === 'week2') && (
            <MobileScheduleGrid
              employees={schedulableEmployees}
              shifts={shifts}
              dates={mobileActiveTab === 'week1' ? mobileWeek1 : mobileWeek2}
              loggedInUser={currentUser}
              getEmployeeHours={mobileActiveTab === 'week1' ? getEmpHours : (id) => {
                let t = 0;
                mobileWeek2.forEach(d => { const s = shifts[`${id}-${d.toISOString().split('T')[0]}`]; if (s) t += s.hours || 0; });
                return t;
              }}
              timeOffRequests={timeOffRequests}
            />
          )}
          
          {/* My Schedule Tab */}
          {mobileActiveTab === 'my-schedule' && (
            <MobileMySchedule
              currentUser={currentUser}
              shifts={shifts}
              dates={dates}
              timeOffRequests={timeOffRequests}
            />
          )}
          
          {/* Role Legend - compact for mobile */}
          {(mobileActiveTab === 'week1' || mobileActiveTab === 'week2') && (
            <div className="mt-2 p-2 rounded-lg flex items-center gap-1.5 flex-wrap" style={{ backgroundColor: THEME.bg.secondary }}>
              {ROLES.filter(r => r.id !== 'none').map(r => (
                <div key={r.id} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded" style={{ backgroundColor: r.color }} />
                  <span style={{ color: THEME.text.secondary, fontSize: '9px' }}>{r.name}</span>
                </div>
              ))}
            </div>
          )}
        </main>
        
        {/* Mobile Hamburger Drawer */}
        <MobileMenuDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentUser={currentUser}
          onLogout={onLogout}
          onOpenShiftChanges={() => setRequestModalOpen(true)}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
          adminContacts={adminContacts}
        >
          {/* Incoming offers needing response */}
          <IncomingOffersPanel 
            offers={shiftOffers}
            currentUserEmail={currentUser.email}
            onAccept={onAcceptOffer}
            onReject={onRejectOffer}
          />
          
          {/* Incoming swaps needing response */}
          <IncomingSwapsPanel 
            swaps={shiftSwaps}
            currentUserEmail={currentUser.email}
            onAccept={onAcceptSwap}
            onReject={onRejectSwap}
          />
          
          {/* My Time Off Requests */}
          <MyRequestsPanel 
            requests={timeOffRequests} 
            currentUserEmail={currentUser.email} 
            onCancel={onCancelRequest}
            notificationCount={unseenTimeOffIds.length}
            onOpen={() => markAsSeen(unseenTimeOffIds)}
          />
          
          {/* Received offers history */}
          <ReceivedOffersHistoryPanel 
            offers={shiftOffers}
            currentUserEmail={currentUser.email}
            notificationCount={unseenReceivedOfferIds.length}
            onOpen={() => markAsSeen(unseenReceivedOfferIds)}
          />
          
          {/* Received swaps history */}
          <ReceivedSwapsHistoryPanel 
            swaps={shiftSwaps}
            currentUserEmail={currentUser.email}
            notificationCount={unseenReceivedSwapIds.length}
            onOpen={() => markAsSeen(unseenReceivedSwapIds)}
          />
          
          {/* My shift offers */}
          {shiftOffers.some(o => o.offererEmail === currentUser.email) && (
            <CollapsibleSection 
              title="My Take My Shift Requests"
              icon={ArrowRight}
              iconColor={THEME.accent.pink}
              badge={shiftOffers.filter(o => o.offererEmail === currentUser.email && ['awaiting_recipient', 'awaiting_admin'].includes(o.status)).length || undefined}
              badgeColor={THEME.status.warning}
              defaultOpen={false}
              notificationCount={unseenOfferIds.length}
              onOpen={() => markAsSeen(unseenOfferIds)}
            >
              <MyShiftOffersPanel 
                offers={shiftOffers}
                currentUserEmail={currentUser.email}
                onCancel={onCancelOffer}
              />
            </CollapsibleSection>
          )}
          
          {/* My swap requests */}
          {shiftSwaps.some(s => s.initiatorEmail === currentUser.email) && (
            <CollapsibleSection 
              title="My Swap Requests"
              icon={ArrowRightLeft}
              iconColor={THEME.accent.purple}
              badge={shiftSwaps.filter(s => s.initiatorEmail === currentUser.email && ['awaiting_partner', 'awaiting_admin'].includes(s.status)).length || undefined}
              badgeColor={THEME.status.warning}
              defaultOpen={false}
              notificationCount={unseenSwapIds.length}
              onOpen={() => markAsSeen(unseenSwapIds)}
            >
              <MySwapsPanel 
                swaps={shiftSwaps}
                currentUserEmail={currentUser.email}
                onCancel={onCancelSwap}
              />
            </CollapsibleSection>
          )}
        </MobileMenuDrawer>
        
        {/* Mobile Announcement Popup */}
        <MobileAnnouncementPopup
          isOpen={mobileAnnouncementOpen}
          onClose={() => setMobileAnnouncementOpen(false)}
          announcement={announcement}
        />
        
        {/* Request Modals (shared with desktop) */}
        <RequestTimeOffModal 
          isOpen={requestModalOpen} 
          onClose={() => setRequestModalOpen(false)} 
          onSelectType={handleSelectRequestType}
          currentUser={currentUser}
        />
        <RequestDaysOffModal 
          isOpen={daysOffModalOpen} 
          onClose={() => setDaysOffModalOpen(false)} 
          onSubmit={onSubmitRequest}
          currentUser={currentUser}
          timeOffRequests={timeOffRequests}
          shiftOffers={shiftOffers}
          shiftSwaps={shiftSwaps}
          shifts={shifts}
        />
        <OfferShiftModal
          isOpen={offerShiftModalOpen}
          onClose={() => setOfferShiftModalOpen(false)}
          onSubmit={onSubmitOffer}
          currentUser={currentUser}
          employees={employees}
          shifts={shifts}
          shiftOffers={shiftOffers}
          timeOffRequests={timeOffRequests}
          shiftSwaps={shiftSwaps}
        />
        <SwapShiftModal
          isOpen={swapShiftModalOpen}
          onClose={() => setSwapShiftModalOpen(false)}
          onSubmit={onSubmitSwap}
          currentUser={currentUser}
          employees={employees}
          shifts={shifts}
          shiftSwaps={shiftSwaps}
          timeOffRequests={timeOffRequests}
          shiftOffers={shiftOffers}
        />
        <ChangePasswordModal
          isOpen={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          currentUser={currentUser}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESKTOP RENDER (unchanged)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
      <GradientBackground />
      
      {/* Header */}
      <header className="px-4 py-2 sticky top-0" style={{ backgroundColor: THEME.bg.secondary, borderBottom: `1px solid ${THEME.border.subtle}`, zIndex: 100 }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            
            {/* Period Navigation */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onPeriodChange && onPeriodChange(periodIndex - 1)}
                className="p-1 rounded hover:bg-white/10"
                style={{ color: THEME.text.secondary }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-center min-w-[140px]">
                <p className="font-medium text-xs" style={{ color: THEME.text.primary }}>{formatDate(periodInfo.startDate)} – {formatDate(periodInfo.endDate)}</p>
                {periodIndex === 0 && <p className="text-xs" style={{ color: THEME.accent.cyan }}>Current Period</p>}
                {periodIndex > 0 && <p className="text-xs" style={{ color: THEME.accent.purple }}>Future Period</p>}
                {periodIndex < 0 && <p className="text-xs" style={{ color: THEME.text.muted }}>Past Period</p>}
              </div>
              <button 
                onClick={() => onPeriodChange && onPeriodChange(periodIndex + 1)}
                className="p-1 rounded hover:bg-white/10"
                style={{ color: THEME.text.secondary }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            {/* Schedule Status Indicator */}
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            <div 
              className="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: isEditMode ? THEME.status.warning + '15' : THEME.status.success + '15',
                color: isEditMode ? THEME.status.warning : THEME.status.success,
                border: `1px solid ${isEditMode ? THEME.status.warning + '30' : THEME.status.success + '30'}`
              }}
              title={isEditMode ? 'Admin is updating the schedule - changes pending' : 'You are viewing the published schedule'}
            >
              {isEditMode ? (
                <>
                  <Loader size={10} className="animate-pulse" />
                  <span>Updates Pending</span>
                </>
              ) : (
                <>
                  <Eye size={10} />
                  <span>LIVE</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Shift Changes button */}
            <button
              onClick={() => setRequestModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
            >
              <Calendar size={12} />
              Shift Changes
            </button>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>{currentUser.name}</p>
              <p className="text-xs" style={{ color: THEME.accent.cyan }}>{myShiftsCount} shifts • {myTotalHours.toFixed(1)}h</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: '#fff' }}>
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <button onClick={() => setChangePasswordOpen(true)} className="p-1.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }} title="Change Password">
              <Key size={14} />
            </button>
            <button onClick={onLogout} className="p-1.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="p-3 pt-2">
        <div className="max-w-[1400px] mx-auto">
          {/* Week tabs */}
          <div className="flex items-end">
            {[{ w: 1, n: weekNum1, d: week1 }, { w: 2, n: weekNum2, d: week2 }].map(({ w, n, d }) => (
              <button key={w} onClick={() => setActiveWeek(w)} className="px-3 py-1.5 font-medium text-xs relative transition-all"
                style={{ backgroundColor: activeWeek === w ? THEME.bg.secondary : THEME.bg.tertiary, color: activeWeek === w ? THEME.text.primary : THEME.text.muted, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginRight: -1, zIndex: activeWeek === w ? 10 : 1, borderTop: `2px solid ${activeWeek === w ? THEME.accent.purple : 'transparent'}`, borderLeft: `1px solid ${THEME.border.default}`, borderRight: `1px solid ${THEME.border.default}`, marginBottom: activeWeek === w ? -1 : 0 }}>
                <span className="font-semibold">Week {n}</span><span className="ml-1.5 opacity-60">{formatDate(d[0])}–{formatDate(d[6])}</span>
              </button>
            ))}
          </div>
          
          {/* Schedule grid */}
          {isEditMode && (
            <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
              <Loader size={12} className="animate-pulse" style={{ color: THEME.status.warning }} />
              <p className="text-xs" style={{ color: THEME.status.warning }}>Shift assignments for this period haven't been published yet. Availability and time off are shown below.</p>
            </div>
          )}
          <div className="rounded-b-xl rounded-tr-xl overflow-visible relative" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderTop: 'none', zIndex: 1 }}>
            <div className="grid gap-px" style={{ gridTemplateColumns: '140px repeat(7, 1fr)', backgroundColor: THEME.border.subtle }}>
              <div className="p-1.5" style={{ backgroundColor: THEME.bg.tertiary }}><span className="font-semibold text-xs" style={{ color: THEME.text.primary }}>Employee</span></div>
              {currentDates.map((date, i) => {
                const sh = getStoreHoursForDate(date);
                const today = date.toDateString() === new Date().toDateString();
                const hol = isStatHoliday(date);
                return (
                  <div key={i} className="p-1 text-center" style={{ backgroundColor: today ? THEME.accent.purple + '20' : hol ? THEME.status.warning + '15' : THEME.bg.tertiary, borderBottom: today ? `2px solid ${THEME.accent.purple}` : hol ? `2px solid ${THEME.status.warning}` : 'none' }}>
                    <p className="font-semibold text-xs" style={{ color: today ? THEME.accent.purple : hol ? THEME.status.warning : THEME.text.primary }}>{getDayName(date).slice(0, 3)}</p>
                    <p className="text-sm font-bold" style={{ color: THEME.text.primary }}>{date.getDate()}</p>
                    <p className="text-xs" style={{ color: THEME.text.muted }}>{formatTimeShort(sh.open)}-{formatTimeShort(sh.close)}</p>
                  </div>
                );
              })}
            </div>
            <div>{schedulableEmployees.map((e, i) => {
              const isFirstPT = i > 0 && e.employmentType !== 'full-time' && e.name.toLowerCase() !== 'sarvi' && 
                (schedulableEmployees[i-1].employmentType === 'full-time' || schedulableEmployees[i-1].name.toLowerCase() === 'sarvi');
              return (
                <React.Fragment key={e.id}>
                  {isFirstPT && <div style={{ height: 1, margin: '3px 8px', backgroundColor: THEME.border.default }} />}
                  <EmployeeViewRow employee={e} dates={currentDates} shifts={shifts} loggedInEmpId={currentUser.id} getEmployeeHours={getEmpHours} timeOffRequests={timeOffRequests} />
                </React.Fragment>
              );
            })}</div>
          </div>
          
          {/* Legend */}
          <div className="mt-2 p-1.5 rounded-lg flex items-center gap-2 flex-wrap text-xs" style={{ backgroundColor: THEME.bg.secondary, zIndex: 1 }}>
            <span style={{ color: THEME.text.muted }}>Roles:</span>
            {ROLES.filter(r => r.id !== 'none').map(r => (
              <div key={r.id} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: r.color }} />
                <span style={{ color: THEME.text.secondary }}>{r.name}</span>
              </div>
            ))}
            <span className="ml-2" style={{ color: THEME.text.muted }}>|</span>
            <div className="flex items-center gap-1"><Star size={10} fill={THEME.task} color={THEME.task} /><span style={{ color: THEME.task }}>Your Task</span></div>
          </div>
          
          {/* Period Announcement - Only show when period is LIVE and has content */}
          {!isEditMode && announcement?.message && (
            <div className="mt-3 p-4 rounded-xl" style={{ 
              backgroundColor: THEME.accent.blue + '10', 
              border: `1px solid ${THEME.accent.blue}40`
            }}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: THEME.accent.blue + '20' }}>
                  <Bell size={20} style={{ color: THEME.accent.blue }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: THEME.accent.blue }}>
                    📢 {announcement.subject || 'Announcement'}
                  </h3>
                  <div className="text-sm whitespace-pre-wrap" style={{ color: THEME.text.primary, lineHeight: 1.6 }}>
                    {announcement.message}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* My Schedule Summary */}
          <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: THEME.text.primary }}>Your Schedule This Period</h3>
            <div className="space-y-1">
              {dates.map((date, i) => {
                const shift = shifts[`${currentUser.id}-${date.toISOString().split('T')[0]}`];
                if (!shift) return null;
                const role = ROLES.find(r => r.id === shift.role);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, borderLeft: `3px solid ${role?.color}` }}>
                    <div className="w-16">
                      <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>{dayName} {date.getDate()}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: role?.color }}>{role?.name}</span>
                      <span className="text-xs" style={{ color: THEME.text.muted }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
                      <span className="text-xs" style={{ color: THEME.accent.cyan }}>{shift.hours}h</span>
                    </div>
                    {shift.task && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: THEME.task + '20' }}>
                        <Star size={10} fill={THEME.task} color={THEME.task} />
                        <span className="text-xs" style={{ color: THEME.task }}>{shift.task}</span>
                      </div>
                    )}
                  </div>
                );
              }).filter(Boolean)}
              {dates.filter(d => shifts[`${currentUser.id}-${d.toISOString().split('T')[0]}`]).length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: THEME.text.muted }}>No shifts scheduled this period</p>
              )}
            </div>
          </div>
          
          {/* Admin Contacts */}
          {adminContacts.length > 0 && (
            <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: THEME.text.muted }}>CONTACT ADMIN</p>
              <div className="space-y-1">
                {adminContacts.map(admin => (
                  <div key={admin.id} className="flex items-center gap-2 text-sm">
                    <Shield size={12} style={{ color: THEME.accent.purple }} />
                    <span style={{ color: THEME.text.primary }}>{admin.name}:</span>
                    <a href={`mailto:${admin.email}`} style={{ color: THEME.accent.cyan }}>{admin.email}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Incoming Take My Shift Requests - needs response */}
          <div className="mt-3">
            <IncomingOffersPanel 
              offers={shiftOffers}
              currentUserEmail={currentUser.email}
              onAccept={onAcceptOffer}
              onReject={onRejectOffer}
            />
          </div>
          
          {/* Incoming Swap Requests - needs response */}
          <div className="mt-3">
            <IncomingSwapsPanel 
              swaps={shiftSwaps}
              currentUserEmail={currentUser.email}
              onAccept={onAcceptSwap}
              onReject={onRejectSwap}
            />
          </div>
          
          {/* Offers I've received (history - after I responded) */}
          <div className="mt-3">
            <ReceivedOffersHistoryPanel 
              offers={shiftOffers}
              currentUserEmail={currentUser.email}
              notificationCount={unseenReceivedOfferIds.length}
              onOpen={() => markAsSeen(unseenReceivedOfferIds)}
            />
          </div>
          
          {/* Swaps I've received (history - after I responded) */}
          <div className="mt-3">
            <ReceivedSwapsHistoryPanel 
              swaps={shiftSwaps}
              currentUserEmail={currentUser.email}
              notificationCount={unseenReceivedSwapIds.length}
              onOpen={() => markAsSeen(unseenReceivedSwapIds)}
            />
          </div>
          
          {/* My Time Off Requests */}
          <div className="mt-3">
            <MyRequestsPanel 
              requests={timeOffRequests} 
              currentUserEmail={currentUser.email} 
              onCancel={onCancelRequest}
              notificationCount={unseenTimeOffIds.length}
              onOpen={() => markAsSeen(unseenTimeOffIds)}
            />
          </div>
          
          {/* My Take My Shift Requests */}
          {shiftOffers.some(o => o.offererEmail === currentUser.email) && (
            <div className="mt-3">
              <CollapsibleSection 
                title="My Take My Shift Requests"
                icon={ArrowRight}
                iconColor={THEME.accent.pink}
                badge={shiftOffers.filter(o => o.offererEmail === currentUser.email && ['awaiting_recipient', 'awaiting_admin'].includes(o.status)).length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={false}
                notificationCount={unseenOfferIds.length}
                onOpen={() => markAsSeen(unseenOfferIds)}
              >
                <MyShiftOffersPanel 
                  offers={shiftOffers}
                  currentUserEmail={currentUser.email}
                  onCancel={onCancelOffer}
                />
              </CollapsibleSection>
            </div>
          )}
          
          {/* My Swap Requests */}
          {shiftSwaps.some(s => s.initiatorEmail === currentUser.email) && (
            <div className="mt-3">
              <CollapsibleSection 
                title="My Swap Requests"
                icon={ArrowRightLeft}
                iconColor={THEME.accent.purple}
                badge={shiftSwaps.filter(s => s.initiatorEmail === currentUser.email && ['awaiting_partner', 'awaiting_admin'].includes(s.status)).length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={false}
                notificationCount={unseenSwapIds.length}
                onOpen={() => markAsSeen(unseenSwapIds)}
              >
                <MySwapsPanel 
                  swaps={shiftSwaps}
                  currentUserEmail={currentUser.email}
                  onCancel={onCancelSwap}
                />
              </CollapsibleSection>
            </div>
          )}
        </div>
      </main>
      
      {/* Request Modals */}
      <RequestTimeOffModal 
        isOpen={requestModalOpen} 
        onClose={() => setRequestModalOpen(false)} 
        onSelectType={handleSelectRequestType}
        currentUser={currentUser}
      />
      <RequestDaysOffModal 
        isOpen={daysOffModalOpen} 
        onClose={() => setDaysOffModalOpen(false)} 
        onSubmit={onSubmitRequest}
        currentUser={currentUser}
        timeOffRequests={timeOffRequests}
        shiftOffers={shiftOffers}
        shiftSwaps={shiftSwaps}
        shifts={shifts}
      />
      <OfferShiftModal
        isOpen={offerShiftModalOpen}
        onClose={() => setOfferShiftModalOpen(false)}
        onSubmit={onSubmitOffer}
        currentUser={currentUser}
        employees={employees}
        shifts={shifts}
        shiftOffers={shiftOffers}
        timeOffRequests={timeOffRequests}
        shiftSwaps={shiftSwaps}
      />
      <SwapShiftModal
        isOpen={swapShiftModalOpen}
        onClose={() => setSwapShiftModalOpen(false)}
        onSubmit={onSubmitSwap}
        currentUser={currentUser}
        employees={employees}
        shifts={shifts}
        shiftSwaps={shiftSwaps}
        timeOffRequests={timeOffRequests}
        shiftOffers={shiftOffers}
      />
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNICATIONS PANEL - Announcement editor (saved per pay period)
// ═══════════════════════════════════════════════════════════════════════════════
const CommunicationsPanel = ({ employees, shifts, dates, periodInfo, adminContacts, announcement, onAnnouncementChange, onSave, onClear, isEditMode, isSaving }) => {
  const weekNum1 = getWeekNumber(dates[0]);
  const weekNum2 = getWeekNumber(dates[7]);
  
  // Track if local changes differ from saved version
  const [localAnnouncement, setLocalAnnouncement] = useState(announcement);
  const hasUnsavedChanges = localAnnouncement.subject !== announcement.subject || localAnnouncement.message !== announcement.message;
  
  // Sync local state when announcement prop changes (e.g., after save or period change)
  useEffect(() => {
    setLocalAnnouncement(announcement);
  }, [announcement.subject, announcement.message]);
  
  // Get employees with shifts this period
  const scheduledCount = useMemo(() => {
    return employees
      .filter(e => e.active && !e.deleted && !e.isOwner)
      .filter(e => !e.isAdmin || e.showOnSchedule)
      .filter(emp => dates.some(d => shifts[`${emp.id}-${d.toISOString().split('T')[0]}`]))
      .length;
  }, [employees, shifts, dates]);
  
  const handleLocalChange = (newAnn) => {
    setLocalAnnouncement(newAnn);
  };
  
  const handleSave = () => {
    console.log('CommunicationsPanel handleSave called with:', localAnnouncement);
    onAnnouncementChange(localAnnouncement); // Update parent state
    onSave(localAnnouncement); // Save to backend (or delete if empty)
  };
  
  // Clear button: only clears the UI fields (like clearing a form)
  // Actual deletion happens when you Save with empty fields
  const handleClear = () => {
    console.log('CommunicationsPanel handleClear - clearing UI only');
    setLocalAnnouncement({ subject: '', message: '' });
    // Don't call onClear - that deletes from backend
    // User needs to click Save to persist the deletion
  };
  
  const handleDiscard = () => {
    setLocalAnnouncement(announcement); // Revert to saved version
  };
  
  // Locked state when period is LIVE
  const isLocked = !isEditMode;
  
  // Check if there's content to save or clear
  const hasContent = localAnnouncement.subject || localAnnouncement.message;
  const savedHasContent = announcement.subject || announcement.message;
  
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: THEME.text.primary }}>
            <MessageSquare size={20} style={{ color: THEME.accent.cyan }} />
            Period Announcement
          </h2>
          <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>
            Week {weekNum1} & {weekNum2} • {scheduledCount} staff scheduled
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status indicators */}
          {isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.status.error + '20' }}>
              <Eye size={12} style={{ color: THEME.status.error }} />
              <span className="text-xs" style={{ color: THEME.status.error }}>LIVE</span>
            </div>
          )}
          {!isLocked && hasUnsavedChanges && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.status.warning + '20' }}>
              <AlertCircle size={12} style={{ color: THEME.status.warning }} />
              <span className="text-xs" style={{ color: THEME.status.warning }}>Unsaved</span>
            </div>
          )}
          {!isLocked && !hasUnsavedChanges && savedHasContent && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.status.success + '20' }}>
              <Check size={12} style={{ color: THEME.status.success }} />
              <span className="text-xs" style={{ color: THEME.status.success }}>Saved</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Info about where announcement appears */}
      <div className="mb-4 p-2 rounded-lg text-xs" style={{ backgroundColor: THEME.accent.blue + '10', border: `1px solid ${THEME.accent.blue}30` }}>
        <p style={{ color: THEME.accent.blue }}>
          💡 Appears in <strong>PDF</strong>, <strong>emails</strong>, and <strong>employee dashboard</strong> when period is LIVE.
        </p>
      </div>
      
      {/* Locked notice - smaller inline version */}
      {isLocked && (
        <p className="text-xs mb-3" style={{ color: THEME.text.muted }}>
          📌 Period is LIVE. Switch to Edit Mode to modify.
        </p>
      )}
      
      {/* Subject line */}
      <div className="mb-3">
        <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Announcement Title</label>
        <input
          type="text"
          value={localAnnouncement.subject}
          onChange={e => handleLocalChange({ ...localAnnouncement, subject: e.target.value })}
          placeholder="e.g. Staff Meeting This Friday"
          className="w-full px-3 py-2 rounded-lg outline-none text-sm"
          style={{ 
            backgroundColor: isLocked ? THEME.bg.tertiary : THEME.bg.elevated, 
            border: `1px solid ${THEME.border.default}`, 
            color: THEME.text.primary,
            opacity: isLocked ? 0.6 : 1,
            cursor: isLocked ? 'not-allowed' : 'text'
          }}
          disabled={isLocked}
        />
      </div>
      
      {/* Message body */}
      <div className="mb-3">
        <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Message</label>
        <textarea
          value={localAnnouncement.message}
          onChange={e => handleLocalChange({ ...localAnnouncement, message: e.target.value })}
          placeholder="Hi team! Just a quick note about..."
          rows={5}
          className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-none"
          style={{ 
            backgroundColor: isLocked ? THEME.bg.tertiary : THEME.bg.elevated, 
            border: `1px solid ${THEME.border.default}`, 
            color: THEME.text.primary,
            opacity: isLocked ? 0.6 : 1,
            cursor: isLocked ? 'not-allowed' : 'text'
          }}
          disabled={isLocked}
        />
        <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>
          {localAnnouncement.message.length} characters
        </p>
      </div>
      
      {/* Actions */}
      {!isLocked && (
        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
          <div className="flex items-center gap-2">
            {/* Clear button - clears the form fields */}
            <button 
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}
              disabled={!hasContent}
            >
              Clear
            </button>
            {/* Discard button - reverts local changes to last saved */}
            {hasUnsavedChanges && (
              <button 
                onClick={handleDiscard}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: THEME.bg.tertiary, color: THEME.status.warning }}
              >
                Discard
              </button>
            )}
          </div>
          
          {/* Save button */}
          <button 
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            style={{ 
              backgroundColor: hasUnsavedChanges ? THEME.accent.blue : THEME.bg.tertiary, 
              color: hasUnsavedChanges ? 'white' : THEME.text.muted,
              opacity: isSaving ? 0.6 : 1
            }}
          >
            {isSaving ? (
              <>
                <Loader size={12} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={12} />
                Save
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SETTINGS MODAL - Change password (API connected)
// ═══════════════════════════════════════════════════════════════════════════════
const AdminSettingsModal = ({ isOpen, onClose, currentUser, staffingTargets, onStaffingTargetsChange, showToast }) => {
  const [activeTab, setActiveTab] = useState('targets'); // 'targets' | 'password'
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Staffing targets state
  const [editTargets, setEditTargets] = useState({});
  const [targetsSaving, setTargetsSaving] = useState(false);
  const [targetsChanged, setTargetsChanged] = useState(false);
  
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const DAY_LABELS = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
  
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setEditTargets({ ...staffingTargets });
      setTargetsChanged(false);
    }
  }, [isOpen, staffingTargets]);
  
  const handleTargetChange = (day, value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    const updated = { ...editTargets, [day]: num };
    setEditTargets(updated);
    setTargetsChanged(JSON.stringify(updated) !== JSON.stringify(staffingTargets));
  };
  
  const handleSaveTargets = async () => {
    setTargetsSaving(true);
    const result = await apiCall('saveStaffingTargets', {
      callerEmail: currentUser.email,
      staffingTargets: editTargets
    });
    setTargetsSaving(false);
    
    if (result.success) {
      onStaffingTargetsChange(editTargets);
      setTargetsChanged(false);
      showToast('success', 'Staffing targets updated');
    } else {
      showToast('error', result.error?.message || 'Failed to save targets');
    }
  };
  
  const handleSavePassword = async () => {
    if (!currentPassword) { setError('Please enter your current password.'); return; }
    if (!newPassword) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    
    setLoading(true);
    const result = await apiCall('changePassword', {
      callerEmail: currentUser.email,
      currentPassword,
      newPassword
    });
    setLoading(false);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => { setActiveTab('targets'); setSuccess(false); }, 1500);
    } else {
      setError(result.error?.message || 'Failed to change password');
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admin Settings" size="sm">
      {/* Tab bar */}
      <div className="flex gap-1 mb-3 p-0.5 rounded-lg" style={{ backgroundColor: THEME.bg.primary }}>
        {[
          { id: 'targets', label: 'Staffing Targets', icon: <Users size={12} /> },
          { id: 'password', label: 'Password', icon: <Key size={12} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? THEME.bg.elevated : 'transparent',
              color: activeTab === tab.id ? THEME.text.primary : THEME.text.muted
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      
      {/* Staffing Targets tab */}
      {activeTab === 'targets' && (
        <div>
          <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
            Set the target number of staff for each day. These appear as counters on the schedule grid.
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map(day => (
              <div key={day} className="text-center">
                <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>{DAY_LABELS[day]}</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={editTargets[day] || 0}
                  onChange={e => handleTargetChange(day, e.target.value)}
                  className="w-full px-1 py-1.5 rounded-lg outline-none text-center text-sm font-medium"
                  style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            <GradientButton variant="secondary" small onClick={onClose}>Close</GradientButton>
            <GradientButton small onClick={handleSaveTargets} disabled={!targetsChanged || targetsSaving}>
              {targetsSaving ? <><Loader size={10} className="animate-spin" /> Saving...</> : <><Save size={10} /> Save Targets</>}
            </GradientButton>
          </div>
        </div>
      )}
      
      {/* Password tab */}
      {activeTab === 'password' && (
        <>
          {success ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.success + '20' }}>
                <Check size={20} style={{ color: THEME.status.success }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>Password Updated!</h3>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={e => { setCurrentPassword(e.target.value); setError(''); }}
                    placeholder="Enter current password"
                    className="w-full px-2 py-1.5 rounded-lg outline-none text-xs"
                    style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>New Password</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="Enter new password"
                    className="w-full px-2 py-1.5 rounded-lg outline-none text-xs"
                    style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Confirm new password"
                    className="w-full px-2 py-1.5 rounded-lg outline-none text-xs"
                    style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                  />
                </div>
              </div>
              
              {error && <p className="text-xs mt-2" style={{ color: THEME.status.error }}>{error}</p>}
              
              <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
                <GradientButton variant="secondary" small onClick={onClose} disabled={loading}>Cancel</GradientButton>
                <GradientButton small onClick={handleSavePassword} disabled={loading}>
                  {loading ? <><Loader size={10} className="animate-spin" /> Updating...</> : <><Key size={10} />Update Password</>}
                </GradientButton>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD MODAL - Reusable for employees and admins
// Self-service: requires current password. First-login: no current password needed.
// ═══════════════════════════════════════════════════════════════════════════════
const ChangePasswordModal = ({ isOpen, onClose, currentUser, isFirstLogin = false, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);
  
  const handleSubmit = async () => {
    if (!isFirstLogin && !currentPassword) { setError('Please enter your current password.'); return; }
    if (!newPassword) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    
    setLoading(true);
    setError('');
    
    const payload = {
      callerEmail: currentUser.email,
      newPassword
    };
    // Self-service path: include currentPassword so backend verifies it
    if (!isFirstLogin) {
      payload.currentPassword = currentPassword;
    } else {
      // First-login: current password is the default (employee ID), send it for backend verification
      payload.currentPassword = currentUser.id;
    }
    
    const result = await apiCall('changePassword', payload);
    setLoading(false);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } else {
      setError(result.error?.message || 'Failed to change password');
    }
  };
  
  // First-login mode: not dismissible via close button or backdrop
  const handleClose = isFirstLogin ? undefined : onClose;
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose || (() => {})} title={isFirstLogin ? 'Set Your Password' : 'Change Password'} size="sm">
      {/* Block backdrop close for first-login by intercepting */}
      {isFirstLogin && (
        <style>{`.fixed.inset-0.z-\\[100\\] { pointer-events: auto; }`}</style>
      )}
      
      {success ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.success + '20' }}>
            <Check size={20} style={{ color: THEME.status.success }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>Password Updated!</h3>
          {isFirstLogin && <p className="text-xs mt-1" style={{ color: THEME.text.secondary }}>Logging you in...</p>}
        </div>
      ) : (
        <>
          {isFirstLogin && (
            <div className="mb-3 p-2.5 rounded-lg" style={{ backgroundColor: THEME.accent.blue + '15', border: `1px solid ${THEME.accent.blue}30` }}>
              <p className="text-xs" style={{ color: THEME.accent.blue }}>
                Welcome! For security, please set a personal password before continuing. Your current password is a temporary default.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            {!isFirstLogin && (
              <div>
                <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e => { setCurrentPassword(e.target.value); setError(''); }}
                  placeholder="Enter current password"
                  className="w-full px-2 py-1.5 rounded-lg outline-none text-xs"
                  style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>New Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                placeholder="Enter new password (min 4 characters)"
                className="w-full px-2 py-1.5 rounded-lg outline-none text-xs"
                style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Confirm new password"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full px-2 py-1.5 rounded-lg outline-none text-xs"
                style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
              />
            </div>
          </div>
          
          {error && <p className="text-xs mt-2" style={{ color: THEME.status.error }}>{error}</p>}
          
          <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            {!isFirstLogin && (
              <GradientButton variant="secondary" small onClick={onClose} disabled={loading}>Cancel</GradientButton>
            )}
            <GradientButton small onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader size={10} className="animate-spin" /> Updating...</> : <><Key size={10} /> {isFirstLogin ? 'Set Password' : 'Update Password'}</>}
            </GradientButton>
          </div>
        </>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN HEADER EDITOR - Click to edit store hours and staffing target per date
// ═══════════════════════════════════════════════════════════════════════════════
const ColumnHeaderEditor = ({ date, storeHours, target, storeHoursOverrides, staffingTargetOverrides, onSave, onClose }) => {
  const dateStr = date.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const isPast = dateStr < today;
  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  
  const hasHoursOverride = !!storeHoursOverrides[dateStr];
  const hasTargetOverride = staffingTargetOverrides[dateStr] !== undefined;
  
  const [openTime, setOpenTime] = useState(storeHours.open);
  const [closeTime, setCloseTime] = useState(storeHours.close);
  const [editTarget, setEditTarget] = useState(target);
  const [saving, setSaving] = useState(false);
  
  const hoursChanged = openTime !== storeHours.open || closeTime !== storeHours.close;
  const targetChanged = editTarget !== target;
  const hasChanges = hoursChanged || targetChanged;
  
  const handleSave = async () => {
    setSaving(true);
    await onSave(dateStr, { open: openTime, close: closeTime }, editTarget);
    setSaving(false);
    onClose();
  };
  
  const handleReset = async () => {
    setSaving(true);
    await onSave(dateStr, null, null); // null = remove override
    setSaving(false);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-start justify-center pt-24" style={{ zIndex: 100000 }} onClick={onClose}>
      <div 
        className="rounded-xl shadow-2xl p-3 w-64" 
        style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.bright}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold" style={{ color: THEME.text.primary }}>{dayLabel}</h3>
          <button onClick={onClose} className="p-0.5 rounded hover:opacity-70"><X size={14} style={{ color: THEME.text.muted }} /></button>
        </div>
        
        {isPast ? (
          <p className="text-xs py-2" style={{ color: THEME.text.muted }}>Past dates cannot be edited.</p>
        ) : (
          <>
            {/* Store Hours */}
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
                Store Hours
                {hasHoursOverride && <span className="ml-1 px-1 rounded" style={{ backgroundColor: THEME.accent.cyan + '20', color: THEME.accent.cyan, fontSize: '9px' }}>OVERRIDE</span>}
              </label>
              <div className="flex items-center gap-1.5">
                <input 
                  type="time" value={openTime} onChange={e => setOpenTime(e.target.value)}
                  className="flex-1 px-1.5 py-1 rounded-lg outline-none text-xs"
                  style={{ backgroundColor: THEME.bg.primary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
                <span className="text-xs" style={{ color: THEME.text.muted }}>to</span>
                <input 
                  type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)}
                  className="flex-1 px-1.5 py-1 rounded-lg outline-none text-xs"
                  style={{ backgroundColor: THEME.bg.primary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
              </div>
            </div>
            
            {/* Staffing Target */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
                Staffing Target
                {hasTargetOverride && <span className="ml-1 px-1 rounded" style={{ backgroundColor: THEME.accent.cyan + '20', color: THEME.accent.cyan, fontSize: '9px' }}>OVERRIDE</span>}
              </label>
              <input 
                type="number" min="0" max="99" value={editTarget} onChange={e => setEditTarget(parseInt(e.target.value, 10) || 0)}
                className="w-20 px-1.5 py-1 rounded-lg outline-none text-xs text-center"
                style={{ backgroundColor: THEME.bg.primary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
              />
            </div>
            
            {/* Actions */}
            <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
              {(hasHoursOverride || hasTargetOverride) ? (
                <button onClick={handleReset} disabled={saving} className="text-xs px-2 py-1 rounded hover:opacity-80" style={{ color: THEME.status.warning }}>
                  Reset to Default
                </button>
              ) : <div />}
              <div className="flex gap-1.5">
                <GradientButton variant="secondary" small onClick={onClose}>Cancel</GradientButton>
                <GradientButton small onClick={handleSave} disabled={!hasChanges || saving}>
                  {saving ? <Loader size={10} className="animate-spin" /> : <Check size={10} />}
                  {saving ? 'Saving...' : 'Save'}
                </GradientButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const isMobileAdmin = useIsMobile();
  const [employees, setEmployees] = useState([]);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [shifts, setShifts] = useState({});
  const [empFormOpen, setEmpFormOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [unsaved, setUnsaved] = useState(false);
  const [published, setPublished] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule', 'comms', or 'requests'
  
  // Loading state for initial data fetch
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  // Toast notification state for save operations
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  
  // Helper to show toast with auto-dismiss
  const showToast = (type, message, duration = 3000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), duration);
  };
  
  // Edit Mode: Per-period tracking - each pay period can be independently LIVE or in Edit Mode
  // Key = periodIndex, Value = true (edit mode) or false (live/locked)
  // New periods default to edit mode (true)
  const [editModeByPeriod, setEditModeByPeriod] = useState({});
  const [publishedShifts, setPublishedShifts] = useState({});
  const [scheduleSaving, setScheduleSaving] = useState(false); // True while batch saving shifts
  const [staffingTargets, setStaffingTargets] = useState(DEFAULT_STAFFING_TARGETS);
  const [storeHoursOverrides, setStoreHoursOverrides] = useState({}); // { "2026-02-14": { open: "10:00", close: "21:00" } }
  const [staffingTargetOverrides, setStaffingTargetOverrides] = useState({}); // { "2026-02-14": 12 }
  const [editingColumnDate, setEditingColumnDate] = useState(null); // Date object for column header popover
  
  // Sync overrides to module-level refs (so getStoreHoursForDate works outside component)
  useEffect(() => { _storeHoursOverrides = storeHoursOverrides; }, [storeHoursOverrides]);
  useEffect(() => { _staffingTargetOverrides = staffingTargetOverrides; }, [staffingTargetOverrides]);
  
  // Helper to check if current period is in edit mode (defaults to true for new periods)
  const isCurrentPeriodEditMode = editModeByPeriod[periodIndex] ?? true;
  const [announcements, setAnnouncements] = useState({}); // Keyed by periodStartDate (YYYY-MM-DD)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  
  // Get periodStartDate string for current period (must be calculated inline since startDate isn't available yet)
  const getCurrentPeriodStartDate = () => {
    const sd = new Date(PAY_PERIOD_START.getFullYear(), PAY_PERIOD_START.getMonth(), PAY_PERIOD_START.getDate() + (periodIndex * 14));
    return sd.toISOString().split('T')[0];
  };
  
  // Get/set announcement for current period using startDate as key
  const currentPeriodStartDate = getCurrentPeriodStartDate();
  const currentAnnouncement = announcements[currentPeriodStartDate] || { subject: '', message: '' };
  const setCurrentAnnouncement = (ann) => setAnnouncements(prev => ({ ...prev, [currentPeriodStartDate]: ann }));
  
  // Save announcement to backend
  const saveAnnouncement = async (announcement) => {
    if (!currentUser?.email) return;
    
    const periodStartDate = getCurrentPeriodStartDate();
    console.log('saveAnnouncement called with:', announcement, 'for periodStartDate:', periodStartDate);
    
    // If both subject and message are empty, delete instead of save
    if (!announcement.subject && !announcement.message) {
      console.log('Empty announcement - calling clearAnnouncement instead');
      await clearAnnouncement();
      return;
    }
    
    setSavingAnnouncement(true);
    const result = await apiCall('saveAnnouncement', {
      callerEmail: currentUser.email,
      periodStartDate: periodStartDate,
      subject: announcement.subject,
      message: announcement.message
    });
    
    if (result.success) {
      console.log('Announcement saved:', result.data);
      // Update local state with the saved announcement (includes id and updatedAt)
      setAnnouncements(prev => ({
        ...prev,
        [periodStartDate]: result.data.announcement
      }));
    } else {
      console.error('Failed to save announcement:', result.error);
      alert('Failed to save announcement: ' + (result.error?.message || 'Unknown error'));
    }
    setSavingAnnouncement(false);
  };
  
  // Clear/delete announcement from backend
  const clearAnnouncement = async () => {
    if (!currentUser?.email) return;
    
    const periodStartDate = getCurrentPeriodStartDate();
    console.log('clearAnnouncement called for periodStartDate:', periodStartDate);
    
    // Always try to delete - backend will handle if not found
    setSavingAnnouncement(true);
    const result = await apiCall('deleteAnnouncement', {
      callerEmail: currentUser.email,
      periodStartDate: periodStartDate
    });
    
    if (result.success) {
      console.log('Announcement deleted from backend');
    } else {
      console.log('Delete result:', result.error?.code, result.error?.message);
      // NOT_FOUND is fine - means there was nothing to delete
    }
    setSavingAnnouncement(false);
    
    // Clear local state
    setAnnouncements(prev => ({
      ...prev,
      [periodStartDate]: { subject: '', message: '' }
    }));
  };
  
  const [inactivePanelOpen, setInactivePanelOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [shiftOffers, setShiftOffers] = useState([]);
  const [shiftSwaps, setShiftSwaps] = useState([]);
  const [adminRequestModalOpen, setAdminRequestModalOpen] = useState(false);
  const [adminDaysOffModalOpen, setAdminDaysOffModalOpen] = useState(false);
  const [autoPopulateConfirm, setAutoPopulateConfirm] = useState(null); // { type: 'populate-all' | 'populate-week' | 'clear-week' | 'clear-all', employee?: obj, week?: 1|2 }
  
  // Mobile admin state
  const [mobileAdminDrawerOpen, setMobileAdminDrawerOpen] = useState(false);
  const [mobileAdminTab, setMobileAdminTab] = useState('schedule'); // 'schedule' | 'requests' | 'comms'
  const [mobileAdminChangePasswordOpen, setMobileAdminChangePasswordOpen] = useState(false);
  const [quickViewEmployee, setQuickViewEmployee] = useState(null);
  
  // Admin handler for selecting request type
  const handleAdminSelectRequestType = (type) => {
    setAdminRequestModalOpen(false);
    if (type === 'days-off') {
      setAdminDaysOffModalOpen(true);
    }
  };
  
  // Reset pay period to current (0) when user changes
  useEffect(() => {
    setPeriodIndex(0);
  }, [currentUser?.id]);
  
  // Load all data from backend after login
  const loadDataFromBackend = async (userEmail) => {
    setIsLoadingData(true);
    setLoadError(null);
    
    const result = await apiCall('getAllData', { callerEmail: userEmail });
    
    if (result.success) {
      const { employees: empData, shifts: shiftData, requests } = result.data;
      
      // Set employees - parse availability JSON string to object
      const parsedEmployees = (empData || []).map(emp => ({
        ...emp,
        availability: typeof emp.availability === 'string' 
          ? JSON.parse(emp.availability) 
          : emp.availability || {
              sunday: { available: true, start: '11:00', end: '18:00' },
              monday: { available: true, start: '11:00', end: '18:00' },
              tuesday: { available: true, start: '11:00', end: '18:00' },
              wednesday: { available: true, start: '11:00', end: '18:00' },
              thursday: { available: true, start: '11:00', end: '19:00' },
              friday: { available: true, start: '11:00', end: '19:00' },
              saturday: { available: true, start: '11:00', end: '19:00' }
            }
      }));
      setEmployees(parsedEmployees);
      
      // Convert shifts array to keyed object { "empId-date": shiftData }
      // Also fix date/time formats from Google Sheets
      const shiftsObj = {};
      console.log('Raw shifts from API:', shiftData);
      (shiftData || []).forEach(shift => {
        // Fix date format - Sheets returns ISO timestamp, we need YYYY-MM-DD
        let dateStr = shift.date;
        if (dateStr && dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
        
        // Fix time format - Sheets returns weird Excel dates like "1899-12-30T15:00:00.000Z"
        // We need just "HH:MM"
        let startTime = shift.startTime;
        let endTime = shift.endTime;
        
        if (startTime && startTime.includes('T')) {
          // Extract time portion from ISO string
          const timePart = startTime.split('T')[1];
          if (timePart) {
            startTime = timePart.substring(0, 5); // "15:00:00.000Z" -> "15:00"
          }
        }
        
        if (endTime && endTime.includes('T')) {
          const timePart = endTime.split('T')[1];
          if (timePart) {
            endTime = timePart.substring(0, 5);
          }
        }
        
        const fixedShift = {
          ...shift,
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          hours: calculateHours(startTime, endTime) // Calculate hours from times
        };
        
        const key = `${fixedShift.employeeId}-${dateStr}`;
        console.log('Processing shift:', key, fixedShift);
        shiftsObj[key] = fixedShift;
      });
      console.log('Final shiftsObj:', shiftsObj);
      setShifts(shiftsObj);
      
      // Load live periods from backend BEFORE filtering published shifts
      const { livePeriods: loadedLivePeriods } = result.data;
      const editModeObj = {};
      if (loadedLivePeriods && Array.isArray(loadedLivePeriods)) {
        loadedLivePeriods.forEach(pIndex => {
          editModeObj[pIndex] = false; // LIVE = not in edit mode
        });
        setEditModeByPeriod(editModeObj);
        console.log('Loaded live periods:', loadedLivePeriods, 'editModeByPeriod:', editModeObj);
      }
      
      // Build publishedShifts: ONLY include shifts from LIVE periods
      // Non-live periods are drafts that employees should not see
      const publishedObj = {};
      if (loadedLivePeriods && loadedLivePeriods.length > 0) {
        // Build a Set of all dates that belong to LIVE periods
        const liveDates = new Set();
        loadedLivePeriods.forEach(pIndex => {
          const pStart = new Date(PAY_PERIOD_START.getFullYear(), PAY_PERIOD_START.getMonth(), PAY_PERIOD_START.getDate() + (pIndex * 14));
          for (let d = 0; d < 14; d++) {
            const dt = new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate() + d);
            liveDates.add(dt.toISOString().split('T')[0]);
          }
        });
        // Only copy shifts whose date falls within a live period
        Object.entries(shiftsObj).forEach(([key, shift]) => {
          const shiftDate = key.split('-').slice(-3).join('-'); // emp-id-YYYY-MM-DD → YYYY-MM-DD
          // More robust: use the shift's date field
          const dateStr = shift.date || shiftDate;
          if (liveDates.has(dateStr)) {
            publishedObj[key] = shift;
          }
        });
      }
      setPublishedShifts(publishedObj);
      console.log('Published shifts:', Object.keys(publishedObj).length, 'of', Object.keys(shiftsObj).length, 'total');
      
      // Process requests into the 3 types with field mapping
      // Backend uses employeeName/employeeEmail/requestId, frontend uses different names
      const timeOff = (requests || []).filter(r => r.requestType === 'time_off').map(r => ({
        ...r,
        name: r.employeeName || r.name,
        email: r.employeeEmail || r.email
      }));
      
      const offers = (requests || []).filter(r => r.requestType === 'shift_offer').map(o => ({
        ...o,
        offerId: o.requestId || o.offerId,
        offererName: o.employeeName || o.offererName,
        offererEmail: o.employeeEmail || o.offererEmail
      }));
      
      const swaps = (requests || []).filter(r => r.requestType === 'shift_swap').map(s => ({
        ...s,
        swapId: s.requestId || s.swapId,
        initiatorName: s.employeeName || s.initiatorName,
        initiatorEmail: s.employeeEmail || s.initiatorEmail
      }));
      
      console.log('Loaded requests - timeOff:', timeOff.length, 'offers:', offers.length, 'swaps:', swaps.length);
      
      setTimeOffRequests(timeOff);
      setShiftOffers(offers);
      setShiftSwaps(swaps);
      
      // Load announcements from backend
      const { announcements: loadedAnnouncements } = result.data;
      if (loadedAnnouncements && Array.isArray(loadedAnnouncements)) {
        // Convert array to object keyed by periodStartDate (YYYY-MM-DD)
        const announcementsObj = {};
        loadedAnnouncements.forEach(ann => {
          // Normalize the date to YYYY-MM-DD
          const dateKey = ann.periodStartDate ? String(ann.periodStartDate).split('T')[0] : null;
          if (dateKey) {
            announcementsObj[dateKey] = {
              id: ann.id,
              periodStartDate: dateKey,
              subject: ann.subject || '',
              message: ann.message || '',
              updatedAt: ann.updatedAt
            };
          }
        });
        setAnnouncements(announcementsObj);
        console.log('Loaded announcements:', loadedAnnouncements, 'announcementsObj:', announcementsObj);
      }
      
      // Load staffing targets from backend (falls back to DEFAULT_STAFFING_TARGETS)
      const { staffingTargets: loadedTargets, storeHoursOverrides: loadedHoursOverrides, staffingTargetOverrides: loadedTargetOverrides } = result.data;
      if (loadedTargets && typeof loadedTargets === 'object') {
        setStaffingTargets({ ...DEFAULT_STAFFING_TARGETS, ...loadedTargets });
        console.log('Loaded staffing targets:', loadedTargets);
      }
      if (loadedHoursOverrides && typeof loadedHoursOverrides === 'object') {
        setStoreHoursOverrides(loadedHoursOverrides);
        console.log('Loaded store hours overrides:', loadedHoursOverrides);
      }
      if (loadedTargetOverrides && typeof loadedTargetOverrides === 'object') {
        setStaffingTargetOverrides(loadedTargetOverrides);
        console.log('Loaded staffing target overrides:', loadedTargetOverrides);
      }
      
      setIsLoadingData(false);
      return true;
    } else {
      setLoadError(result.error?.message || 'Failed to load data');
      setIsLoadingData(false);
      return false;
    }
  };
  
  // Handle login - set user and load data
  const handleLogin = async (user) => {
    // Parse availability if it's a string
    const parsedUser = {
      ...user,
      availability: typeof user.availability === 'string'
        ? JSON.parse(user.availability)
        : user.availability
    };
    setCurrentUser(parsedUser);
    await loadDataFromBackend(parsedUser.email);
  };
  
  const { startDate, endDate, dates } = useMemo(() => getPayPeriodDates(periodIndex), [periodIndex]);
  const week1 = dates.slice(0, 7), week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]), weekNum2 = getWeekNumber(week2[0]);
  const currentDates = activeWeek === 1 ? week1 : week2;
  
  // Toggle between Edit Mode and LIVE for the CURRENT pay period
  // When going LIVE: batch save shifts + persist LIVE status to backend
  // MUST be defined after `dates` is available
  const toggleEditMode = async () => {
    if (scheduleSaving) return; // Prevent double-clicks during save
    const currentlyEditing = editModeByPeriod[periodIndex] ?? true;
    
    if (currentlyEditing) {
      setScheduleSaving(true);
      // Going from Edit Mode → LIVE: batch save shifts and mark as LIVE
      
      // Collect all shifts for this period
      const periodShifts = [];
      const periodDates = [];
      dates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        periodDates.push(dateStr);
        employees.forEach(emp => {
          const key = `${emp.id}-${dateStr}`;
          if (shifts[key]) {
            // Build full shift object for API
            periodShifts.push({
              id: shifts[key].id || `shift-${emp.id}-${dateStr}`,
              employeeId: emp.id,
              employeeName: emp.name,
              employeeEmail: emp.email,
              date: dateStr,
              startTime: shifts[key].startTime,
              endTime: shifts[key].endTime,
              role: shifts[key].role || 'none',
              task: shifts[key].task || ''
            });
          }
        });
      });
      
      // Batch save shifts to backend
      setToast({ type: 'saving', message: `Saving ${periodShifts.length} shifts...` });
      const saveResult = await apiCall('batchSaveShifts', {
        callerEmail: currentUser.email,
        shifts: periodShifts,
        periodDates: periodDates
      }, (saved, total, chunk, totalChunks) => {
        setToast({ type: 'saving', message: `Saving shifts... ${saved}/${total}` });
      });
      
      if (!saveResult.success) {
        showToast('error', saveResult.error?.message || 'Failed to save schedule');
        setScheduleSaving(false);
        return;
      }
      
      // Update local published shifts
      const newPublished = { ...publishedShifts };
      dates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        employees.forEach(emp => {
          const key = `${emp.id}-${dateStr}`;
          if (shifts[key]) {
            newPublished[key] = { ...shifts[key] };
          } else {
            delete newPublished[key];
          }
        });
      });
      setPublishedShifts(newPublished);
      
      // Calculate new live periods array and save to backend
      const newEditMode = { ...editModeByPeriod, [periodIndex]: false };
      setEditModeByPeriod(newEditMode);
      
      // Get all period indexes that are LIVE (editMode = false)
      const livePeriodIndexes = Object.entries(newEditMode)
        .filter(([_, isEditing]) => !isEditing)
        .map(([idx, _]) => parseInt(idx, 10));
      
      await apiCall('saveLivePeriods', {
        callerEmail: currentUser.email,
        livePeriods: livePeriodIndexes
      });
      
      showToast('success', `Schedule is now LIVE! Saved ${saveResult.data?.savedCount || 0} shifts.`);
      setScheduleSaving(false);
      setUnsaved(false);
      
    } else {
      // Going from LIVE → Edit Mode: just update local state and save to backend
      const newEditMode = { ...editModeByPeriod, [periodIndex]: true };
      setEditModeByPeriod(newEditMode);
      
      // Get all period indexes that are LIVE
      const livePeriodIndexes = Object.entries(newEditMode)
        .filter(([_, isEditing]) => !isEditing)
        .map(([idx, _]) => parseInt(idx, 10));
      
      await apiCall('saveLivePeriods', {
        callerEmail: currentUser.email,
        livePeriods: livePeriodIndexes
      });
      
      showToast('success', 'Switched to Edit Mode');
    }
  };
  
  // Save schedule without going LIVE (batch save shifts to Sheets, stay in Edit Mode)
  const saveSchedule = async () => {
    if (scheduleSaving) return;
    setScheduleSaving(true);
    // Collect all shifts for this period
    const periodShifts = [];
    const periodDates = [];
    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      periodDates.push(dateStr);
      employees.forEach(emp => {
        const key = `${emp.id}-${dateStr}`;
        if (shifts[key]) {
          periodShifts.push({
            id: shifts[key].id || `shift-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            employeeName: emp.name,
            employeeEmail: emp.email,
            date: dateStr,
            startTime: shifts[key].startTime,
            endTime: shifts[key].endTime,
            role: shifts[key].role || 'none',
            task: shifts[key].task || ''
          });
        }
      });
    });
    
    setToast({ type: 'saving', message: `Saving ${periodShifts.length} shifts...` });
    const saveResult = await apiCall('batchSaveShifts', {
      callerEmail: currentUser.email,
      shifts: periodShifts,
      periodDates: periodDates
    }, (saved, total, chunk, totalChunks) => {
      setToast({ type: 'saving', message: `Saving shifts... ${saved}/${total}` });
    });
    
    if (saveResult.success) {
      setUnsaved(false);
      showToast('success', `Saved ${saveResult.data?.savedCount || 0} shifts`);
    } else {
      showToast('error', saveResult.error?.message || 'Failed to save');
    }
    setScheduleSaving(false);
  };
  
  // Save per-date store hours and/or staffing target override
  // Pass null for hours/target to remove that override
  const saveColumnOverrides = async (dateStr, hours, targetVal) => {
    // Update store hours overrides
    const newHoursOverrides = { ...storeHoursOverrides };
    if (hours === null) {
      delete newHoursOverrides[dateStr];
    } else if (hours) {
      newHoursOverrides[dateStr] = hours;
    }
    setStoreHoursOverrides(newHoursOverrides);
    
    // Update staffing target overrides
    const newTargetOverrides = { ...staffingTargetOverrides };
    if (targetVal === null) {
      delete newTargetOverrides[dateStr];
    } else if (targetVal !== undefined) {
      newTargetOverrides[dateStr] = targetVal;
    }
    setStaffingTargetOverrides(newTargetOverrides);
    
    // Save both to backend in parallel
    const [hoursResult, targetResult] = await Promise.all([
      apiCall('saveSetting', {
        callerEmail: currentUser.email,
        key: 'storeHoursOverrides',
        value: newHoursOverrides
      }),
      apiCall('saveSetting', {
        callerEmail: currentUser.email,
        key: 'staffingTargetOverrides',
        value: newTargetOverrides
      })
    ]);
    
    if (hoursResult.success && targetResult.success) {
      showToast('success', 'Day settings saved');
    } else {
      showToast('error', 'Failed to save day settings');
    }
  };
  
  // Active employees for scheduling (exclude owner, exclude admins unless showOnSchedule)
  // Sort: Sarvi first (if schedulable), then full-time (alpha), then part-time (alpha)
  const schedulableEmployees = useMemo(() => [...employees]
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule)
    .sort((a, b) => {
      // Sarvi always first (check by name, case-insensitive)
      const aIsSarvi = a.name.toLowerCase() === 'sarvi';
      const bIsSarvi = b.name.toLowerCase() === 'sarvi';
      if (aIsSarvi && !bIsSarvi) return -1;
      if (bIsSarvi && !aIsSarvi) return 1;
      
      // Full-time before part-time
      const aFT = a.employmentType === 'full-time';
      const bFT = b.employmentType === 'full-time';
      if (aFT && !bFT) return -1;
      if (bFT && !aFT) return 1;
      
      // Alphabetical within same type
      return a.name.localeCompare(b.name);
    }), [employees]);
  
  // Full-time employees only (for auto-populate feature)
  const fullTimeEmployees = useMemo(() => schedulableEmployees.filter(e => e.employmentType === 'full-time'), [schedulableEmployees]);
  
  // Admin contacts (admins who are not owner, for display purposes)
  const adminContacts = useMemo(() => employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted), [employees]);
  
  // All active employees including admins (for employee management)
  const allActiveEmployees = useMemo(() => [...employees].filter(e => e.active && !e.deleted && !e.isOwner).sort((a, b) => a.name.localeCompare(b.name)), [employees]);
  
  // Deleted employees who have shifts in current period (for history display)
  const deletedWithShifts = useMemo(() => {
    return employees.filter(e => e.deleted).filter(emp => {
      return dates.some(d => shifts[`${emp.id}-${d.toISOString().split('T')[0]}`]);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, dates, shifts]);
  
  // Count inactive/deleted for badge (exclude owner from count)
  const inactiveCount = employees.filter(e => (!e.active || e.deleted) && !e.isOwner).length;
  
  // Hidden staff: inactive employees + admins not on schedule (for management section below legend)
  const hiddenStaff = useMemo(() => {
    return employees
      .filter(e => !e.isOwner && !e.deleted) // Not owner, not deleted
      .filter(e => !e.active || (e.isAdmin && !e.showOnSchedule)) // Inactive OR admin hidden from schedule
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const getEmpHours = (id) => { let t = 0; currentDates.forEach(d => { const s = shifts[`${id}-${d.toISOString().split('T')[0]}`]; if (s) t += s.hours || 0; }); return t; };
  
  // Count scheduled employees for a given date
  const getScheduledCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedulableEmployees.filter(emp => shifts[`${emp.id}-${dateStr}`]).length;
  };
  
  // Get staffing target for a given date (per-date override → weekly default → fallback)
  const getStaffingTarget = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (staffingTargetOverrides[dateStr] !== undefined) return staffingTargetOverrides[dateStr];
    const dayName = getDayName(date).toLowerCase();
    return staffingTargets[dayName] || DEFAULT_STAFFING_TARGETS[dayName] || 8;
  };
  
  // Auto-populate shift for an employee on a date based on their availability
  const createShiftFromAvailability = (employee, date) => {
    const dayName = getDayName(date).toLowerCase();
    const avail = employee.availability?.[dayName];
    
    // If not available on this day, skip
    if (!avail || !avail.available) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      date: dateStr,
      startTime: avail.start || STORE_HOURS[dayName].open,
      endTime: avail.end || STORE_HOURS[dayName].close,
      role: 'none',
      task: '',
      hours: calculateHours(avail.start || STORE_HOURS[dayName].open, avail.end || STORE_HOURS[dayName].close)
    };
  };
  
  // Check if employee has shifts in a week
  const employeeHasShiftsInWeek = (employee, weekDates) => {
    return weekDates.some(date => {
      const dateStr = date.toISOString().split('T')[0];
      return shifts[`${employee.id}-${dateStr}`];
    });
  };
  
  // Auto-populate all full-time employees for a specific week
  const autoPopulateWeek = (weekDates, targetEmployees = null) => {
    const emps = targetEmployees || fullTimeEmployees;
    const newShifts = { ...shifts };
    let addedCount = 0;
    
    emps.forEach(emp => {
      weekDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const key = `${emp.id}-${dateStr}`;
        
        // Only add if no existing shift
        if (!newShifts[key]) {
          const shift = createShiftFromAvailability(emp, date);
          if (shift) {
            newShifts[key] = shift;
            addedCount++;
          }
        }
      });
    });
    
    if (addedCount > 0) {
      setShifts(newShifts);
      setUnsaved(true);
    }
    
    return addedCount;
  };
  
  // Clear all shifts for specific employees in a week
  const clearWeekShifts = (weekDates, targetEmployees = null) => {
    const emps = targetEmployees || fullTimeEmployees;
    const empIds = new Set(emps.map(e => e.id));
    const newShifts = { ...shifts };
    let removedCount = 0;
    
    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      empIds.forEach(empId => {
        const key = `${empId}-${dateStr}`;
        if (newShifts[key]) {
          delete newShifts[key];
          removedCount++;
        }
      });
    });
    
    if (removedCount > 0) {
      setShifts(newShifts);
      setUnsaved(true);
    }
    
    return removedCount;
  };
  
  // Handle auto-populate confirmation
  const handleAutoPopulateConfirm = () => {
    if (!autoPopulateConfirm) return;
    
    const { type, employee, week } = autoPopulateConfirm;
    const weekDates = week === 1 ? week1 : week2;
    
    if (type === 'populate-all') {
      const w1Count = autoPopulateWeek(week1);
      const w2Count = autoPopulateWeek(week2);
      const total = w1Count + w2Count;
      if (total > 0) showToast('success', `Added ${total} shifts for full-time employees`);
      else showToast('warning', 'No shifts added — check that full-time employees have availability set');
    } else if (type === 'populate-week' && employee) {
      const count = autoPopulateWeek(weekDates, [employee]);
      if (count > 0) showToast('success', `Added ${count} shifts for ${employee.name}`);
      else showToast('warning', `No shifts added — ${employee.name} may not have availability set for this week`);
    } else if (type === 'clear-week' && employee) {
      const count = clearWeekShifts(weekDates, [employee]);
      showToast('success', `Removed ${count} shifts for ${employee.name}`);
    } else if (type === 'clear-all') {
      const count = clearWeekShifts(weekDates);
      showToast('success', `Removed ${count} shifts for full-time employees`);
    }
    
    setAutoPopulateConfirm(null);
  };
  
  const saveEmployee = async (e) => { 
    // Check for future shifts if setting to inactive
    if (editingEmp && !e.active && editingEmp.active) {
      const today = new Date().toISOString().split('T')[0];
      const futureShifts = Object.entries(shifts)
        .filter(([key, shift]) => shift.employeeId === e.id && shift.date > today)
        .map(([key, shift]) => shift.date);
      
      if (futureShifts.length > 0) {
        const sortedDates = futureShifts.sort();
        const formattedDates = sortedDates.slice(0, 5).map(d => {
          const date = new Date(d + 'T12:00:00');
          return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }).join(', ');
        const moreText = sortedDates.length > 5 ? ` and ${sortedDates.length - 5} more` : '';
        
        showToast('error', `Cannot deactivate: ${e.name} has ${futureShifts.length} future shift(s): ${formattedDates}${moreText}. Remove or reassign shifts first.`, 8000);
        return false; // Return false to indicate failure
      }
    }
    
    // Optimistic update
    if (editingEmp) setEmployees(employees.map(x => x.id === e.id ? e : x)); 
    else setEmployees([...employees, { ...e, active: true }]); 
    setEditingEmp(null); 
    
    // Stringify availability for storage
    const employeeForApi = {
      ...e,
      availability: typeof e.availability === 'object' ? JSON.stringify(e.availability) : e.availability
    };
    
    // Call API to persist
    const result = await apiCall('saveEmployee', {
      callerEmail: currentUser.email,
      employee: employeeForApi
    });
    
    if (result.success) {
      showToast('success', editingEmp ? `${e.name} updated` : `${e.name} added`);
      return true; // Return true to indicate success
    } else {
      showToast('error', result.error?.message || 'Failed to save employee');
      console.error('Employee save failed:', result.error);
      return true; // Still return true since optimistic update happened
    }
  };
  
  // Mark as deleted instead of removing - preserves shift history
  const deleteEmployee = async (id) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return false;
    
    // Check for future shifts
    const today = new Date().toISOString().split('T')[0];
    const futureShifts = Object.entries(shifts)
      .filter(([key, shift]) => shift.employeeId === id && shift.date > today)
      .map(([key, shift]) => shift.date);
    
    if (futureShifts.length > 0) {
      const sortedDates = futureShifts.sort();
      const formattedDates = sortedDates.slice(0, 5).map(d => {
        const date = new Date(d + 'T12:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }).join(', ');
      const moreText = sortedDates.length > 5 ? ` and ${sortedDates.length - 5} more` : '';
      
      showToast('error', `Cannot remove: ${emp.name} has ${futureShifts.length} future shift(s): ${formattedDates}${moreText}. Remove or reassign shifts first.`, 8000);
      return false; // Return false to indicate failure
    }
    
    // Optimistic update
    setEmployees(employees.map(e => e.id === id ? { ...e, deleted: true, active: false } : e));
    
    // Stringify availability for storage
    const employeeForApi = {
      ...emp,
      deleted: true,
      active: false,
      availability: typeof emp.availability === 'object' ? JSON.stringify(emp.availability) : emp.availability
    };
    
    // Call API to persist
    const result = await apiCall('saveEmployee', {
      callerEmail: currentUser.email,
      employee: employeeForApi
    });
    
    if (result.success) {
      showToast('success', `${emp.name} removed`);
      return true;
    } else {
      showToast('error', result.error?.message || 'Failed to remove employee');
      console.error('Employee delete failed:', result.error);
      return true; // Still return true since optimistic update happened
    }
  };
  
  // Reactivate brings back inactive or deleted employees
  const reactivateEmployee = async (id) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    // Optimistic update
    setEmployees(employees.map(e => e.id === id ? { ...e, active: true, deleted: false } : e));
    
    // Stringify availability for storage
    const employeeForApi = {
      ...emp,
      active: true,
      deleted: false,
      availability: typeof emp.availability === 'object' ? JSON.stringify(emp.availability) : emp.availability
    };
    
    // Call API to persist
    const result = await apiCall('saveEmployee', {
      callerEmail: currentUser.email,
      employee: employeeForApi
    });
    
    if (result.success) {
      showToast('success', `${emp.name} reactivated`);
    } else {
      showToast('error', result.error?.message || 'Failed to reactivate employee');
      console.error('Employee reactivate failed:', result.error);
    }
  };
  
  const saveShift = (s) => {
    const k = `${s.employeeId}-${s.date}`;
    console.log('saveShift called (local only):', { key: k, shift: s, deleted: s.deleted });
    
    // Update local state only - shifts are batch saved when going LIVE
    if (s.deleted) { 
      const n = { ...shifts }; 
      delete n[k]; 
      setShifts(n); 
      showToast('success', 'Shift removed (will save when you Go Live)');
    } else {
      setShifts({ ...shifts, [k]: s });
      showToast('success', 'Shift updated (will save when you Go Live)');
    }
    setUnsaved(true); 
    setPublished(false);
  };
  
  // Cancel a time off request (employee action on their own pending request)
  const cancelTimeOffRequest = async (requestId) => {
    const result = await apiCall('cancelTimeOffRequest', {
      callerEmail: currentUser.email,
      requestId: requestId
    });
    
    if (result.success) {
      setTimeOffRequests(prev => prev.map(req => {
        if (req.requestId === requestId && req.status === 'pending') {
          return { ...req, status: 'cancelled', decidedTimestamp: new Date().toISOString(), decidedBy: currentUser?.email || '' };
        }
        return req;
      }));
      showToast('success', 'Request cancelled');
    } else {
      showToast('error', result.error?.message || 'Failed to cancel request');
    }
  };
  
  // Submit a new time off request (employee or admin action)
  const submitTimeOffRequest = async (request) => {
    const result = await apiCall('submitTimeOffRequest', {
      callerEmail: currentUser.email,
      dates: request.datesRequested.split(','),
      reason: request.reason || ''
    });
    
    if (result.success) {
      const serverRequest = {
        ...request,
        requestId: result.data.requestId,
        requestType: 'time_off',
        name: request.name,
        email: request.email,
        employeeName: request.name,
        employeeEmail: request.email,
        createdTimestamp: result.data.createdTimestamp
      };
      setTimeOffRequests(prev => [...prev, serverRequest]);
      showToast('success', 'Time off request submitted');
    } else {
      showToast('error', result.error?.message || 'Failed to submit request');
      console.error('Submit time off failed:', result.error);
    }
  };
  
  // Submit a shift offer (employee action)
  const submitShiftOffer = async (offer) => {
    const result = await apiCall('submitShiftOffer', {
      callerEmail: currentUser.email,
      recipientEmail: offer.recipientEmail,
      shiftDate: offer.shiftDate,
      shiftStart: offer.shiftStart,
      shiftEnd: offer.shiftEnd,
      shiftRole: offer.shiftRole
    });
    
    if (result.success) {
      const serverOffer = {
        ...offer,
        offerId: result.data.requestId,
        requestId: result.data.requestId,
        requestType: 'shift_offer',
        employeeName: offer.offererName,
        employeeEmail: offer.offererEmail,
        createdTimestamp: result.data.createdTimestamp
      };
      setShiftOffers(prev => [...prev, serverOffer]);
      showToast('success', 'Shift offer sent');
    } else {
      showToast('error', result.error?.message || 'Failed to submit offer');
    }
  };
  
  // Cancel a shift offer (offerer action)
  const cancelShiftOffer = async (offerId) => {
    const result = await apiCall('cancelShiftOffer', {
      callerEmail: currentUser.email,
      requestId: offerId
    });
    
    if (result.success) {
      setShiftOffers(prev => prev.map(offer => {
        if ((offer.offerId === offerId || offer.requestId === offerId) && ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)) {
          return { ...offer, status: 'cancelled', cancelledTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer cancelled');
    } else {
      showToast('error', result.error?.message || 'Failed to cancel offer');
    }
  };
  
  // Accept a shift offer (recipient action)
  const acceptShiftOffer = async (offerId) => {
    const result = await apiCall('acceptShiftOffer', {
      callerEmail: currentUser.email,
      requestId: offerId
    });
    
    if (result.success) {
      setShiftOffers(prev => prev.map(offer => {
        if ((offer.offerId === offerId || offer.requestId === offerId) && offer.status === 'awaiting_recipient') {
          return { ...offer, status: 'awaiting_admin', recipientRespondedTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer accepted - awaiting admin approval');
    } else {
      showToast('error', result.error?.message || 'Failed to accept offer');
    }
  };
  
  // Reject a shift offer (recipient action)
  const rejectShiftOffer = async (offerId, note) => {
    const result = await apiCall('declineShiftOffer', {
      callerEmail: currentUser.email,
      requestId: offerId,
      note: note || ''
    });
    
    if (result.success) {
      setShiftOffers(prev => prev.map(offer => {
        if ((offer.offerId === offerId || offer.requestId === offerId) && offer.status === 'awaiting_recipient') {
          return { ...offer, status: 'recipient_rejected', recipientNote: note || '', recipientRespondedTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer declined');
    } else {
      showToast('error', result.error?.message || 'Failed to decline offer');
    }
  };
  
  // Approve a shift offer (admin action) - reassign the shift
  const approveShiftOffer = async (offerId) => {
    const offer = shiftOffers.find(o => (o.offerId === offerId || o.requestId === offerId) && o.status === 'awaiting_admin');
    if (!offer) return;
    
    const result = await apiCall('approveShiftOffer', {
      callerEmail: currentUser.email,
      requestId: offerId
    });
    
    if (result.success) {
      const offerer = employees.find(e => e.email === (offer.offererEmail || offer.employeeEmail));
      const recipient = employees.find(e => e.email === offer.recipientEmail);
      if (offerer && recipient) {
        const shiftKey = `${offerer.id}-${offer.shiftDate}`;
        const oldShift = shifts[shiftKey];
        if (oldShift) {
          setShifts(prevShifts => {
            const newShifts = { ...prevShifts };
            delete newShifts[shiftKey];
            newShifts[`${recipient.id}-${offer.shiftDate}`] = { ...oldShift, employeeId: recipient.id, employeeName: recipient.name };
            return newShifts;
          });
        }
      }
      setShiftOffers(prev => prev.map(o => {
        if (o.offerId === offerId || o.requestId === offerId) {
          return { ...o, status: 'approved', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return o;
      }));
      showToast('success', 'Shift offer approved');
    } else {
      showToast('error', result.error?.message || 'Failed to approve offer');
    }
  };
  
  // Reject a shift offer (admin action)
  const adminRejectShiftOffer = async (offerId, note) => {
    const result = await apiCall('rejectShiftOffer', {
      callerEmail: currentUser.email,
      requestId: offerId,
      note: note || ''
    });
    
    if (result.success) {
      setShiftOffers(prev => prev.map(offer => {
        if ((offer.offerId === offerId || offer.requestId === offerId) && offer.status === 'awaiting_admin') {
          return { ...offer, status: 'rejected', adminNote: note || '', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return offer;
      }));
      showToast('success', 'Shift offer rejected');
    } else {
      showToast('error', result.error?.message || 'Failed to reject offer');
    }
  };
  
  // Revoke an approved shift offer (admin action) - reverts the shift back to original owner
  const revokeShiftOffer = async (offerId) => {
    const offer = shiftOffers.find(o => (o.offerId === offerId || o.requestId === offerId) && o.status === 'approved');
    if (!offer) return;
    
    const shiftDate = new Date(offer.shiftDate + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (shiftDate < today) {
      showToast('error', 'Cannot revoke a shift offer for a past date.');
      return;
    }
    
    const result = await apiCall('revokeShiftOffer', {
      callerEmail: currentUser.email,
      requestId: offerId
    });
    
    if (result.success) {
      const offerer = employees.find(e => e.email === (offer.offererEmail || offer.employeeEmail));
      const recipient = employees.find(e => e.email === offer.recipientEmail);
      if (offerer && recipient) {
        const recipientShiftKey = `${recipient.id}-${offer.shiftDate}`;
        const currentShift = shifts[recipientShiftKey];
        if (currentShift) {
          setShifts(prevShifts => {
            const newShifts = { ...prevShifts };
            delete newShifts[recipientShiftKey];
            newShifts[`${offerer.id}-${offer.shiftDate}`] = { ...currentShift, employeeId: offerer.id, employeeName: offerer.name };
            return newShifts;
          });
        }
      }
      setShiftOffers(prev => prev.map(o => {
        if (o.offerId === offerId || o.requestId === offerId) {
          return { ...o, status: 'revoked', revokedTimestamp: new Date().toISOString(), revokedBy: currentUser?.email || '' };
        }
        return o;
      }));
      showToast('success', 'Shift offer revoked');
    } else {
      showToast('error', result.error?.message || 'Failed to revoke offer');
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SHIFT SWAP HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Submit a new swap request (employee action)
  const submitSwapRequest = async (swap) => {
    const result = await apiCall('submitSwapRequest', {
      callerEmail: currentUser.email,
      partnerEmail: swap.partnerEmail,
      initiatorShift: {
        date: swap.initiatorShiftDate,
        start: swap.initiatorShiftStart,
        end: swap.initiatorShiftEnd,
        role: swap.initiatorShiftRole
      },
      partnerShift: {
        date: swap.partnerShiftDate,
        start: swap.partnerShiftStart,
        end: swap.partnerShiftEnd,
        role: swap.partnerShiftRole
      }
    });
    
    if (result.success) {
      const serverSwap = {
        ...swap,
        swapId: result.data.requestId,
        requestId: result.data.requestId,
        requestType: 'shift_swap',
        employeeName: swap.initiatorName,
        employeeEmail: swap.initiatorEmail,
        createdTimestamp: result.data.createdTimestamp
      };
      setShiftSwaps(prev => [...prev, serverSwap]);
      showToast('success', 'Swap request sent to ' + swap.partnerName);
    } else {
      showToast('error', result.error?.message || 'Failed to submit swap request');
      console.error('Submit swap failed:', result.error);
    }
  };
  
  // Cancel a swap request (initiator action)
  const cancelSwapRequest = async (swapId) => {
    const result = await apiCall('cancelSwapRequest', {
      callerEmail: currentUser.email,
      requestId: swapId
    });
    
    if (result.success) {
      setShiftSwaps(prev => prev.map(swap => {
        if ((swap.swapId === swapId || swap.requestId === swapId) && ['awaiting_partner', 'awaiting_admin'].includes(swap.status)) {
          return { ...swap, status: 'cancelled' };
        }
        return swap;
      }));
      showToast('success', 'Swap request cancelled');
    } else {
      showToast('error', result.error?.message || 'Failed to cancel swap');
    }
  };
  
  // Accept a swap request (partner action)
  const acceptSwapRequest = async (swapId) => {
    const result = await apiCall('acceptSwapRequest', {
      callerEmail: currentUser.email,
      requestId: swapId
    });
    
    if (result.success) {
      setShiftSwaps(prev => prev.map(swap => {
        if ((swap.swapId === swapId || swap.requestId === swapId) && swap.status === 'awaiting_partner') {
          return { ...swap, status: 'awaiting_admin', partnerRespondedTimestamp: new Date().toISOString() };
        }
        return swap;
      }));
      showToast('success', 'Swap accepted - awaiting admin approval');
    } else {
      showToast('error', result.error?.message || 'Failed to accept swap');
    }
  };
  
  // Reject a swap request (partner action)
  const rejectSwapRequest = async (swapId, note) => {
    const result = await apiCall('declineSwapRequest', {
      callerEmail: currentUser.email,
      requestId: swapId,
      note: note || ''
    });
    
    if (result.success) {
      setShiftSwaps(prev => prev.map(swap => {
        if ((swap.swapId === swapId || swap.requestId === swapId) && swap.status === 'awaiting_partner') {
          return { ...swap, status: 'partner_rejected', partnerNote: note || '', partnerRespondedTimestamp: new Date().toISOString() };
        }
        return swap;
      }));
      showToast('success', 'Swap request declined');
    } else {
      showToast('error', result.error?.message || 'Failed to decline swap');
    }
  };
  
  // Approve a swap request (admin action) - swap both shifts
  const approveSwapRequest = async (swapId) => {
    const swap = shiftSwaps.find(s => (s.swapId === swapId || s.requestId === swapId) && s.status === 'awaiting_admin');
    if (!swap) return;
    
    const result = await apiCall('approveSwapRequest', {
      callerEmail: currentUser.email,
      requestId: swapId
    });
    
    if (result.success) {
      const initiator = employees.find(e => e.email === (swap.initiatorEmail || swap.employeeEmail));
      const partner = employees.find(e => e.email === swap.partnerEmail);
      
      if (initiator && partner) {
        const initiatorShiftKey = `${initiator.id}-${swap.initiatorShiftDate}`;
        const partnerShiftKey = `${partner.id}-${swap.partnerShiftDate}`;
        const initiatorShift = shifts[initiatorShiftKey];
        const partnerShift = shifts[partnerShiftKey];
        
        setShifts(prevShifts => {
          const newShifts = { ...prevShifts };
          delete newShifts[initiatorShiftKey];
          delete newShifts[partnerShiftKey];
          if (initiatorShift) {
            newShifts[`${partner.id}-${swap.initiatorShiftDate}`] = { ...initiatorShift, employeeId: partner.id, employeeName: partner.name };
          }
          if (partnerShift) {
            newShifts[`${initiator.id}-${swap.partnerShiftDate}`] = { ...partnerShift, employeeId: initiator.id, employeeName: initiator.name };
          }
          return newShifts;
        });
      }
      
      setShiftSwaps(prev => prev.map(s => {
        if (s.swapId === swapId || s.requestId === swapId) {
          return { ...s, status: 'approved', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return s;
      }));
      showToast('success', 'Swap request approved');
    } else {
      showToast('error', result.error?.message || 'Failed to approve swap');
    }
  };
  
  // Reject a swap request (admin action)
  const adminRejectSwapRequest = async (swapId, note) => {
    const result = await apiCall('rejectSwapRequest', {
      callerEmail: currentUser.email,
      requestId: swapId,
      note: note || ''
    });
    
    if (result.success) {
      setShiftSwaps(prev => prev.map(swap => {
        if ((swap.swapId === swapId || swap.requestId === swapId) && swap.status === 'awaiting_admin') {
          return { ...swap, status: 'rejected', adminNote: note || '', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return swap;
      }));
      showToast('success', 'Swap request rejected');
    } else {
      showToast('error', result.error?.message || 'Failed to reject swap');
    }
  };
  
  // Revoke an approved swap request (admin action) - swap shifts back
  const revokeSwapRequest = async (swapId) => {
    const swap = shiftSwaps.find(s => (s.swapId === swapId || s.requestId === swapId) && s.status === 'approved');
    if (!swap) return;
    
    const initiatorDate = new Date(swap.initiatorShiftDate + 'T12:00:00');
    const partnerDate = new Date(swap.partnerShiftDate + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (initiatorDate < today || partnerDate < today) {
      showToast('error', 'Cannot revoke a swap where one or both shifts are in the past.');
      return;
    }
    
    const result = await apiCall('revokeSwapRequest', {
      callerEmail: currentUser.email,
      requestId: swapId
    });
    
    if (result.success) {
      const initiator = employees.find(e => e.email === (swap.initiatorEmail || swap.employeeEmail));
      const partner = employees.find(e => e.email === swap.partnerEmail);
      
      if (initiator && partner) {
        const partnerOnInitiatorDateKey = `${partner.id}-${swap.initiatorShiftDate}`;
        const initiatorOnPartnerDateKey = `${initiator.id}-${swap.partnerShiftDate}`;
        const partnerOnInitiatorDateShift = shifts[partnerOnInitiatorDateKey];
        const initiatorOnPartnerDateShift = shifts[initiatorOnPartnerDateKey];
        
        setShifts(prevShifts => {
          const newShifts = { ...prevShifts };
          delete newShifts[partnerOnInitiatorDateKey];
          delete newShifts[initiatorOnPartnerDateKey];
          if (partnerOnInitiatorDateShift) {
            newShifts[`${initiator.id}-${swap.initiatorShiftDate}`] = { ...partnerOnInitiatorDateShift, employeeId: initiator.id, employeeName: initiator.name };
          }
          if (initiatorOnPartnerDateShift) {
            newShifts[`${partner.id}-${swap.partnerShiftDate}`] = { ...initiatorOnPartnerDateShift, employeeId: partner.id, employeeName: partner.name };
          }
          return newShifts;
        });
      }
      
      setShiftSwaps(prev => prev.map(s => {
        if (s.swapId === swapId || s.requestId === swapId) {
          return { ...s, status: 'revoked', revokedTimestamp: new Date().toISOString(), revokedBy: currentUser?.email || '' };
        }
        return s;
      }));
      showToast('success', 'Swap revoked');
    } else {
      showToast('error', result.error?.message || 'Failed to revoke swap');
    }
  };
  
  // Approve a time off request (admin action)
  const approveTimeOffRequest = async (requestId, notes) => {
    const result = await apiCall('approveTimeOffRequest', {
      callerEmail: currentUser.email,
      requestId: requestId,
      note: notes || ''
    });
    
    if (result.success) {
      setTimeOffRequests(prev => prev.map(req => {
        if (req.requestId === requestId && req.status === 'pending') {
          return { ...req, status: 'approved', reason: notes || '', decidedTimestamp: new Date().toISOString(), decidedBy: currentUser?.email || '' };
        }
        return req;
      }));
      showToast('success', 'Request approved');
    } else {
      showToast('error', result.error?.message || 'Failed to approve request');
    }
  };
  
  // Deny a time off request (admin action)
  const denyTimeOffRequest = async (requestId, notes) => {
    const result = await apiCall('denyTimeOffRequest', {
      callerEmail: currentUser.email,
      requestId: requestId,
      reason: notes || ''
    });
    
    if (result.success) {
      setTimeOffRequests(prev => prev.map(req => {
        if (req.requestId === requestId && req.status === 'pending') {
          return { ...req, status: 'denied', reason: notes || '', decidedTimestamp: new Date().toISOString(), decidedBy: currentUser?.email || '' };
        }
        return req;
      }));
      showToast('success', 'Request denied');
    } else {
      showToast('error', result.error?.message || 'Failed to deny request');
    }
  };
  
  // Revoke an approved time off request (admin action, future dates only)
  const revokeTimeOffRequest = async (requestId, notes) => {
    const request = timeOffRequests.find(r => r.requestId === requestId && r.status === 'approved');
    if (!request) return;
    
    // Check if request has any future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = request.datesRequested.split(',');
    const hasFutureDates = dates.some(d => new Date(d + 'T12:00:00') >= today);
    
    if (!hasFutureDates) {
      showToast('error', 'Cannot revoke time off for dates that are all in the past.');
      return;
    }
    
    const result = await apiCall('revokeTimeOffRequest', {
      callerEmail: currentUser.email,
      requestId: requestId,
      note: notes || ''
    });
    
    if (result.success) {
      setTimeOffRequests(prev => prev.map(req => {
        if (req.requestId === requestId && req.status === 'approved') {
          return { ...req, status: 'revoked', reason: notes || req.reason, revokedTimestamp: new Date().toISOString(), revokedBy: currentUser?.email || '' };
        }
        return req;
      }));
      showToast('success', 'Request revoked');
    } else {
      showToast('error', result.error?.message || 'Failed to revoke request');
    }
  };
  
  // Count pending requests for badge (all three types that need admin action)
  const pendingTimeOffCount = timeOffRequests.filter(r => r.status === 'pending').length;
  const pendingOffersCount = shiftOffers.filter(o => o.status === 'awaiting_admin').length;
  const pendingSwapsCount = shiftSwaps.filter(s => s.status === 'awaiting_admin').length;
  const pendingRequestCount = pendingTimeOffCount + pendingOffersCount + pendingSwapsCount;
  
  // Tooltip handlers
  const handleShowTooltip = (employee, hours, triggerRef, isDeleted) => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.right + 8;
      if (left + 240 > window.innerWidth - 20) left = rect.left - 248;
      let top = rect.top;
      if (top < 10) top = 10;
      if (top + 250 > window.innerHeight) top = window.innerHeight - 260;
      setTooltipData({ employee, hours, isDeleted, pos: { top, left } });
    }
  };
  
  const handleHideTooltip = () => setTooltipData(null);
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Show login screen if not logged in
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  
  // Show loading screen while fetching data
  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.bg.primary }}>
        <div className="text-center">
          <Loader size={32} className="animate-spin mx-auto mb-4" style={{ color: THEME.accent.purple }} />
          <p style={{ color: THEME.text.secondary }}>Loading your schedule...</p>
        </div>
      </div>
    );
  }
  
  // Show error if data load failed
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: THEME.bg.primary }}>
        <div className="text-center max-w-md">
          <AlertCircle size={32} className="mx-auto mb-4" style={{ color: THEME.status.error }} />
          <p className="mb-4" style={{ color: THEME.text.primary }}>{loadError}</p>
          <button 
            onClick={() => loadDataFromBackend(currentUser.email)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: THEME.accent.purple, color: '#fff' }}
          >
            Try Again
          </button>
          <button 
            onClick={() => { setCurrentUser(null); setLoadError(null); }}
            className="ml-2 px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }
  
  // Show employee view if not admin
  if (!currentUser.isAdmin) {
    return <EmployeeView employees={employees} shifts={publishedShifts} dates={dates} periodInfo={{ startDate, endDate }} currentUser={currentUser} onLogout={() => setCurrentUser(null)} timeOffRequests={timeOffRequests} onCancelRequest={cancelTimeOffRequest} onSubmitRequest={submitTimeOffRequest} shiftOffers={shiftOffers} onSubmitOffer={submitShiftOffer} onCancelOffer={cancelShiftOffer} onAcceptOffer={acceptShiftOffer} onRejectOffer={rejectShiftOffer} shiftSwaps={shiftSwaps} onSubmitSwap={submitSwapRequest} onCancelSwap={cancelSwapRequest} onAcceptSwap={acceptSwapRequest} onRejectSwap={rejectSwapRequest} periodIndex={periodIndex} onPeriodChange={setPeriodIndex} isEditMode={isCurrentPeriodEditMode} announcement={currentAnnouncement} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE ADMIN VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMobileAdmin) {
    const mobileCurrentDates = activeWeek === 1 ? week1 : week2;
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
        <GradientBackground />
        
        {/* Mobile Admin Header */}
        <header className="sticky top-0" style={{ backgroundColor: THEME.bg.secondary, borderBottom: 'none', zIndex: 100 }}>
          {/* Row 1: Hamburger + centered RAINBOW logo */}
          <div className="flex items-center px-3 pt-3 pb-2" style={{ position: 'relative' }}>
            <button onClick={() => setMobileAdminDrawerOpen(true)} className="p-1.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.primary, zIndex: 1 }}>
              <Menu size={18} />
            </button>
            <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: "'Josefin Sans', sans-serif" }}>
              <span className="tracking-[0.2em] font-semibold" style={{ color: THEME.text.primary, fontSize: '14px' }}>RAINBOW</span>
            </div>
          </div>

          {/* Row 2: Period nav centered */}
          <div className="flex items-center justify-center px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPeriodIndex(periodIndex - 1)} className="p-1 rounded" style={{ color: THEME.text.secondary }}>
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '13px' }}>{formatDate(startDate)} – {formatDate(endDate)}</p>
                {periodIndex === 0 && <p className="font-medium" style={{ color: THEME.accent.cyan, fontSize: '10px', marginTop: 1 }}>Current Period</p>}
                {periodIndex > 0 && <p className="font-medium" style={{ color: THEME.accent.purple, fontSize: '10px', marginTop: 1 }}>Future</p>}
                {periodIndex < 0 && <p className="font-medium" style={{ color: THEME.text.muted, fontSize: '10px', marginTop: 1 }}>Past</p>}
              </div>
              <button onClick={() => setPeriodIndex(periodIndex + 1)} className="p-1 rounded" style={{ color: THEME.text.secondary }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Row 3: Action buttons right-aligned */}
          <div className="flex items-center justify-end px-3 pb-2 gap-1.5">
            {isCurrentPeriodEditMode ? (
              unsaved ? (
                <button
                  onClick={saveSchedule}
                  disabled={scheduleSaving}
                  className="px-2.5 py-1 rounded-md font-bold flex items-center gap-1 disabled:opacity-50"
                  style={{
                    fontSize: '10px',
                    background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                    color: '#fff',
                    boxShadow: `0 0 8px ${THEME.accent.blue}40`
                  }}
                >
                  {scheduleSaving ? <><Loader size={10} className="animate-spin" /> Saving</> : <><Save size={10} /> Save</>}
                </button>
              ) : (
                <button
                  onClick={toggleEditMode}
                  disabled={scheduleSaving}
                  className="px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 disabled:opacity-50"
                  style={{
                    fontSize: '10px',
                    backgroundColor: THEME.status.success + '20',
                    color: THEME.status.success,
                    border: `1px solid ${THEME.status.success}40`
                  }}
                >
                  {scheduleSaving ? <><Loader size={10} className="animate-spin" /> Live</> : <><Eye size={10} /> Go Live</>}
                </button>
              )
            ) : (
              <>
                <button
                  onClick={toggleEditMode}
                  disabled={scheduleSaving}
                  className="px-2 py-0.5 rounded-md font-medium flex items-center gap-1 disabled:opacity-50"
                  style={{
                    fontSize: '10px',
                    backgroundColor: THEME.status.warning + '20',
                    color: THEME.status.warning,
                    border: `1px solid ${THEME.status.warning}40`
                  }}
                >
                  <Edit3 size={10} /> Edit
                </button>
                <button
                  onClick={() => setEmailOpen(true)}
                  className="px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                  style={{
                    fontSize: '10px',
                    background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                    color: '#fff'
                  }}
                >
                  <Mail size={10} /> Publish
                </button>
              </>
            )}
          </div>

          {/* Row 4: Status banner */}
          <div className="px-3 pb-2">
            {!isCurrentPeriodEditMode ? (
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.success + '15', border: `1px solid ${THEME.status.success}30` }}>
                <Eye size={12} style={{ color: THEME.status.success }} />
                <span className="text-xs font-medium" style={{ color: THEME.status.success }}>Schedule is LIVE — visible to staff</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
                <Edit3 size={12} style={{ color: THEME.status.warning }} />
                <span className="text-xs font-medium" style={{ color: THEME.status.warning }}>Edit Mode — tap cells to edit shifts</span>
              </div>
            )}
          </div>

          {/* Row 5: Raised Filing Tabs */}
          <div className="flex items-end px-3" style={{ marginBottom: -1 }}>
            {[
              { id: 'wk1', label: `Wk ${weekNum1}`, tab: 'schedule', week: 1 },
              { id: 'wk2', label: `Wk ${weekNum2}`, tab: 'schedule', week: 2 },
              { id: 'mine', label: 'Mine', tab: 'mine' },
              { id: 'requests', label: 'Requests', tab: 'requests', badge: pendingRequestCount },
              { id: 'comms', label: 'Comms', tab: 'comms', badge: currentAnnouncement?.message ? 1 : 0 },
            ].map(t => {
              const isActive = t.tab === 'schedule' 
                ? mobileAdminTab === 'schedule' && activeWeek === t.week 
                : mobileAdminTab === t.tab;
              return (
                <button 
                  key={t.id}
                  onClick={() => { 
                    setMobileAdminTab(t.tab); 
                    if (t.week) setActiveWeek(t.week); 
                  }}
                  className="flex-1 py-1.5 text-xs font-medium relative flex items-center justify-center gap-1"
                  style={{ 
                    backgroundColor: isActive ? THEME.bg.primary : THEME.bg.tertiary,
                    color: isActive ? THEME.accent.purple : THEME.text.muted,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    borderTop: `2px solid ${isActive ? THEME.accent.purple : 'transparent'}`,
                    borderLeft: `1px solid ${isActive ? THEME.border.default : 'transparent'}`,
                    borderRight: `1px solid ${isActive ? THEME.border.default : 'transparent'}`,
                    borderBottom: isActive ? 'none' : `1px solid ${THEME.border.default}`,
                    marginRight: -1,
                    zIndex: isActive ? 10 : 1,
                    fontWeight: isActive ? 600 : 500
                  }}
                >
                  {t.label}
                  {t.badge > 0 && (
                    <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center" 
                      style={{ backgroundColor: THEME.status.warning, color: '#000', fontSize: '9px' }}>
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
            {/* Fill rest of bottom border */}
            <div className="flex-grow-0" style={{ borderBottom: `1px solid ${THEME.border.default}`, width: 0 }} />
          </div>
        </header>
        
        {/* Content */}
        <main className="p-2">
          {mobileAdminTab === 'schedule' ? (
            <>
              {/* Schedule Grid */}
              <MobileAdminScheduleGrid
                employees={schedulableEmployees}
                shifts={shifts}
                dates={mobileCurrentDates}
                loggedInUser={currentUser}
                getEmployeeHours={getEmpHours}
                timeOffRequests={timeOffRequests}
                getScheduledCount={getScheduledCount}
                getStaffingTarget={getStaffingTarget}
                staffingTargetOverrides={staffingTargetOverrides}
                storeHoursOverrides={storeHoursOverrides}
                isEditMode={isCurrentPeriodEditMode}
                onCellClick={(emp, date, shift) => {
                  if (isCurrentPeriodEditMode) {
                    setEditingShift({ employee: emp, date, shift });
                  }
                }}
                onNameClick={(emp) => setQuickViewEmployee(emp)}
              />
            </>
          ) : mobileAdminTab === 'requests' ? (
            <div className="space-y-3">
              {/* Time Off */}
              <CollapsibleSection 
                title="Time Off Requests" icon={Calendar} iconColor={THEME.accent.cyan}
                badge={timeOffRequests.filter(r => r.status === 'pending').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={timeOffRequests.filter(r => r.status === 'pending').length > 0}
              >
                <AdminTimeOffPanel requests={timeOffRequests} onApprove={approveTimeOffRequest} onDeny={denyTimeOffRequest} onRevoke={revokeTimeOffRequest} currentAdminEmail={currentUser?.email} />
              </CollapsibleSection>
              
              {/* Take My Shift */}
              <CollapsibleSection 
                title="Take My Shift" icon={ArrowRight} iconColor={THEME.accent.pink}
                badge={shiftOffers.filter(o => o.status === 'awaiting_admin').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={shiftOffers.filter(o => o.status === 'awaiting_admin').length > 0}
              >
                <AdminShiftOffersPanel offers={shiftOffers} onApprove={approveShiftOffer} onReject={adminRejectShiftOffer} onRevoke={revokeShiftOffer} currentAdminEmail={currentUser?.email} />
              </CollapsibleSection>
              
              {/* Shift Swaps */}
              <CollapsibleSection 
                title="Shift Swaps" icon={ArrowRightLeft} iconColor={THEME.accent.purple}
                badge={shiftSwaps.filter(s => s.status === 'awaiting_admin').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={shiftSwaps.filter(s => s.status === 'awaiting_admin').length > 0}
              >
                <AdminShiftSwapsPanel swaps={shiftSwaps} onApprove={approveSwapRequest} onReject={adminRejectSwapRequest} onRevoke={revokeSwapRequest} currentAdminEmail={currentUser?.email} />
              </CollapsibleSection>
            </div>
          ) : mobileAdminTab === 'mine' ? (
            /* Admin's own schedule */
            <MobileMySchedule
              currentUser={currentUser}
              shifts={shifts}
              dates={dates}
              timeOffRequests={timeOffRequests}
            />
          ) : mobileAdminTab === 'comms' ? (
            /* Announcements */
            <MobileAnnouncementPanel
              announcement={currentAnnouncement}
              onAnnouncementChange={setCurrentAnnouncement}
              onSave={saveAnnouncement}
              onClear={clearAnnouncement}
              isEditMode={isCurrentPeriodEditMode}
              isSaving={savingAnnouncement}
            />
          ) : null}
        </main>
        
        {/* Admin Drawer */}
        <MobileAdminDrawer
          isOpen={mobileAdminDrawerOpen}
          onClose={() => setMobileAdminDrawerOpen(false)}
          currentUser={currentUser}
          onLogout={() => setCurrentUser(null)}
          onOpenChangePassword={() => setMobileAdminChangePasswordOpen(true)}
          onOpenOwnRequests={() => setAdminRequestModalOpen(true)}
          pendingRequestCount={pendingRequestCount}
        />
        
        {/* Shift Editor Modal (reused from desktop) */}
        {editingShift && (
          <ShiftEditorModal 
            isOpen 
            onClose={() => setEditingShift(null)} 
            onSave={saveShift} 
            employee={editingShift.employee} 
            date={editingShift.date} 
            existingShift={editingShift.shift} 
            totalPeriodHours={getEmpHours(editingShift.employee.id)} 
          />
        )}
        
        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={mobileAdminChangePasswordOpen}
          onClose={() => setMobileAdminChangePasswordOpen(false)}
          currentUser={currentUser}
        />
        
        {/* Employee Quick View - tap name to see contact info */}
        <MobileEmployeeQuickView
          isOpen={!!quickViewEmployee}
          onClose={() => setQuickViewEmployee(null)}
          employee={quickViewEmployee}
        />
        
        {/* Admin's own request modals */}
        <RequestTimeOffModal 
          isOpen={adminRequestModalOpen} 
          onClose={() => setAdminRequestModalOpen(false)} 
          onSelectType={handleAdminSelectRequestType}
          currentUser={currentUser}
        />
        <RequestDaysOffModal 
          isOpen={adminDaysOffModalOpen} 
          onClose={() => setAdminDaysOffModalOpen(false)} 
          onSubmit={submitTimeOffRequest}
          currentUser={currentUser}
          timeOffRequests={timeOffRequests}
          shiftOffers={shiftOffers}
          shiftSwaps={shiftSwaps}
          shifts={shifts}
        />
        
        {/* Email Publish Modal */}
        <EmailModal 
          isOpen={emailOpen} 
          onClose={() => setEmailOpen(false)} 
          employees={employees} 
          shifts={shifts} 
          dates={dates} 
          periodInfo={{ startDate, endDate }} 
          announcement={currentAnnouncement} 
          onComplete={() => { setPublished(true); setUnsaved(false); }} 
        />
        
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-xl flex items-center gap-2"
            style={{ 
              backgroundColor: toast.type === 'success' ? THEME.status.success : toast.type === 'warning' ? THEME.status.warning : toast.type === 'saving' ? THEME.accent.blue : THEME.status.error,
              color: '#fff', minWidth: 200, textAlign: 'center', zIndex: 100001
            }}>
            {toast.type === 'saving' ? <Loader size={16} className="animate-spin" /> : toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-medium">{toast.message}</span>
            {toast.type !== 'saving' && <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X size={14} /></button>}
          </div>
        )}
      </div>
    );
  }

  // Admin DESKTOP view below
  return (
    <div className="min-h-screen relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <GradientBackground />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');
      `}</style>
      
      {/* Header */}
      <header className="px-4 py-2 sticky top-0" style={{ backgroundColor: THEME.bg.secondary, borderBottom: `1px solid ${THEME.border.subtle}`, zIndex: 100 }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            <div className="flex items-center gap-2">
              <button onClick={() => setPeriodIndex(periodIndex - 1)} className="p-1 rounded-lg hover:scale-105" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}><ChevronLeft size={14} /></button>
              <div className="text-center min-w-[100px]"><p className="font-medium text-xs" style={{ color: THEME.text.primary }}>{formatDate(startDate)} – {formatDate(endDate)}</p></div>
              <button onClick={() => setPeriodIndex(periodIndex + 1)} className="p-1 rounded-lg hover:scale-105" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}><ChevronRight size={14} /></button>
            </div>
            
            {/* Save / Go Live / Edit - Three-state button */}
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            {isCurrentPeriodEditMode ? (
              unsaved ? (
                /* Unsaved changes → Save button — bright and prominent */
                <button
                  onClick={saveSchedule}
                  disabled={scheduleSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                    color: '#fff',
                    boxShadow: `0 0 12px ${THEME.accent.blue}50`
                  }}
                  title="Save changes (schedule stays hidden from employees)"
                >
                  {scheduleSaving ? <><Loader size={12} className="animate-spin" /><span>SAVING...</span></> : <><Save size={12} /><span>SAVE</span></>}
                </button>
              ) : (
                /* Saved / clean → Go Live button */
                <button
                  onClick={toggleEditMode}
                  disabled={scheduleSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    backgroundColor: THEME.status.success + '20',
                    color: THEME.status.success,
                    border: `1px solid ${THEME.status.success}50`
                  }}
                  title="Publish schedule — employees will see it"
                >
                  {scheduleSaving ? <><Loader size={12} className="animate-spin" /><span>GOING LIVE...</span></> : <><Eye size={12} /><span>GO LIVE</span></>}
                </button>
              )
            ) : (
              /* Currently LIVE → Edit button */
              <button
                onClick={toggleEditMode}
                disabled={scheduleSaving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  backgroundColor: THEME.status.warning + '20',
                  color: THEME.status.warning,
                  border: `1px solid ${THEME.status.warning}50`
                }}
                title="Enter edit mode (employees won't see changes)"
              >
                <Edit3 size={12} />
                <span>EDIT MODE</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {published && !unsaved && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}><Check size={10} />Published</span>}
            <TooltipButton tooltip="Add Employee" onClick={() => { setEditingEmp(null); setEmpFormOpen(true); }}><User size={12} /></TooltipButton>
            <div className="relative">
              <TooltipButton tooltip="Manage Staff" onClick={() => setInactivePanelOpen(true)}><Users size={12} /></TooltipButton>
              {inactiveCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center" style={{ backgroundColor: THEME.status.warning, color: '#000', fontSize: '10px' }}>{inactiveCount}</span>}
            </div>
            <div className="relative">
              <TooltipButton tooltip={currentAnnouncement?.message ? "Export PDF (includes announcement)" : "Export PDF"} onClick={() => generateSchedulePDF(employees, shifts, dates, { startDate, endDate }, currentAnnouncement)}><FileText size={12} /></TooltipButton>
              {currentAnnouncement?.message && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: THEME.accent.blue }} />}
            </div>
            <div className="relative">
              <TooltipButton tooltip={currentAnnouncement?.message ? "Email Schedules (includes announcement)" : "Email Schedules"} variant="primary" onClick={() => setEmailOpen(true)}><Mail size={12} />Publish</TooltipButton>
              {currentAnnouncement?.message && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: THEME.accent.blue }} />}
            </div>
            
            <div className="w-px h-6 mx-1" style={{ backgroundColor: THEME.border.default }} />
            
            <TooltipButton tooltip="Admin Settings" onClick={() => setSettingsOpen(true)}><Settings size={12} /></TooltipButton>
            
            {/* Admin's own time off request */}
            <button
              onClick={() => setAdminRequestModalOpen(true)}
              className="px-2 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
              title="Submit your own shift change request"
            >
              <Calendar size={12} />
              Shift Changes
            </button>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-medium flex items-center gap-1" style={{ color: THEME.text.primary }}>
                  <Shield size={10} style={{ color: currentUser.isOwner ? THEME.accent.cyan : THEME.accent.purple }} />
                  {currentUser.name}
                </p>
                <p className="text-xs" style={{ color: currentUser.isOwner ? THEME.accent.cyan : THEME.text.muted }}>
                  {currentUser.isOwner ? 'Owner' : 'Admin'}
                </p>
              </div>
              <button onClick={() => setCurrentUser(null)} className="p-1.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }} title="Sign Out">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="p-3 pt-2 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto">
          {/* Tabs - Week 1, Week 2, Announcements */}
          <div className="flex items-end">
            {[{ w: 1, n: weekNum1, d: week1 }, { w: 2, n: weekNum2, d: week2 }].map(({ w, n, d }) => (
              <button key={w} onClick={() => { setActiveWeek(w); setActiveTab('schedule'); }} className="px-3 py-1.5 font-medium text-xs relative transition-all"
                style={{ backgroundColor: activeTab === 'schedule' && activeWeek === w ? THEME.bg.secondary : THEME.bg.tertiary, color: activeTab === 'schedule' && activeWeek === w ? THEME.text.primary : THEME.text.muted, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginRight: -1, zIndex: activeTab === 'schedule' && activeWeek === w ? 10 : 1, borderTop: `2px solid ${activeTab === 'schedule' && activeWeek === w ? THEME.accent.purple : 'transparent'}`, borderLeft: `1px solid ${THEME.border.default}`, borderRight: `1px solid ${THEME.border.default}`, marginBottom: activeTab === 'schedule' && activeWeek === w ? -1 : 0 }}>
                <span className="font-semibold">Week {n}</span><span className="ml-1.5 opacity-60">{formatDate(d[0])}–{formatDate(d[6])}</span>
              </button>
            ))}
            <button onClick={() => setActiveTab('comms')} className="px-3 py-1.5 font-medium text-xs relative transition-all flex items-center gap-1.5"
              style={{ backgroundColor: activeTab === 'comms' ? THEME.bg.secondary : THEME.bg.tertiary, color: activeTab === 'comms' ? THEME.accent.cyan : THEME.text.muted, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginRight: -1, zIndex: activeTab === 'comms' ? 10 : 1, borderTop: `2px solid ${activeTab === 'comms' ? THEME.accent.cyan : 'transparent'}`, borderLeft: `1px solid ${THEME.border.default}`, borderRight: `1px solid ${THEME.border.default}`, marginBottom: activeTab === 'comms' ? -1 : 0 }}>
              <MessageSquare size={12} />
              <span className="font-semibold">Announcements</span>
              {currentAnnouncement?.message && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.accent.blue }} />}
            </button>
            <button onClick={() => setActiveTab('requests')} className="px-3 py-1.5 font-medium text-xs relative transition-all flex items-center gap-1.5"
              style={{ backgroundColor: activeTab === 'requests' ? THEME.bg.secondary : THEME.bg.tertiary, color: activeTab === 'requests' ? THEME.accent.pink : THEME.text.muted, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginRight: -1, zIndex: activeTab === 'requests' ? 10 : 1, borderTop: `2px solid ${activeTab === 'requests' ? THEME.accent.pink : 'transparent'}`, borderLeft: `1px solid ${THEME.border.default}`, borderRight: `1px solid ${THEME.border.default}`, marginBottom: activeTab === 'requests' ? -1 : 0 }}>
              <ClipboardList size={12} />
              <span className="font-semibold">Shift Changes</span>
              {pendingRequestCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: THEME.status.warning, color: '#000' }}>{pendingRequestCount}</span>}
            </button>
            <div className="flex-1 h-px" style={{ backgroundColor: THEME.border.default }} />
          </div>
          
          {activeTab === 'schedule' ? (
            <>
              {/* Locked schedule indicator */}
              {!isCurrentPeriodEditMode && (
                <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.success + '15', border: `1px solid ${THEME.status.success}30` }}>
                  <Eye size={14} style={{ color: THEME.status.success }} />
                  <span className="text-xs font-medium" style={{ color: THEME.status.success }}>Schedule is LIVE</span>
                  <span className="text-xs" style={{ color: THEME.text.secondary }}>— Click "EDIT MODE" to make changes</span>
                </div>
              )}
              
              {/* Auto-populate toolbar - only in Edit Mode */}
              {isCurrentPeriodEditMode && fullTimeEmployees.length > 0 && (
                <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2 flex-wrap" style={{ backgroundColor: THEME.accent.blue + '10', border: `1px solid ${THEME.accent.blue}30` }}>
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: THEME.accent.blue }} />
                    <span className="text-xs font-medium" style={{ color: THEME.accent.blue }}>Full-Time ({fullTimeEmployees.length})</span>
                  </div>
                  <div className="w-px h-4" style={{ backgroundColor: THEME.border.default }} />
                  
                  {/* Auto-fill buttons */}
                  <button
                    onClick={() => {
                      // Check if any FT employees have shifts in Week 1 or Week 2
                      const hasExisting = fullTimeEmployees.some(e => 
                        employeeHasShiftsInWeek(e, week1) || employeeHasShiftsInWeek(e, week2)
                      );
                      if (hasExisting) {
                        setAutoPopulateConfirm({ type: 'populate-all' });
                      } else {
                        const w1Count = autoPopulateWeek(week1);
                        const w2Count = autoPopulateWeek(week2);
                        const total = w1Count + w2Count;
                        if (total > 0) showToast('success', `Added ${total} shifts for full-time employees`);
                        else showToast('warning', 'No shifts added — check that full-time employees have availability set');
                      }
                    }}
                    className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                    style={{ backgroundColor: THEME.accent.blue, color: 'white' }}
                  >
                    <Zap size={10} />
                    Auto-Fill All FT
                  </button>
                  
                  {/* Per-employee dropdown */}
                  <select
                    onChange={(e) => {
                      const empId = e.target.value;
                      if (!empId) return;
                      const emp = fullTimeEmployees.find(x => x.id === empId);
                      if (emp) {
                        const weekDates = activeWeek === 1 ? week1 : week2;
                        if (employeeHasShiftsInWeek(emp, weekDates)) {
                          setAutoPopulateConfirm({ type: 'populate-week', employee: emp, week: activeWeek });
                        } else {
                          const count = autoPopulateWeek(weekDates, [emp]);
                          if (count > 0) showToast('success', `Added ${count} shifts for ${emp.name}`);
                          else showToast('warning', `No shifts added — ${emp.name} may not have availability set for this week`);
                        }
                      }
                      e.target.value = '';
                    }}
                    className="px-2 py-1 rounded text-xs outline-none"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.primary, border: `1px solid ${THEME.border.default}` }}
                  >
                    <option value="">Auto-Fill Week {activeWeek}...</option>
                    {fullTimeEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  
                  <div className="w-px h-4" style={{ backgroundColor: THEME.border.default }} />
                  
                  {/* Clear buttons */}
                  <select
                    onChange={(e) => {
                      const empId = e.target.value;
                      if (!empId) return;
                      const emp = fullTimeEmployees.find(x => x.id === empId);
                      if (emp) {
                        setAutoPopulateConfirm({ type: 'clear-week', employee: emp, week: activeWeek });
                      }
                      e.target.value = '';
                    }}
                    className="px-2 py-1 rounded text-xs outline-none"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted, border: `1px solid ${THEME.border.default}` }}
                  >
                    <option value="">Clear Week {activeWeek}...</option>
                    {fullTimeEmployees.filter(emp => employeeHasShiftsInWeek(emp, activeWeek === 1 ? week1 : week2)).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setAutoPopulateConfirm({ type: 'clear-all', week: activeWeek })}
                    className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                    style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}
                  >
                    <Trash2 size={10} />
                    Clear All FT Week {activeWeek}
                  </button>
                </div>
              )}
              
              {/* Period Announcement - show if exists */}
              {currentAnnouncement?.message && (
                <div className="mb-2 p-3 rounded-lg flex items-start gap-3" style={{ backgroundColor: THEME.accent.blue + '10', border: `1px solid ${THEME.accent.blue}30` }}>
                  <Bell size={16} style={{ color: THEME.accent.blue, marginTop: 2 }} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: THEME.accent.blue }}>
                      📢 {currentAnnouncement.subject || 'Announcement'}
                    </p>
                    <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: THEME.text.primary }}>
                      {currentAnnouncement.message}
                    </p>
                  </div>
                  {!isCurrentPeriodEditMode && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}>
                      Visible to staff
                    </span>
                  )}
                </div>
              )}
              
              {/* Schedule grid */}
              <div className="rounded-b-xl rounded-tr-xl overflow-visible relative" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderTop: 'none', zIndex: 1 }}>
                <div className="grid gap-px" style={{ gridTemplateColumns: '140px repeat(7, 1fr)', backgroundColor: THEME.border.subtle }}>
                  <div className="p-1.5" style={{ backgroundColor: THEME.bg.tertiary }}><span className="font-semibold text-xs" style={{ color: THEME.text.primary }}>Employee</span></div>
                  {currentDates.map((date, i) => {
                    const sh = getStoreHoursForDate(date);
                    const today = date.toDateString() === new Date().toDateString();
                    const hol = isStatHoliday(date);
                    const scheduled = getScheduledCount(date);
                    const target = getStaffingTarget(date);
                    const atTarget = scheduled >= target;
                    const overTarget = scheduled > target;
                    const dateStr = date.toISOString().split('T')[0];
                    const hasOverride = !!storeHoursOverrides[dateStr] || staffingTargetOverrides[dateStr] !== undefined;
                    const isPast = dateStr < new Date().toISOString().split('T')[0];
                    const canEdit = isCurrentPeriodEditMode && !isPast;
                    return (
                      <div 
                        key={i} 
                        className={`p-1 text-center ${canEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                        style={{ backgroundColor: today ? THEME.accent.purple + '20' : hol ? THEME.status.warning + '15' : THEME.bg.tertiary, borderBottom: today ? `2px solid ${THEME.accent.purple}` : hol ? `2px solid ${THEME.status.warning}` : 'none' }}
                        onClick={() => canEdit && setEditingColumnDate(date)}
                        title={canEdit ? 'Click to edit hours & target' : isPast ? 'Past dates cannot be edited' : 'Switch to Edit Mode to change'}
                      >
                        <p className="font-semibold text-xs" style={{ color: today ? THEME.accent.purple : hol ? THEME.status.warning : THEME.text.primary }}>{getDayName(date).slice(0, 3)}</p>
                        <p className="text-sm font-bold" style={{ color: THEME.text.primary }}>{date.getDate()}</p>
                        <p className="text-xs" style={{ color: hasOverride ? THEME.accent.cyan + 'CC' : THEME.text.muted }}>{formatTimeShort(sh.open)}-{formatTimeShort(sh.close)}</p>
                        <p className="text-xs mt-0.5">
                          {isPast ? (
                            <span style={{ color: THEME.text.muted }}>{scheduled}</span>
                          ) : (
                            <>
                              <span style={{ color: overTarget ? THEME.status.error + 'AA' : atTarget ? THEME.status.success + '99' : THEME.text.muted }}>{scheduled}</span>
                              <span style={{ color: hasOverride ? THEME.accent.cyan + '99' : THEME.text.muted }}>/{target}</span>
                            </>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div>{schedulableEmployees.map((e, i) => {
                  const isFirstPT = i > 0 && e.employmentType !== 'full-time' && e.name.toLowerCase() !== 'sarvi' && 
                    (schedulableEmployees[i-1].employmentType === 'full-time' || schedulableEmployees[i-1].name.toLowerCase() === 'sarvi');
                  return (
                    <React.Fragment key={e.id}>
                      {isFirstPT && <div style={{ height: 1, margin: '3px 8px', backgroundColor: THEME.border.default }} />}
                      <EmployeeRow employee={e} dates={currentDates} shifts={shifts} onCellClick={(emp, d, s) => setEditingShift({ employee: emp, date: d, shift: s })} getEmployeeHours={getEmpHours} onEdit={emp => { setEditingEmp(emp); setEmpFormOpen(true); }} onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} timeOffRequests={timeOffRequests} isLocked={!isCurrentPeriodEditMode} />
                    </React.Fragment>
                  );
                })}</div>
                
                {/* Deleted employees with historical shifts */}
                {deletedWithShifts.length > 0 && (
                  <>
                    <div className="px-2 py-1 flex items-center gap-2" style={{ backgroundColor: THEME.bg.primary }}>
                      <div className="flex-1 h-px" style={{ backgroundColor: THEME.border.default }} />
                      <span className="text-xs" style={{ color: THEME.text.muted }}>Former Staff (History)</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: THEME.border.default }} />
                    </div>
                    {deletedWithShifts.map(e => <EmployeeRow key={e.id} employee={e} dates={currentDates} shifts={shifts} onCellClick={() => {}} getEmployeeHours={getEmpHours} onEdit={() => {}} isDeleted onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} timeOffRequests={timeOffRequests} isLocked={true} />)}
                  </>
                )}
              </div>
              
              {/* Legend */}
              <div className="mt-2 p-1.5 rounded-lg flex items-center gap-2 flex-wrap text-xs" style={{ backgroundColor: THEME.bg.secondary, zIndex: 1 }}>
                {ROLES.filter(r => r.id !== 'none').map(r => <div key={r.id} className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ backgroundColor: r.color }} /><span style={{ color: THEME.text.secondary }}>{r.fullName}</span></div>)}
                <div className="flex items-center gap-1 ml-auto"><Star size={10} fill={THEME.task} color={THEME.task} /><span style={{ color: THEME.text.secondary }}>Task</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm" style={{ background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(45,45,107,0.7) 2px, rgba(45,45,107,0.7) 4px)` }} /><span style={{ color: THEME.text.secondary }}>Unavailable</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm" style={{ background: `repeating-linear-gradient(-45deg, transparent, transparent 2px, ${THEME.accent.cyan}40 2px, ${THEME.accent.cyan}40 4px)` }} /><span style={{ color: THEME.text.secondary }}>Time Off</span></div>
                {adminContacts.length > 0 && (
                  <>
                    <div className="w-px h-3 mx-1" style={{ backgroundColor: THEME.border.default }} />
                    <span style={{ color: THEME.text.muted }}>Contact:</span>
                    {adminContacts.map(a => (
                      <span key={a.id} className="flex items-center gap-1">
                        <Shield size={10} style={{ color: THEME.accent.purple }} />
                        <span style={{ color: THEME.accent.cyan }}>{a.email}</span>
                      </span>
                    ))}
                  </>
                )}
              </div>
              
              {/* Hidden Staff Section - Inactive employees and hidden admins */}
              {hiddenStaff.length > 0 && (
                <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.subtle}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <UserX size={12} style={{ color: THEME.text.muted }} />
                    <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>Hidden from Schedule ({hiddenStaff.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hiddenStaff.map(emp => (
                      <div key={emp.id} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: emp.isAdmin ? THEME.accent.purple + '30' : THEME.bg.elevated, color: emp.isAdmin ? THEME.accent.purple : THEME.text.muted }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium flex items-center gap-1" style={{ color: THEME.text.primary }}>
                            {emp.name}
                            {emp.isAdmin && <Shield size={8} style={{ color: THEME.accent.purple }} />}
                          </span>
                          <span className="text-xs" style={{ color: THEME.text.muted }}>
                            {!emp.active ? 'Inactive' : 'Hidden Admin'}
                          </span>
                        </div>
                        <button 
                          onClick={() => { setEditingEmp(emp); setEmpFormOpen(true); }}
                          className="p-1 rounded hover:opacity-80"
                          style={{ backgroundColor: THEME.bg.elevated }}
                          title="Edit Employee"
                        >
                          <Edit3 size={10} style={{ color: THEME.text.muted }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Admin's own Time Off Requests - below schedule for consistency with employee view */}
              <div className="mt-3">
                <AdminMyTimeOffPanel 
                  requests={timeOffRequests}
                  currentUserEmail={currentUser?.email}
                  onCancel={cancelTimeOffRequest}
                />
              </div>
            </>
          ) : activeTab === 'comms' ? (
            /* Announcements Panel */
            <div className="rounded-b-xl rounded-tr-xl overflow-visible relative" style={{ borderTop: 'none', zIndex: 1 }}>
              <CommunicationsPanel 
                employees={employees} 
                shifts={shifts} 
                dates={dates} 
                periodInfo={{ startDate, endDate, label: `Week ${weekNum1} & ${weekNum2} • ${formatMonthWord(startDate)} ${startDate.getDate()} – ${formatMonthWord(endDate)} ${endDate.getDate()}, ${startDate.getFullYear()}` }}
                adminContacts={adminContacts}
                announcement={currentAnnouncement}
                onAnnouncementChange={setCurrentAnnouncement}
                onSave={saveAnnouncement}
                onClear={clearAnnouncement}
                isEditMode={isCurrentPeriodEditMode}
                isSaving={savingAnnouncement}
              />
            </div>
          ) : (
            /* Shift Changes Panel */
            <div className="rounded-b-xl rounded-tr-xl overflow-visible relative space-y-3" style={{ borderTop: 'none', zIndex: 1 }}>
              {/* Time Off Requests Section */}
              <CollapsibleSection 
                title="Time Off Requests" 
                icon={Calendar} 
                iconColor={THEME.accent.cyan}
                badge={timeOffRequests.filter(r => r.status === 'pending').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={timeOffRequests.filter(r => r.status === 'pending').length > 0}
              >
                <AdminTimeOffPanel
                  requests={timeOffRequests}
                  onApprove={approveTimeOffRequest}
                  onDeny={denyTimeOffRequest}
                  onRevoke={revokeTimeOffRequest}
                  currentAdminEmail={currentUser?.email}
                />
              </CollapsibleSection>
              
              {/* Take My Shift Section */}
              <CollapsibleSection 
                title="Take My Shift Requests" 
                icon={ArrowRight} 
                iconColor={THEME.accent.pink}
                badge={shiftOffers.filter(o => o.status === 'awaiting_admin').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={shiftOffers.filter(o => o.status === 'awaiting_admin').length > 0}
              >
                <AdminShiftOffersPanel
                  offers={shiftOffers}
                  onApprove={approveShiftOffer}
                  onReject={adminRejectShiftOffer}
                  onRevoke={revokeShiftOffer}
                  currentAdminEmail={currentUser?.email}
                />
              </CollapsibleSection>
              
              {/* Shift Swaps Section */}
              <CollapsibleSection 
                title="Shift Swaps" 
                icon={ArrowRightLeft} 
                iconColor={THEME.accent.purple}
                badge={shiftSwaps.filter(s => s.status === 'awaiting_admin').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={shiftSwaps.filter(s => s.status === 'awaiting_admin').length > 0}
              >
                <AdminShiftSwapsPanel
                  swaps={shiftSwaps}
                  onApprove={approveSwapRequest}
                  onReject={adminRejectSwapRequest}
                  onRevoke={revokeSwapRequest}
                  currentAdminEmail={currentUser?.email}
                />
              </CollapsibleSection>
              
              {/* Admin's own requests */}
              <CollapsibleSection 
                title="My Requests" 
                icon={User} 
                iconColor={THEME.accent.cyan}
                defaultOpen={false}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Time Off</h4>
                    <MyRequestsPanel 
                      requests={timeOffRequests} 
                      currentUserEmail={currentUser.email} 
                      onCancel={cancelTimeOffRequest} 
                    />
                  </div>
                  {shiftOffers.some(o => o.offererEmail === currentUser.email) && (
                    <div>
                      <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Take My Shift</h4>
                      <MyShiftOffersPanel 
                        offers={shiftOffers}
                        currentUserEmail={currentUser.email}
                        onCancel={cancelShiftOffer}
                      />
                    </div>
                  )}
                  {shiftSwaps.some(s => s.initiatorEmail === currentUser.email) && (
                    <div>
                      <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Shift Swaps</h4>
                      <MySwapsPanel 
                        swaps={shiftSwaps}
                        currentUserEmail={currentUser.email}
                        onCancel={cancelSwapRequest}
                      />
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          )}
        </div>
      </main>
      
      <EmployeeFormModal isOpen={empFormOpen} onClose={() => { setEmpFormOpen(false); setEditingEmp(null); }} onSave={saveEmployee} onDelete={deleteEmployee} employee={editingEmp} currentUser={currentUser} showToast={showToast} />
      {editingShift && <ShiftEditorModal isOpen onClose={() => setEditingShift(null)} onSave={saveShift} employee={editingShift.employee} date={editingShift.date} existingShift={editingShift.shift} totalPeriodHours={getEmpHours(editingShift.employee.id)} />}
      <EmailModal isOpen={emailOpen} onClose={() => setEmailOpen(false)} employees={employees} shifts={shifts} dates={dates} periodInfo={{ startDate, endDate }} announcement={currentAnnouncement} onComplete={() => { setPublished(true); setUnsaved(false); }} />
      <InactiveEmployeesPanel isOpen={inactivePanelOpen} onClose={() => setInactivePanelOpen(false)} employees={employees} onReactivate={reactivateEmployee} onDelete={deleteEmployee} />
      <AdminSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} currentUser={currentUser} staffingTargets={staffingTargets} onStaffingTargetsChange={setStaffingTargets} showToast={showToast} />
      {editingColumnDate && (
        <ColumnHeaderEditor
          date={editingColumnDate}
          storeHours={getStoreHoursForDate(editingColumnDate)}
          target={getStaffingTarget(editingColumnDate)}
          storeHoursOverrides={storeHoursOverrides}
          staffingTargetOverrides={staffingTargetOverrides}
          onSave={saveColumnOverrides}
          onClose={() => setEditingColumnDate(null)}
        />
      )}
      
      {/* Admin's own time off request modals */}
      <RequestTimeOffModal 
        isOpen={adminRequestModalOpen} 
        onClose={() => setAdminRequestModalOpen(false)} 
        onSelectType={handleAdminSelectRequestType}
        currentUser={currentUser}
      />
      <RequestDaysOffModal 
        isOpen={adminDaysOffModalOpen} 
        onClose={() => setAdminDaysOffModalOpen(false)} 
        onSubmit={submitTimeOffRequest}
        currentUser={currentUser}
        timeOffRequests={timeOffRequests}
        shiftOffers={shiftOffers}
        shiftSwaps={shiftSwaps}
        shifts={shifts}
      />
      
      {/* Auto-populate confirmation modal */}
      {autoPopulateConfirm && (
        <Modal isOpen onClose={() => setAutoPopulateConfirm(null)} title="Confirm Action" size="sm">
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
              style={{ backgroundColor: autoPopulateConfirm.type.includes('clear') ? THEME.status.error + '20' : THEME.accent.blue + '20' }}>
              {autoPopulateConfirm.type.includes('clear') 
                ? <Trash2 size={24} style={{ color: THEME.status.error }} />
                : <Zap size={24} style={{ color: THEME.accent.blue }} />
              }
            </div>
            
            <p className="text-sm font-medium mb-2" style={{ color: THEME.text.primary }}>
              {autoPopulateConfirm.type === 'populate-all' && 'Auto-Fill All Full-Time Employees?'}
              {autoPopulateConfirm.type === 'populate-week' && `Auto-Fill Week ${autoPopulateConfirm.week} for ${autoPopulateConfirm.employee?.name}?`}
              {autoPopulateConfirm.type === 'clear-week' && `Clear Week ${autoPopulateConfirm.week} for ${autoPopulateConfirm.employee?.name}?`}
              {autoPopulateConfirm.type === 'clear-all' && `Clear All Full-Time Shifts for Week ${autoPopulateConfirm.week}?`}
            </p>
            
            <p className="text-xs mb-4" style={{ color: THEME.text.secondary }}>
              {autoPopulateConfirm.type.includes('populate') 
                ? 'Some shifts already exist and will be preserved. Only empty days will be filled based on availability.'
                : 'This will remove the selected shifts. You can undo by not saving changes.'
              }
            </p>
            
            <div className="flex justify-center gap-2">
              <GradientButton variant="secondary" small onClick={() => setAutoPopulateConfirm(null)}>
                Cancel
              </GradientButton>
              <GradientButton 
                small 
                danger={autoPopulateConfirm.type.includes('clear')}
                onClick={handleAutoPopulateConfirm}
              >
                {autoPopulateConfirm.type.includes('clear') ? 'Clear Shifts' : 'Auto-Fill'}
              </GradientButton>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Toast Notification - fixed position at top center, ABOVE modals */}
      {toast && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-xl flex items-center gap-2"
          style={{ 
            backgroundColor: toast.type === 'success' ? THEME.status.success 
              : toast.type === 'warning' ? THEME.status.warning
              : toast.type === 'saving' ? THEME.accent.blue
              : THEME.status.error,
            color: '#fff',
            minWidth: 200,
            textAlign: 'center',
            zIndex: 100001  // Above modal's z-[100] and tooltips
          }}
        >
          {toast.type === 'saving' ? <Loader size={16} className="animate-spin" /> 
            : toast.type === 'success' ? <Check size={16} /> 
            : <AlertCircle size={16} />}
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.type !== 'saving' && (
            <button 
              onClick={() => setToast(null)} 
              className="ml-2 hover:opacity-70"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      
      {/* Employee Tooltip - rendered at top level to escape stacking contexts */}
      {tooltipData && (
        <div className="fixed p-2.5 rounded-lg shadow-2xl" style={{ top: tooltipData.pos.top, left: tooltipData.pos.left, width: 240, backgroundColor: THEME.tooltip.bg, border: `1px solid ${THEME.tooltip.border}`, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)', zIndex: 99999 }}>
          <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: tooltipData.isDeleted ? THEME.bg.elevated : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: tooltipData.isDeleted ? THEME.text.muted : 'white' }}>{tooltipData.employee.name.charAt(0)}</div>
            <div className="flex-1">
              <p className="font-semibold text-xs flex items-center gap-1" style={{ color: THEME.text.primary }}>
                {tooltipData.employee.name} 
                {tooltipData.employee.isAdmin && <Shield size={10} style={{ color: THEME.accent.purple }} />}
                {tooltipData.isDeleted && <span style={{ color: THEME.text.muted }}>(Former)</span>}
              </p>
              <p className="text-xs font-bold" style={{ color: tooltipData.hours >= 40 ? THEME.status.error : tooltipData.hours >= 35 ? THEME.status.warning : THEME.accent.cyan }}>{tooltipData.hours.toFixed(1)}h</p>
            </div>
          </div>
          <div className="space-y-0.5 text-xs mb-2">
            <div className="flex items-center gap-1" style={{ color: THEME.text.secondary }}><Mail size={10} />{tooltipData.employee.email}</div>
            {tooltipData.employee.phone && <div className="flex items-center gap-1" style={{ color: THEME.text.secondary }}><Phone size={10} />{tooltipData.employee.phone}</div>}
            {tooltipData.employee.isAdmin && <div className="flex items-center gap-1" style={{ color: THEME.accent.purple }}><Shield size={10} />Admin Access</div>}
          </div>
          {!tooltipData.isDeleted && (
            <div className="pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: THEME.text.muted }}>AVAILABILITY</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0">
                {days.map(d => {
                  const av = tooltipData.employee.availability[d];
                  return <div key={d} className="flex justify-between text-xs"><span style={{ color: av.available ? THEME.text.primary : THEME.text.muted }}>{d.slice(0,3)}</span>{av.available ? <span style={{ color: THEME.accent.cyan }}>{formatTimeShort(av.start)}-{formatTimeShort(av.end)}</span> : <span style={{ color: THEME.text.muted }}>—</span>}</div>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
