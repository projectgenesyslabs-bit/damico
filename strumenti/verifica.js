// Prova automatica del sito.
// Uso: node strumenti/verifica.js [indirizzo] [cartella-screenshot]
// Esempio: node strumenti/verifica.js http://localhost:8090 ./screenshot
// Richiede Playwright con Chromium (nelle sessioni cloud di Claude c'è già).
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.argv[2] || 'http://localhost:8090';
const OUT = process.argv[3] || './screenshot';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  // SwiftShader: WebGL anche senza scheda grafica
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let problemi = 0;

  for (const [nome, w, h] of [['desktop', 1440, 900], ['mobile', 375, 812]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: nome === 'mobile' });
    const page = await ctx.newPage();
    const log = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => log.push(`errore: ${e.message}`));

    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(6500); // fine dell'ingresso

    const pos = await page.evaluate(() => {
      const m = document.querySelector('.mestieri');
      const span = m.offsetHeight - innerHeight;
      return {
        apertura: 0,
        diamante: document.querySelector('.hero').offsetHeight * 0.45,
        gioielli: m.offsetTop + 2,
        orologi: m.offsetTop + span * 0.5,
        piercing: m.offsetTop + span,
        visita: document.querySelector('.visita').offsetTop + innerHeight * 0.4,
        piede: document.documentElement.scrollHeight
      };
    });
    for (const [sezione, y] of Object.entries(pos)) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${OUT}/${nome}-${sezione}.png` });
    }

    if (nome === 'mobile') {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      await page.click('.nav__menu');
      await page.waitForTimeout(1200);
      const aperto = await page.evaluate(() => document.body.classList.contains('menu-open'));
      await page.screenshot({ path: `${OUT}/mobile-menu.png` });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      const chiuso = await page.evaluate(() => !document.body.classList.contains('menu-open'));
      console.log(`${nome}: menu si apre ${aperto ? 'sì' : 'NO'}, si chiude ${chiuso ? 'sì' : 'NO'}`);
      if (!aperto || !chiuso) problemi++;
    }

    const largo = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`${nome}: scorrimento orizzontale ${largo > 0 ? `SÌ (${largo} px)` : 'no'}`);
    console.log(`${nome}: console ${log.length ? '\n  ' + log.join('\n  ') : 'pulita'}`);
    if (largo > 0 || log.length) problemi++;
    await ctx.close();
  }

  await browser.close();
  console.log(problemi ? `\n${problemi} problemi trovati.` : '\nTutto a posto.');
  process.exit(problemi ? 1 : 0);
})();
