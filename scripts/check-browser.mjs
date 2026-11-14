// Optional browser QA. Install Playwright separately; the app itself has no dependencies.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [], failedAssets = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(process.env.TEST_URL || 'http://127.0.0.1:5173/CHIRent/') && r.status() >= 400) failedAssets.push(`${r.status()} ${r.url()}`); });
  const checkText = async (id, text) => {
    await page.waitForFunction(({ id, text }) => document.getElementById(id)?.textContent === text, { id, text });
  };
  const checkVisualSystem = async () => {
    const audit = await page.evaluate(() => {
      const visible = element => element.getClientRects().length > 0;
      const elements = [...document.querySelectorAll('h1,h2,h3,input,select,button,.brand,.footer-brand')].filter(visible);
      const headings = [...document.querySelectorAll('h1,h2,h3,.brand,.footer-brand')].filter(visible);
      const surfaces = [...document.querySelectorAll('body,.sidebar,.topbar,.card,.login-page,.login-story,.login-form-side,.quantum-intro,.source-banner')].filter(visible);
      return {
        fonts: [...new Set(elements.map(element => getComputedStyle(element).fontFamily))],
        punctuatedHeadings: headings.map(element => element.textContent.trim()).filter(text => /[.!?,;:]$/.test(text)),
        tintedSurfaces: surfaces.filter(element => getComputedStyle(element).backgroundColor !== 'rgb(255, 255, 255)').map(element => element.className),
        overflow: document.documentElement.scrollWidth > innerWidth
      };
    });
    assert.equal(audit.fonts.length, 1, 'All headings and controls must use the shared font');
    assert.deepEqual(audit.punctuatedHeadings, [], 'Headings and branding must have no terminal punctuation');
    assert.deepEqual(audit.tintedSurfaces, [], 'Page and panel surfaces must be white');
    assert.equal(audit.overflow, false, 'The view must fit the viewport');
  };
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/CHIRent/');
  await page.waitForSelector('#login-page');
  await checkVisualSystem();
  await page.screenshot({ path: '/tmp/chirent-login-desktop.png', fullPage: true });
  assert.equal(await page.locator('#authenticated-app').isVisible(), false);
  await page.locator('#username').fill('admin'); await page.locator('#password').fill('wrong');
  await page.locator('#login-submit').click();
  assert.equal(await page.locator('#login-error').isVisible(), true);
  await page.locator('#password').fill('admin'); await page.locator('#toggle-password').click();
  assert.equal(await page.locator('#password').getAttribute('type'), 'text');
  await page.locator('#login-submit').click();
  await page.waitForSelector('#map path');
  assert.equal(await page.locator('#map path').count(), 77);
  await checkVisualSystem();
  await checkText('payment', '$900'); await checkText('burden', '30.0%'); await checkText('budget', '$6,000,000');
  await page.click('#before'); await checkText('payment', '$1,400'); await checkText('burden', '46.7%');
  await page.click('#after'); await checkText('payment', '$900');
  await page.locator('[data-policy=ceiling]').click(); await checkText('payment', '$1,100');
  assert.equal(await page.locator('#legal-note').isVisible(), true);
  await page.locator('[data-policy=current]').click(); await checkText('payment', '$1,400');
  await page.locator('[data-policy=assistance]').click();
  await page.locator('[data-view=quantum]').click(); await checkText('payment', '$1,040'); await checkText('burden', '34.7%');
  await checkVisualSystem();
  await page.screenshot({ path: '/tmp/chirent-quantum-desktop.png', fullPage: true });
  await page.reload(); await page.waitForSelector('#map path');
  assert.equal(await page.locator('#login-page').isVisible(), false); await checkText('payment', '$1,040');
  await page.locator('[data-view=sources]').click(); await page.waitForSelector('#sources-view');
  await checkVisualSystem();
  await page.screenshot({ path: '/tmp/chirent-sources-desktop.png', fullPage: true });
  await page.goBack(); await page.waitForSelector('#quantum-intro');
  await page.locator('#community').selectOption('Hyde Park'); await checkText('selected-name', 'Hyde Park');
  await page.locator('#map path[aria-label^="Woodlawn:"]').press('Enter'); await checkText('selected-name', 'Woodlawn');
  await page.locator('#income').fill('0'); assert.equal(await page.locator('#input-error').isVisible(), true);
  await page.click('#reset'); await checkText('payment', '$900');
  const downloadPromise = page.waitForEvent('download'); await page.click('#export');
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'ChiRent-South-Shore-assistance.csv');
  await page.locator('#households').fill('0'); await checkText('budget', '$0');
  await page.locator('#subsidy').fill('2000'); await checkText('payment', '$0');
  await page.click('#reset'); await page.locator('#income').fill('500');
  await checkText('pie-note', '$400 exceeds income — ring capped at 100%');
  await page.click('#reset'); await page.waitForTimeout(100);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/chirent-workspace-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile workspace must not overflow');
  await checkVisualSystem();
  await page.screenshot({ path: '/tmp/chirent-workspace-mobile.png', fullPage: true });
  await page.locator('[data-view=quantum]').click(); await page.waitForSelector('#quantum-intro'); await checkVisualSystem();
  await page.locator('[data-view=sources]').click(); await page.waitForSelector('#sources-view'); await checkVisualSystem();
  await page.locator('.account-menu summary').click(); await page.click('#logout');
  await page.waitForSelector('#login-page');
  await page.reload(); await page.waitForSelector('#login-page');
  assert.equal(await page.locator('#authenticated-app').isVisible(), false);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile login must not overflow');
  await checkVisualSystem();
  await page.screenshot({ path: '/tmp/chirent-login-mobile.png', fullPage: true });
  await page.locator('#username').fill('admin'); await page.locator('#password').fill('admin'); await page.click('#login-submit');
  await page.waitForSelector('#map path'); await checkText('payment', '$900');
  assert.deepEqual(errors, []); assert.deepEqual(failedAssets, []);
  console.log('PASS: login, rejection, password visibility, reload session, sign out, Pages asset paths, 77 map areas, policies, before/after, quantum, browser navigation, keyboard selection, validation, export, budgets, desktop/mobile layouts; no browser errors or failed local assets.');
} finally { await browser.close(); }
