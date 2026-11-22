// Rendert public/icon.svg in die PNG-Icons der PWA (nutzt Playwright/Chromium).
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8')
const targets = [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['apple-touch-icon.png', 180, 0],
  ['icon-512-maskable.png', 512, 0.12],
]
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size, pad] of targets) {
  await page.setViewportSize({ width: size, height: size })
  const inner = Math.round(size * (1 - pad * 2))
  await page.setContent(`<body style="margin:0;background:#b3364a;display:grid;place-items:center;width:${size}px;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body>`)
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: false })
}
await browser.close()
console.log('Icons erzeugt')
