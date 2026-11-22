// Rendert die App-Icons aus public/icon-full.svg (randlos, Linienzeichnung) mit Playwright/Chromium.
// Kleine Größen bekommen eine dickere Linie, damit sie lesbar bleibt.
// Maskable: Motiv kleiner, damit es in der sicheren Zone (inneres 80-%-Feld) liegt.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icon-full.svg', import.meta.url), 'utf8')
const variant = (f, stroke) =>
  svg
    .replace('<g id="art">', `<g id="art" transform="translate(256 256) scale(${f}) translate(-256 -256)">`)
    .replace(/stroke-width="[\d.]+"/, `stroke-width="${stroke}"`)
const targets = [
  ['icon-512.png', 512, 1, 5],
  ['icon-192.png', 192, 1, 8],
  ['apple-touch-icon.png', 180, 1, 8],
  ['icon-512-maskable.png', 512, 0.84, 6],
  ['icon-192-maskable.png', 192, 0.84, 9],
  ['favicon-48.png', 48, 1.25, 14],
]
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size, f, stroke] of targets) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<body style="margin:0">${variant(f, stroke).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`)
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, clip: { x: 0, y: 0, width: size, height: size } })
}
await browser.close()
console.log('Icons erzeugt. Danach mit 256 Farben komprimiert (Pillow quantize), damit der Offline-Cache klein bleibt.')
