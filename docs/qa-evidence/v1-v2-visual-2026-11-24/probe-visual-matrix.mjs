import playwright from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const { chromium } = playwright;
const base = "https://salesbeyond.vercel.app/";
const views = [
  { name: "overview-roof", seat: null, purpose: "bryła, pełny dach, otwór i cztery trybuny" },
  { name: "stand-i", seat: "I-2-25-29", purpose: "Trybuna I, środkowy rząd i przekrój dachu" },
  { name: "stand-ii-row-one", seat: "II-2-1-16", purpose: "dolny rząd Trybuny II i reklamy Beyond" },
  { name: "stand-iii", seat: "III-2-24-29", purpose: "Trybuna III, narożniki i dach" },
  { name: "stand-iv", seat: "IV-2-17-20", purpose: "Trybuna IV i niższy profil dachu" },
  { name: "corner-c1", seat: "C1-37-47", purpose: "ciągłość narożnika między trybunami" },
  { name: "mobile-overview", seat: null, purpose: "panorama i pełny dach na 390x844", mobile: true },
  { name: "mobile-row-one", seat: "II-2-1-16", purpose: "dolny rząd i widoczność boiska na 390x844", mobile: true },
];

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const results = [];

for (const view of views) {
  const viewport = view.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const context = await browser.newContext({
    viewport,
    isMobile: Boolean(view.mobile),
    hasTouch: Boolean(view.mobile),
    reducedMotion: "reduce",
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const applicationErrors = [];
  page.on("pageerror", (error) => applicationErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") applicationErrors.push(`console: ${message.text()}`);
  });

  const url = view.seat ? `${base}?seat=${view.seat}` : base;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".viewport canvas").waitFor({ timeout: 30_000 });

  if (view.seat) {
    const recenter = page.getByRole("button", { name: "Na boisko" });
    await recenter.waitFor({ timeout: 30_000 });
    await page.waitForFunction(
      () => {
        const button = [...document.querySelectorAll("button")].find((candidate) =>
          candidate.textContent?.includes("Na boisko"),
        );
        return button instanceof HTMLButtonElement && !button.disabled;
      },
      undefined,
      { timeout: 30_000 },
    );
    await recenter.click();
  } else {
    await page.waitForTimeout(2_500);
  }

  const webgl2 = await page.evaluate(() => {
    const canvas = document.querySelector(".viewport canvas");
    return Boolean(canvas?.getContext("webgl2"));
  });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const screenshot = `${view.name}.png`;
  await page.locator(".viewport").screenshot({
    path: fileURLToPath(new URL(screenshot, import.meta.url)),
  });
  results.push({ ...view, viewport: `${viewport.width}x${viewport.height}`, url, webgl2, scrollWidth, applicationErrors, screenshot });
  await context.close();
}

await browser.close();
await writeFile(
  new URL("verification.json", import.meta.url),
  `${JSON.stringify({ checkedAt: new Date().toISOString(), deployment: base, views: results }, null, 2)}\n`,
);
console.log(JSON.stringify(results, null, 2));
