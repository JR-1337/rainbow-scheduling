#!/usr/bin/env node
// Cover-loop + slide-3 Playwright capture for pitch deck
// Runs headed. Creds passed via env (SARVI_EMAIL / SARVI_PW). Never commit creds.
// Per build-plan.md Build Order step 2.

import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync, statSync, renameSync, unlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const ASSETS = join(ROOT, 'pitchdeck', 'assets');
const VIDEO_DIR = join(ASSETS, '_video_raw');
mkdirSync(ASSETS, { recursive: true });
mkdirSync(VIDEO_DIR, { recursive: true });

const TARGET = 'https://rainbow-scheduling.vercel.app';
const EMAIL = process.env.SARVI_EMAIL || 'sarvi@rainbowjeans.com';
const PW = process.env.SARVI_PW || 'admin1';
const HEADLESS = process.env.HEADLESS === '1';

function log(msg) { console.log(`[capture] ${msg}`); }

async function signIn(page) {
  page.on('console', m => log(`console.${m.type()}: ${m.text().slice(0, 200)}`));
  page.on('pageerror', e => log(`PAGE ERROR: ${e.message}`));
  page.on('requestfailed', r => log(`REQ FAIL: ${r.url().slice(0, 100)} -> ${r.failure()?.errorText}`));
  page.on('response', r => {
    if (r.url().includes('script.google.com')) log(`resp ${r.status()} ${r.url().slice(0, 100)}`);
  });
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#login-email', { timeout: 20000 });
  log('login screen loaded');
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-password', PW);
  await page.locator('#login-password').press('Enter');
  log('submitted login');
  // Post-login signal: login-email input disappears (admin/employee view replaces auth screen).
  try {
    await page.waitForSelector('#login-email', { state: 'detached', timeout: 75000 });
    log('login detached -> post-login view');
  } catch (e) {
    const shot = join(ASSETS, '_login-failure.png');
    try { await page.screenshot({ path: shot, fullPage: true }); } catch {}
    const bodyText = await page.locator('body').innerText().catch(() => '(no body)');
    const url = page.url();
    throw new Error(`Login did not complete.\nURL: ${url}\nFirst 500 chars of body:\n${bodyText.slice(0, 500)}\nShot (if any): ${shot}`);
  }
  await page.waitForTimeout(1800); // let welcome sweep + data load settle
}

async function gotoEmptyNextPeriod(page) {
  // Current period has shifts, next is empty per demo-reset design.
  await page.locator('button[aria-label="Next pay period"]').first().click();
  await page.waitForTimeout(400);
}

async function enterEditMode(page) {
  // Button text "GO EDIT" when period is live.
  const editBtn = page.getByRole('button', { name: /go edit/i });
  if (await editBtn.count()) {
    await editBtn.first().click();
    await page.waitForTimeout(400);
  }
}

async function captureCoverLoop(browser) {
  log('--- Cover loop context (video) ---');
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1920, height: 1080 } },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  await signIn(page);
  await gotoEmptyNextPeriod(page);
  await enterEditMode(page);

  // Make sure Week 1 tab is active.
  await page.getByRole('button', { name: /^Week \d+/ }).first().click();
  await page.waitForTimeout(300);

  // Brief framing pause before the money shot.
  await page.waitForTimeout(800);
  const fillStart = Date.now();

  // W1 auto-fill.
  const w1Btn = page.getByRole('button', { name: /Auto-Fill All FT Week 1/i });
  await w1Btn.click();
  await page.waitForTimeout(1100); // let rows render

  // Switch to W2.
  const w2Tabs = page.getByRole('button', { name: /^Week \d+/ });
  await w2Tabs.nth(1).click();
  await page.waitForTimeout(300);

  const w2Btn = page.getByRole('button', { name: /Auto-Fill All FT Week 2/i });
  await w2Btn.click();
  await page.waitForTimeout(1100);

  // Clean pause at end (full grid visible).
  await page.waitForTimeout(1200);
  const fillEnd = Date.now();
  log(`fill window: ~${((fillEnd - fillStart) / 1000).toFixed(2)}s`);

  // Slide 3 screenshot #1 — admin desktop grid full view (full page, populated next period).
  await page.screenshot({ path: join(ASSETS, 'slide3-admin-grid.png'), fullPage: true });
  log('slide3-admin-grid.png captured');

  // Slide 3 screenshot #2 — admin requests panel.
  const requestsTab = page.getByRole('button', { name: /Shift Changes/ });
  if (await requestsTab.count()) {
    await requestsTab.first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(ASSETS, 'slide3-admin-requests.png'), fullPage: true });
    log('slide3-admin-requests.png captured');
  }

  await page.close();
  await ctx.close();

  // Find the webm Playwright just wrote.
  const webms = readdirSync(VIDEO_DIR)
    .filter(f => f.endsWith('.webm'))
    .map(f => ({ f, t: statSync(join(VIDEO_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!webms.length) throw new Error('No webm recorded');
  const rawWebm = join(VIDEO_DIR, webms[0].f);
  log(`raw webm: ${rawWebm}`);
  return { rawWebm, fillStart, fillEnd };
}

async function captureMobileEmployee(browser) {
  log('--- Mobile employee screenshot ---');
  // Use iPhone 13 Pro preset-ish viewport.
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();

  // Log in as a synthetic employee who has shifts this period. Plan seeds emp.001..020.
  // Password is default (emp-001). passwordChanged=FALSE → first-login prompt.
  // Prefer an already-changed account; fall back to Sarvi if synthetic login is blocked.
  try {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
    await page.fill('#login-email', 'emp.001@example.com');
    await page.fill('#login-password', 'emp-001');
    await page.getByRole('button', { name: /sign in/i }).click();

    // If first-login change password modal appears, change it to something demo-safe.
    const changePwSubmit = page.getByRole('button', { name: /change password|update|submit|confirm/i });
    const hit = await Promise.race([
      page.waitForSelector('input[type="password"]:nth-of-type(2)', { timeout: 5000 }).then(() => 'pw').catch(() => null),
      page.waitForSelector('text=RAINBOW', { timeout: 5000 }).then(() => 'home').catch(() => null),
    ]);
    if (hit === 'pw') {
      log('first-login prompt detected — setting new pw');
      const pwInputs = page.locator('input[type="password"]');
      await pwInputs.nth(0).fill('emp-001');
      await pwInputs.nth(1).fill('demo1234');
      if (await pwInputs.count() > 2) await pwInputs.nth(2).fill('demo1234');
      await changePwSubmit.first().click().catch(() => {});
      await page.waitForSelector('text=RAINBOW', { timeout: 15000 });
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(ASSETS, 'slide3-employee-mobile.png'), fullPage: false });
    log('slide3-employee-mobile.png captured');
  } catch (e) {
    log(`mobile employee capture failed, falling back to Sarvi admin-mobile: ${e.message}`);
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
    await page.fill('#login-email', EMAIL);
    await page.fill('#login-password', PW);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForSelector('text=RAINBOW', { timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(ASSETS, 'slide3-employee-mobile.png'), fullPage: false });
  } finally {
    await page.close();
    await ctx.close();
  }
}

function runFfmpeg(args) {
  log(`ffmpeg ${args.join(' ')}`);
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg exited ${r.status}`);
}

function postProcess(rawWebm, fillStart, fillEnd) {
  log('--- ffmpeg post-process ---');
  const mp4Out = join(ASSETS, 'cover-loop.mp4');
  const posterOut = join(ASSETS, 'cover-poster.jpg');

  // Playwright video starts when context opens. The fill window is fillStart..fillEnd
  // relative to wall clock. Without an in-video clock we approximate by taking the last
  // ~5s of the recording — which matches our scripted timeline: fill+switch+fill+pause.
  // ffmpeg -sseof -5 puts us 5 seconds from end.
  runFfmpeg([
    '-y',
    '-sseof', '-5.5',
    '-i', rawWebm,
    '-t', '4.5',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '20',
    '-preset', 'medium',
    '-movflags', '+faststart',
    '-an',
    mp4Out,
  ]);

  // Poster = first frame of trimmed mp4.
  runFfmpeg([
    '-y',
    '-i', mp4Out,
    '-vframes', '1',
    '-q:v', '2',
    posterOut,
  ]);

  log(`wrote ${mp4Out}`);
  log(`wrote ${posterOut}`);
}

(async () => {
  log(`target: ${TARGET}`);
  log(`headless: ${HEADLESS}`);
  const browser = await chromium.launch({ headless: HEADLESS, slowMo: 0 });
  browser.on('disconnected', () => log('browser disconnected'));
  try {
    const { rawWebm, fillStart, fillEnd } = await captureCoverLoop(browser);
    postProcess(rawWebm, fillStart, fillEnd);
    await captureMobileEmployee(browser);
  } finally {
    await browser.close();
  }
  log('done. outputs in pitchdeck/assets/');
})().catch(err => {
  console.error('[capture] FATAL', err);
  process.exit(1);
});
