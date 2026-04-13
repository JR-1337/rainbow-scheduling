// ═══════════════════════════════════════════════════════════════════════════════
// DEMO DATA RESET — run ONCE before pitch meeting 2026-04-14
// ═══════════════════════════════════════════════════════════════════════════════
//
// Paste this file as a new script file in the same Apps Script project as Code.gs
// (it reuses CONFIG, getSpreadsheet, hashPassword_, generateSalt_ from Code.gs).
// Then run seedDemoData() once from the Apps Script editor. Output logs roster
// + shift counts. Idempotent: re-running clears + re-seeds from scratch.
//
// ═══════════════════════════════════════════════════════════════════════════════

function seedDemoData() {
  const ss = getSpreadsheet();
  const log = [];

  // ── 1. Clear tabs (keep header rows) ──────────────────────────────────────────
  ['Employees', 'Shifts', 'ShiftChanges', 'Announcements'].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) { log.push('SKIP ' + name + ' (not found)'); return; }
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).clearContent();
    }
    log.push('CLEARED ' + name);
  });

  // ── 2. Seed Employees ─────────────────────────────────────────────────────────
  const empSheet = ss.getSheetByName('Employees');
  const roster = buildRoster_();
  const rows = roster.map(e => employeeToRow_(e));
  empSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  log.push('SEEDED ' + rows.length + ' employees');

  // ── 3. Seed Shifts for current pay period (next period stays empty) ─────────
  const shifts = buildDemoShifts_(roster.filter(e => e.showOnSchedule && !e.isOwner));
  if (shifts.length) {
    const shiftSheet = ss.getSheetByName('Shifts');
    const shiftRows = shifts.map(s => [s.id, s.employeeId, s.employeeName, s.employeeEmail, s.date, s.startTime, s.endTime, s.role, s.task]);
    shiftSheet.getRange(2, 1, shiftRows.length, shiftRows[0].length).setValues(shiftRows);
  }
  log.push('SEEDED ' + shifts.length + ' shifts in current pay period (next period left empty for Playwright capture)');

  Logger.log(log.join('\n'));
  return log.join('\n');
}

// ─── Roster builder ─────────────────────────────────────────────────────────────

function buildRoster_() {
  const people = [];

  // Admins / owners (off-grid except Sarvi)
  people.push({ id: 1,  name: 'JR',          email: 'johnrichmond007@gmail.com', password: 'admin1', isAdmin: true, isOwner: true,  showOnSchedule: false, hashed: true,  passwordChanged: true,  employmentType: '',          role: 'none' });
  people.push({ id: 2,  name: 'Sarvi',       email: 'sarvi@rainbowjeans.com',    password: 'admin1', isAdmin: true, isOwner: false, showOnSchedule: true,  hashed: true,  passwordChanged: true,  employmentType: 'full-time', role: 'cashier' });
  people.push({ id: 3,  name: 'Dan Carman',  email: 'dan@rainbowjeans.com',      password: 'daniel', isAdmin: true, isOwner: false, showOnSchedule: false, hashed: true,  passwordChanged: true,  employmentType: '',          role: 'none' });
  people.push({ id: 4,  name: 'Scott',       email: 'scott@rainbowjeans.com',    password: 'scott',  isAdmin: true, isOwner: false, showOnSchedule: false, hashed: true,  passwordChanged: true,  employmentType: '',          role: 'none' });

  // 20 synthetics (on-grid, default emp-XXX passwords, plaintext until first login)
  const firstNames = ['Alex','Blake','Casey','Dana','Ellis','Finley','Gray','Harper','Indigo','Jules','Kai','Logan','Morgan','Nico','Parker','Quinn','Riley','Sage','Taylor','Val'];
  const lastNames  = ['Kim','Patel','Nguyen','Singh','Ortiz','Chen','Silva','Ahmed','Reyes','Park','Cohen','Diaz','Kaur','Lee','Mendez','Oduya','Ramos','Sato','Torres','Wu'];
  const roles     = ['cashier','backupCashier','mens','womens','floorMonitor'];
  const empTypes  = ['full-time','part-time'];

  for (let i = 0; i < 20; i++) {
    const num = String(i + 1).padStart(3, '0'); // 001..020
    const id = 100 + i + 1; // 101..120
    people.push({
      id: id,
      name: firstNames[i] + ' ' + lastNames[i],
      email: 'emp.' + num + '@example.com',
      password: 'emp-' + num,
      isAdmin: false, isOwner: false, showOnSchedule: true,
      hashed: false, passwordChanged: false,
      employmentType: empTypes[i % 2],
      role: roles[i % roles.length]
    });
  }

  return people;
}

// ─── Employee -> row (19 or 20 cols depending on whether Column T exists) ───────

function employeeToRow_(e) {
  let hash = '', salt = '';
  if (e.hashed) {
    salt = generateSalt_();
    hash = hashPassword_(salt, e.password);
  }
  const plaintext = e.hashed ? '' : e.password;

  // 20 columns: A id, B name, C email, D password, E phone, F address, G dob,
  // H active, I isAdmin, J isOwner, K showOnSchedule, L deleted,
  // M availability, N counterPointId, O adpNumber, P rateOfPay, Q employmentType,
  // R passwordHash, S passwordSalt, T passwordChanged
  return [
    e.id,
    e.name,
    e.email,
    plaintext,
    '',
    '',
    '',
    true,
    e.isAdmin,
    e.isOwner,
    e.showOnSchedule,
    false,
    '',
    '',
    '',
    '',
    e.employmentType,
    hash,
    salt,
    e.passwordChanged ? 'TRUE' : 'FALSE'
  ];
}

// ─── Shift generation for current pay period ────────────────────────────────────

function buildDemoShifts_(scheduleableEmployees) {
  // PAY_PERIOD_START = 2026-01-26 (Mon). Period = 14 days. Find current.
  const start = new Date(2026, 0, 26);
  const now = new Date();
  const msPerDay = 86400000;
  const daysSinceStart = Math.floor((now - start) / msPerDay);
  const currentPeriodIndex = Math.floor(daysSinceStart / 14);
  const periodStart = new Date(start.getTime() + currentPeriodIndex * 14 * msPerDay);

  // Shift time patterns (realistic retail)
  const shiftPatterns = [
    { start: '10:00', end: '14:00' },  // 4h mid
    { start: '10:00', end: '18:00' },  // 8h open
    { start: '12:00', end: '20:00' },  // 8h mid
    { start: '14:00', end: '21:00' },  // 7h close
    { start: '11:00', end: '17:00' },  // 6h midday
    { start: '09:30', end: '13:30' }   // 4h morning
  ];

  const shifts = [];
  let shiftId = 1;

  scheduleableEmployees.forEach((emp, empIdx) => {
    // Full-time ~ 5 shifts/period, part-time ~ 3
    const numShifts = emp.employmentType === 'full-time' ? 5 : 3;
    const usedDays = new Set();
    let attempts = 0;

    while (usedDays.size < numShifts && attempts < 30) {
      attempts++;
      const dayOffset = (empIdx * 3 + usedDays.size * 2 + attempts) % 14;
      if (usedDays.has(dayOffset)) continue;
      usedDays.add(dayOffset);

      const shiftDate = new Date(periodStart.getTime() + dayOffset * msPerDay);
      const dateStr = Utilities.formatDate(shiftDate, 'America/Toronto', 'yyyy-MM-dd');
      const pattern = shiftPatterns[(empIdx + dayOffset) % shiftPatterns.length];

      shifts.push({
        id: 'shift-' + shiftId++,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeEmail: emp.email,
        date: dateStr,
        startTime: pattern.start,
        endTime: pattern.end,
        role: emp.role,
        task: ''
      });
    }
  });

  return shifts;
}
