import playwright from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const { chromium } = playwright;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const base = "https://salesbeyond.vercel.app/?seat=II-2-1-16";
const report = { checkedAt: new Date().toISOString(), deployment: base, errors: [] };

async function ready(page) {
  await page.locator(".viewport canvas").waitFor({ timeout: 30_000 });
  await page.getByRole("button", { name: "Na boisko" }).waitFor({ timeout: 30_000 });
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes("Na boisko"));
    return button instanceof HTMLButtonElement && !button.disabled;
  }, undefined, { timeout: 30_000 });
}

async function contextPage(options) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return { context, page, errors };
}

try {
  {
    const { context, page, errors } = await contextPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await page.goto(base, { waitUntil: "networkidle" });
    await ready(page);
    const previous = page.getByRole("button", { name: "Poprzednie", exact: true });
    const next = page.getByRole("button", { name: "Następne", exact: true });
    await previous.focus();
    await page.keyboard.press("Tab");
    const tabTarget = await page.evaluate(() => document.activeElement?.textContent?.trim());
    await page.keyboard.press("Shift+Tab");
    const shiftTabTarget = await page.evaluate(() => document.activeElement?.textContent?.trim());
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await next.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(/seat=II-2-1-17/);
    await ready(page);
    const afterEnter = page.url();
    await page.getByRole("button", { name: "Poprzednie", exact: true }).focus();
    await page.keyboard.press("Space");
    await page.waitForURL(/seat=II-2-1-16/);
    await ready(page);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    report.keyboard = { tabTarget, shiftTabTarget, afterEnter, afterSpace: page.url(), scrollDelta: scrollAfter - scrollBefore, errors };
    report.errors.push(...errors);
    await context.close();
  }

  {
    const { context, page, errors } = await contextPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    await page.goto(base, { waitUntil: "networkidle" });
    await ready(page);
    await page.getByRole("button", { name: "Następne", exact: true }).click();
    await page.waitForURL(/seat=II-2-1-17/);
    await ready(page);
    const controls = {};
    for (const name of ["Poprzednie", "Na boisko", "Następne"]) {
      controls[name] = await page.getByRole("button", { name, exact: true }).boundingBox();
    }
    const touchMode = page.locator(".mobile-touch-mode");
    const initialPressed = await touchMode.getAttribute("aria-pressed");
    await touchMode.click();
    const scenePressed = await touchMode.getAttribute("aria-pressed");
    const sceneMessage = await page.locator(".control-message").innerText();
    await touchMode.click();
    const pagePressed = await touchMode.getAttribute("aria-pressed");
    const pageMessage = await page.locator(".control-message").innerText();
    report.mobile = {
      viewport: "390x844 emulated touch",
      url: page.url(),
      scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
      controls,
      gestureMode: { initialPressed, scenePressed, sceneMessage, pagePressed, pageMessage },
      errors,
    };
    report.errors.push(...errors);
    await page.screenshot({ path: fileURLToPath(new URL("mobile-touch-modes.png", import.meta.url)), fullPage: true });
    await context.close();
  }

  report.reducedMotion = {};
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const { context, page, errors } = await contextPage({ viewport: { width: 1440, height: 900 }, reducedMotion });
    await page.goto(base, { waitUntil: "networkidle" });
    await ready(page);
    const started = Date.now();
    await page.getByRole("button", { name: "Następne", exact: true }).click();
    await page.waitForURL(/seat=II-2-1-17/);
    await ready(page);
    report.reducedMotion[reducedMotion] = { arrivalMs: Date.now() - started, url: page.url(), errors };
    report.errors.push(...errors);
    await context.close();
  }
} catch (error) {
  report.failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
} finally {
  report.completedAt = new Date().toISOString();
  await writeFile(new URL("verification.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}

if (report.failure) {
  console.error(report.failure);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
