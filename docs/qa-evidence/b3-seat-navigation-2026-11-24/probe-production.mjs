import playwright from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const { chromium } = playwright;

const baseUrl = "https://salesbeyond.vercel.app/?seat=II-2-1-16";
const launchArgs = [
  "--use-angle=swiftshader",
  "--enable-webgl",
  "--ignore-gpu-blocklist",
];

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: launchArgs,
});

async function run(viewport, screenshotName, mobile = false) {
  const context = await browser.newContext({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const applicationErrors = [];
  page.on("pageerror", (error) => applicationErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") applicationErrors.push(`console: ${message.text()}`);
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const next = page.getByRole("button", { name: "Następne" });
  await next.waitFor();
  await next.click();
  await page.waitForURL(/seat=II-2-1-17/);

  const recenter = page.getByRole("button", { name: "Na boisko" });
  if ((await recenter.count()) === 0) {
    const open3d = page.getByRole("button", { name: "Zobacz z tego miejsca w 3D" });
    if ((await open3d.count()) === 0) {
      throw new Error("Neither the 3D recenter nor the seat-view 3D button was rendered");
    }
    await open3d.click();
  }
  await recenter.waitFor({ state: "visible", timeout: 30_000 });
  await recenter.waitFor({ state: "attached" });
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

  const webgl2 = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    return Boolean(canvas?.getContext("webgl2"));
  });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const selectedSeat = new URL(page.url()).searchParams.get("seat");
  const controls = await Promise.all(
    ["Poprzednie", "Na boisko", "Następne"].map(async (name) => {
      const box = await page.getByRole("button", { name }).boundingBox();
      return { name, box };
    }),
  );

  await page.screenshot({ path: fileURLToPath(new URL(screenshotName, import.meta.url)), fullPage: false });
  await context.close();
  return {
    viewport: `${viewport.width}x${viewport.height}`,
    selectedSeat,
    webgl2,
    recenterEnabledAndClicked: true,
    scrollWidth,
    controls,
    applicationErrors,
  };
}

const desktop = await run({ width: 1440, height: 900 }, "production-desktop-1440x900.png");
const mobile = await run({ width: 390, height: 844 }, "production-mobile-390x844.png", true);

await browser.close();

const result = {
  checkedAt: new Date().toISOString(),
  deployment: "https://salesbeyond.vercel.app",
  desktop,
  mobile,
};

await writeFile(new URL("production-verification.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
