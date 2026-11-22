// Rendert die App-Icons aus public/icon-full.svg (randlos) mit Playwright/Chromium.
// Normale Icons: Motiv etwas kleiner, Systeme runden die Ecken selbst ab.
// Maskable: Motiv in der sicheren Zone (inneres 80-%-Kreisfeld), Hintergrund randlos.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icon-full.svg', import.meta.url), 'utf8')
const scaled = (f) => svg.replace('<g id="art">', `<g id="art" transform="translate(256 256) scale(${f}) translate(-256 -256)">`)
const targets = [
  ['icon-192.png', 192, 1.05],
  ['icon-512.png', 512, 1.05],
  ['apple-touch-icon.png', 180, 1.0],
  ['icon-512-maskable.png', 512, 0.86],
  ['icon-192-maskable.png', 192, 0.86],
  ['favicon-48.png', 48, 1.15],
]
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size, f] of targets) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<body style="margin:0">${scaled(f).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`)
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, clip: { x: 0, y: 0, width: size, height: size } })
}
await browser.close()
console.log('Icons erzeugt. Danach mit 256 Farben komprimiert (Pillow quantize), damit der Offline-Cache klein bleibt.')
