// 可视化验证：用 puppeteer 逐页访问、截图、收集控制台报错
// 运行：node scripts/visual-check.mjs  （需先 npm run dev）
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shotDir = join(root, 'screenshots');
await mkdir(shotDir, { recursive: true });

// 等转场动画 + 内容渲染稳定
const settle = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const results = [];

async function visit(name, path, { afterLoad } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const issues = [];
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') issues.push(`[${t}] ${m.text()}`);
  });
  page.on('pageerror', (e) => issues.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) =>
    issues.push(`[requestfailed] ${r.url()} — ${r.failure()?.errorText}`),
  );

  let url = `${BASE}${path}`;
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await settle();
    if (afterLoad) {
      const newPath = await afterLoad(page);
      if (newPath) url = `${BASE}${newPath}`;
    }
    const file = join(shotDir, `${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    results.push({ name, url, ok: issues.length === 0, issues, file });
  } catch (err) {
    results.push({ name, url, ok: false, issues: [`[fatal] ${err.message}`, ...issues] });
  } finally {
    await page.close();
  }
}

await visit('1-home', '/');
await visit('2-recipes', '/recipes');
// 详情页：先进列表，点第一个菜谱卡片（onClick 跳转，非 <a>）
await visit('3-recipe-detail', '/recipes', {
  afterLoad: async (page) => {
    const card = await page.$('article');
    if (!card) return null;
    await card.click();
    await page.waitForFunction(
      () => /\/recipes\/[^/]+$/.test(location.pathname),
      { timeout: 10000 },
    );
    await settle();
    return new URL(page.url()).pathname;
  },
});
await visit('4-new-editor', '/new');
await visit('5-import', '/import');
await visit('6-planner', '/planner');
await visit('7-notfound', '/this-page-does-not-exist');

await browser.close();

// 汇总
console.log('\n================ 可视化验证结果 ================');
let pass = 0;
for (const r of results) {
  const tag = r.ok ? '✅ PASS' : '⚠️  ISSUES';
  if (r.ok) pass++;
  console.log(`\n${tag}  ${r.name}  → ${r.url}`);
  if (r.file) console.log(`   截图: ${r.file}`);
  for (const i of r.issues) console.log(`   ${i}`);
}
console.log(`\n----------------------------------------------`);
console.log(`总计 ${results.length} 页，干净 ${pass} 页，有问题 ${results.length - pass} 页`);
console.log(`截图目录: ${shotDir}`);
