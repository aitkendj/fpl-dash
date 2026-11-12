/**
 * Screenshot helper.
 *
 * Run with: npm run shot <path> [name]
 * Captures a page at a given viewport so layout changes can be checked
 * without a browser round-trip.
 */
import { chromium } from "playwright"
import { mkdirSync } from "node:fs"
import { resolve } from "node:path"

async function main() {
  const path = process.argv[2] ?? "/"
  const name = process.argv[3] ?? "page"
  const base = process.env.BASE_URL ?? "http://localhost:3000"
  const width = Number(process.argv[4] ?? 1440)
  const height = Number(process.argv[5] ?? 1000)

  const outDir = resolve(process.cwd(), ".screenshots")
  mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
  })

  await page.goto(`${base}${path}`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  })
  await page.waitForTimeout(1200)

  const file = resolve(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })

  // Report the geometry of any elements tagged with data-check
  const boxes = await page.$$eval("[data-check]", (nodes) =>
    nodes.map((node) => {
      const el = node as HTMLElement
      const rect = el.getBoundingClientRect()
      return {
        check: el.dataset.check,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(rect.bottom),
      }
    })
  )

  console.log(JSON.stringify(boxes, null, 2))
  console.log(`\nSaved ${file}`)

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
