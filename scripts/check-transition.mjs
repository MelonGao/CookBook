// 抓多次切页转场的中间帧，确认渐变配色每次随机
import puppeteer from 'puppeteer';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://localhost:5174';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 900, height: 600, deviceScaleFactor: 1.5 });
await p.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
await wait(1000);

const routes = ['菜谱', '周计划', '首页', '菜谱', '周计划'];
for (let i = 0; i < routes.length; i++) {
  const links = await p.$$('header nav a');
  let target = null;
  for (const a of links) {
    const t = await p.evaluate((el) => el.textContent, a);
    if (t && t.includes(routes[i])) target = a;
  }
  if (!target) continue;
  await target.click();
  await wait(230); // 覆盖最盛的中间帧
  await p.screenshot({ path: join(root, 'screenshots', `transition-${i + 1}.png`) });
  await wait(900); // 等转场结束再进行下一次
}

await b.close();
console.log('saved transition-1..5.png');
