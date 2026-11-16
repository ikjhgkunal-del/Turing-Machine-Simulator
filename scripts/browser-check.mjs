import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright';

// End-to-end checks against the actual production build, using installed Chrome
// when available. No browser download or service is required for the application.
const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
const chromePath = process.env.ENIGMA_BROWSER_PATH || (process.platform === 'win32' && existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
let browser;
const report = [];
try {
  browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  const externalRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  await mkdir('artifacts', { recursive: true });
  const button = (name) => page.getByRole('button', { name, exact: true });
  const status = () => page.getByRole('status');
  const count = () => page.getByTestId('step-count');
  async function waitStatus(expected, timeout = 5000) {
    await page.waitForFunction((value) => document.querySelector('[role="status"]')?.textContent === value, expected, { timeout });
  }
  async function check(name, action) {
    await action(); report.push({ check: name, result: 'PASS' }); console.log(`PASS ${name}`);
  }
  async function load(input) { await page.getByRole('textbox', { name: 'Input tape', exact: true }).fill(input); await button('Load input').click(); }
  async function preset(id) { await page.getByLabel('Machine preset').selectOption(id); }
  async function noOverflow() {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'Page has horizontal overflow');
  }

  await page.goto('http://127.0.0.1:4173');
  await check('Home: live navigation, original artwork, case-file dialog, keyboard Escape', async () => {
    assert.match(await page.title(), /Project Enigma/);
    await button('Begin investigation A SHORT STORY IN FOUR SCENES').waitFor();
    await page.screenshot({ path: 'artifacts/home-desktop.png', fullPage: true });
    await page.getByRole('button', { name: /Case file THE MISSION/ }).click();
    assert.equal(await page.getByRole('dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    await noOverflow();
  });
  await check('Story: four scenes, Back, Next and Enter laboratory', async () => {
    await page.getByRole('button', { name: /Begin investigation/ }).click();
    assert.match(await page.locator('h1').textContent(), /The Intercept/);
    await button('Next').click();
    assert.match(await page.locator('h1').textContent(), /The Enigma/);
    await button('Back').click();
    assert.match(await page.locator('h1').textContent(), /The Intercept/);
    await button('Next').click(); await button('Next').click();
    await page.screenshot({ path: 'artifacts/story-desktop.png', fullPage: true });
    await button('Next').click();
    assert.match(await page.locator('.dialogue-text').textContent(), /Bombe is not a Turing machine/);
    await button('Enter laboratory').click();
    await waitStatus('Ready');
  });
  await check('Direct laboratory access and Story Skip', async () => {
    await button('Home').click();
    await page.getByRole('button', { name: /Turing Machine Laboratory GO STRAIGHT/ }).click();
    await waitStatus('Ready');
    await button('Home').click();
    await page.getByRole('button', { name: /Begin investigation/ }).click();
    await button('Skip to laboratory').click();
    await waitStatus('Ready');
  });
  await check('Step: one transition, moving head, current state, graph and trace', async () => {
    await page.screenshot({ path: 'artifacts/lab-desktop.png', fullPage: true });
    await button('Step').click();
    assert.equal(await count().textContent(), '001');
    assert.equal(await page.getByTestId('current-state').textContent(), 'qLast1');
    assert.match(await page.locator('.tape-caption').textContent(), /Cell 1/);
    assert.equal(await page.locator('.graph-node.current').count(), 1);
    assert.equal(await page.locator('.trace-table tbody tr').count(), 1);
  });
  await check('Run accepts 101; halting controls cannot add transitions', async () => {
    await page.getByLabel('Execution speed').selectOption('10');
    await button('Run').click(); await waitStatus('Accepted');
    assert.equal(await count().textContent(), '004');
    assert.equal(await button('Step').isDisabled(), true);
    assert.equal(await button('Run').isDisabled(), true);
  });
  await check('Results preserve machine and record; Reset & retry restores input, state and trace', async () => {
    await button('Review results').click();
    assert.match(await page.locator('h1').textContent(), /Accepted/);
    assert.equal(await page.locator('.trace-table tbody tr').count(), 4);
    await page.screenshot({ path: 'artifacts/results-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Back to lab', exact: true }).first().click();
    assert.equal(await count().textContent(), '004');
    await button('Review results').click(); await button('Reset & retry').click();
    await waitStatus('Ready');
    assert.equal(await count().textContent(), '000');
    assert.equal(await page.getByTestId('current-state').textContent(), 'qStart');
  });
  await check('Binary rejection and empty input', async () => {
    await load('100'); await button('Run').click(); await waitStatus('Rejected');
    await load(''); await button('Step').click(); await waitStatus('Rejected');
    assert.equal(await count().textContent(), '001');
  });
  await check('Invalid input explains offending symbol and blocks execution', async () => {
    await load('10X'); await waitStatus('Error');
    assert.match(await page.locator('#input-feedback').textContent(), /Input contains ‘X’/);
    assert.equal(await button('Run').isDisabled(), true);
    await load('101'); await waitStatus('Ready');
  });
  await check('Crib preset: DDSDD rejects; DDDDD and empty input accept', async () => {
    await preset('crib-alignment'); await load('DDSDD');
    await button('Run').click(); await waitStatus('Rejected');
    await load('DDDDD'); await button('Run').click(); await waitStatus('Accepted');
    await load(''); await button('Step').click(); await waitStatus('Accepted');
    assert.match(await page.locator('.experiment-description').textContent(), /D means/);
  });
  await check('Editing and applying a rule changes the actual verdict', async () => {
    await preset('binary-ends-1');
    await page.getByLabel('Rule 9 to', { exact: true }).selectOption('qReject');
    assert.equal(await button('Run').isDisabled(), true);
    await button('Apply definition').click();
    await button('Run').click(); await waitStatus('Rejected');
  });
  await check('Duplicate transition validation, add and delete rules', async () => {
    await preset('binary-ends-1');
    await button('Add transition').click(); await button('Apply definition').click();
    await waitStatus('Error');
    assert.match(await page.getByRole('alert').textContent(), /Two rules are defined/);
    await button('Delete rule 10').click(); await button('Apply definition').click(); await waitStatus('Ready');
  });
  await check('Editable state list: add and remove a state', async () => {
    const field = page.getByLabel('States · Q', { exact: true });
    const original = await field.inputValue();
    await field.fill(`${original}, qNew`); await button('Apply definition').click(); await waitStatus('Ready');
    assert.equal(await page.locator('.state-chips span').count(), 6);
    await field.fill(original); await button('Apply definition').click(); await waitStatus('Ready');
    assert.equal(await page.locator('.graph-node').count(), 5);
  });
  await check('Missing rule is a halt, not rejection; results retain that distinction', async () => {
    await button('Delete rule 2').click(); await button('Apply definition').click();
    await button('Step').click(); await waitStatus('Halted (no transition)');
    assert.equal(await count().textContent(), '000');
    await button('Review results').click();
    assert.match(await page.locator('h1').textContent(), /Halted \(no transition\)/);
    await page.getByRole('button', { name: 'Back to lab', exact: true }).first().click();
  });
  await check('Left move, blank read and symbol write are visible at negative cell indices', async () => {
    await preset('crib-alignment');
    await page.getByLabel('Rule 1 move', { exact: true }).selectOption('L');
    await page.getByLabel('Rule 3 write', { exact: true }).selectOption('D');
    await button('Apply definition').click(); await load('D');
    await button('Step').click();
    assert.match(await page.locator('.tape-caption').textContent(), /Cell -1/);
    await button('Step').click(); await waitStatus('Accepted');
    await button('Review results').click();
    assert.match(await page.locator('.result-stats').textContent(), /DD/);
    await button('Reset & retry').click();
  });
  await check('Pause cancels timers; Reset and navigation cannot execute stale steps', async () => {
    await preset('binary-ends-1'); await load('1'.repeat(50));
    await page.getByLabel('Execution speed').selectOption('100');
    await button('Run').click();
    await page.waitForFunction(() => Number(document.querySelector('[data-testid="step-count"]').textContent) >= 2);
    await button('Pause').click();
    const pausedAt = await count().textContent();
    await page.waitForTimeout(300);
    assert.equal(await count().textContent(), pausedAt);
    await button('Run').click(); await button('Reset tape').click();
    await page.waitForTimeout(250); assert.equal(await count().textContent(), '000');
    await button('Run').click(); await button('Home').click(); await page.waitForTimeout(250);
    await page.getByRole('button', { name: /Turing Machine Laboratory GO STRAIGHT/ }).click();
    const resumed = await count().textContent(); await page.waitForTimeout(250);
    assert.equal(await count().textContent(), resumed);
    await button('Reset tape').click();
  });
  await check('Automatic looping machine stops at 1,000; limit results are distinct from rejection', async () => {
    await preset('crib-alignment');
    await page.getByLabel('Rule 3 to', { exact: true }).selectOption('qScan');
    await page.getByLabel('Rule 3 move', { exact: true }).selectOption('L');
    await button('Apply definition').click(); await load('');
    await page.getByLabel('Execution speed').selectOption('10');
    await button('Run').click(); await waitStatus('Step limit reached', 60000);
    assert.equal(await count().textContent(), '1000');
    assert.match(await page.locator('.tape-caption').textContent(), /Cell -1000/);
    assert.equal(await button('Run').isDisabled(), true);
    await button('Review results').click();
    assert.match(await page.locator('h1').textContent(), /Step limit reached/);
    await button('Reset & retry').click();
  });
  await check('Field guide: accessible dialog and keyboard focus containment', async () => {
    await button('Field guide').click();
    assert.equal(await page.getByRole('dialog').isVisible(), true);
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
  });
  await check('Laptop, tablet and mobile layouts remain readable without page overflow', async () => {
    await preset('binary-ends-1');
    for (const viewport of [{ width: 1100, height: 800 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport); await noOverflow();
      await button('Step').click();
      assert.equal(await button('Step').isVisible(), true);
      await button('Reset tape').click();
    }
    await page.screenshot({ path: 'artifacts/lab-mobile.png', fullPage: true });
    await button('Home').click(); await noOverflow();
    await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
    await page.getByRole('button', { name: /Begin investigation/ }).click(); await noOverflow();
    await page.screenshot({ path: 'artifacts/story-mobile.png', fullPage: true });
  });
  await check('No browser errors or external runtime network requests', async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(externalRequests, []);
  });
  await writeFile('artifacts/browser-report.json', JSON.stringify({ checkedAt: new Date().toISOString(), checks: report }, null, 2));
  console.log(`\n${report.length} browser checks passed. Screenshots and report: artifacts/`);
} catch (error) {
  if (browser) {
    const page = browser.contexts()[0]?.pages()[0];
    await page?.screenshot({ path: 'artifacts/browser-failure.png', fullPage: true }).catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
