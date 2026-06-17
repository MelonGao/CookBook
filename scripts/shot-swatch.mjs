import puppeteer from 'puppeteer';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const file = pathToFileURL(join(root, 'scripts', 'transition-swatches.html')).href;
const out = join(root, 'screenshots', 'transition-swatches.png');

const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 900, height: 720, deviceScaleFactor: 2 });
await p.goto(file, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log('saved', out);
