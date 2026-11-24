import playwright from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const { chromium } = playwright;
const cases = [
  { name: "desktop-row-one-ui", seat: "II-2-1-16", viewport: { width: 1440, height: 900 } },
  { name: "desktop-corner-ui", seat: "C1-37-47", viewport: { width: 1440, height: 900 } },
  { name: "mobile-row-one-ui", seat: "II-2-1-16", viewport: { width: 390, height: 844 }, mobile: true },
];
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const results = [];

for (const testCase of cases) {
  const context = await browser.newContext({
    viewport: testCase.viewport,
    isMobile: Boolean(testCase.mobile),
    hasTouch: Boolean(testCase.mobile),
    reducedMotion: "reduce",
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const applicationErrors = [];
  page.on("pageerror", (error) => applicationErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") applicationErrors.push(`console: ${message.text()}`);
  });

  const url = `https://salesbeyond.vercel.app/?seat=${testCase.seat}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".viewport canvas").waitFor({ timeout: 30_000 });
  await page.getByRole("button", { name: "Na boisko" }).waitFor({ timeout: 30_000 });
  const [announcement, ticketText] = await Promise.all([
    page.locator('.selection .sr-only[aria-live="polite"]').innerText(),
    page.locator(".ticket").innerText(),
  ]);
  const screenshot = `${testCase.name}.png`;
  await page.locator(".experience").screenshot({
    path: fileURLToPath(new URL(screenshot, import.meta.url)),
  });
  results.push({
    ...testCase,
    url,
    announcement,
    ticketText,
    applicationErrors,
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    screenshot,
  });
  await context.close();
}

await browser.close();
await writeFile(
  new URL("ui-verification.json", import.meta.url),
  `${JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2)}\n`,
);
console.log(JSON.stringify(results, null, 2));
