// Render HTML diagram to PNG at 2x device scale (300dpi print quality)
// Usage: node shot.js <input.html> <output.png> [width]
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [,, input, output, widthArg] = process.argv;
  if (!input || !output) { console.error('Usage: node shot.js <input.html> <output.png> [width]'); process.exit(2); }
  const width = parseInt(widthArg || '1200', 10);
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width, height: 800 },
    deviceScaleFactor: 2,
  });
  await page.goto('file://' + path.resolve(input));
  await page.waitForTimeout(600);
  const body = await page.locator('body');
  await body.screenshot({ path: output });
  const fs = require('fs');
  const size = fs.statSync(output).size;
  console.log(`OK ${output} (${(size/1024).toFixed(1)} KB, viewport ${width})`);
  await browser.close();
})();
