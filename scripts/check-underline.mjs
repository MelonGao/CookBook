// 快速验证 nav 手绘下划线交互：截 active 常驻线 + hover 画线
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:5174';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shotDir = join(root, 'screenshots');
await mkdir(shotDir, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 240, deviceScaleFactor: 2 });
await page.goto(`${BASE}/recipes`, { waitUntil: 'networkidle2' });
await wait(1200); // active「菜谱」常驻线画出

const header = await page.$('header');
await header.screenshot({ path: join(shotDir, 'nav-active.png') });

// hover「周计划」触发画线，截绘制完成的那一刻
const links = await page.$$('header nav a');
let planner = null;
for (const a of links) {
  const txt = await page.evaluate((el) => el.textContent, a);
  if (txt && txt.includes('周计划')) planner = a;
}
if (planner) {
  await planner.hover();
  await wait(600);
  await header.screenshot({ path: join(shotDir, 'nav-hover.png') });
}

await browser.close();
console.log('saved nav-active.png + nav-hover.png');
