import playwright from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const { chromium } = playwright;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
const evidence = { checkedAt: new Date().toISOString(), deployment: "https://salesbeyond.vercel.app/", stages: [], errors };
const stage = async (name, details = {}) => evidence.stages.push({ name, at: new Date().toISOString(), ...details });
const shot = async (name) => page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, import.meta.url)), fullPage: true });

try {
  await page.goto(evidence.deployment, { waitUntil: "networkidle" });
  await page.locator(".viewport canvas").waitFor({ timeout: 30_000 });
  await page.getByRole("button", { name: "Plan 2D", exact: true }).click();
  await page.locator(".viewport-heading").filter({ hasText: "PLAN STADIONU 2D" }).waitFor({ timeout: 30_000 });
  await stage("plan-2d", { url: page.url() });

  const sectionButton = page.locator(".sector-list button").filter({ has: page.locator(".sector-number", { hasText: /^II-2$/ }) });
  await sectionButton.click();
  const row = page.getByRole("slider", { name: "Wybierz rząd" });
  await row.fill("1");
  await page.locator('.seat-grid button[aria-label^="Miejsce 16,"]').click();
  await page.locator(".ticket").waitFor();
  const selection2d = {
    announcement: await page.locator('.selection .sr-only[aria-live="polite"]').innerText(),
    ticket: await page.locator(".ticket").innerText(),
    url: page.url(),
  };
  await shot("01-plan-2d-seat");
  await stage("seat-selected-on-plan", selection2d);

  await page.getByRole("button", { name: "Stadion 3D", exact: true }).click();
  await page.locator(".viewport canvas").waitFor({ timeout: 30_000 });
  await page.getByRole("button", { name: "Na boisko" }).waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".viewport canvas");
    const recenter = [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("Na boisko"));
    return Boolean(canvas?.getContext("webgl2")) && recenter instanceof HTMLButtonElement && !recenter.disabled;
  }, undefined, { timeout: 30_000 });
  const selection3d = {
    announcement: await page.locator('.selection .sr-only[aria-live="polite"]').innerText(),
    ticket: await page.locator(".ticket").innerText(),
    webgl2: await page.evaluate(() => Boolean(document.querySelector(".viewport canvas")?.getContext("webgl2"))),
    url: page.url(),
  };
  await shot("02-stadium-3d-seat");
  await stage("same-seat-in-3d", selection3d);

  const basketItems = page.locator(".basket-seats li");
  const beforeSearch = await basketItems.count();
  await page.locator("#group-size").selectOption("2");
  await page.getByRole("button", { name: "Znajdź miejsca obok siebie", exact: true }).click();
  await page.getByText("Propozycja gotowa. Obejrzyj miejsca lub dodaj całą grupę.", { exact: true }).waitFor();
  const proposal = await page.locator(".group-proposal").innerText();
  const afterSearch = await basketItems.count();
  if (afterSearch !== beforeSearch) throw new Error(`Group search changed basket: ${beforeSearch} -> ${afterSearch}`);
  await page.getByRole("button", { name: "Dodaj całą grupę", exact: true }).click();
  await page.getByText("Dodano całą grupę do wyboru.", { exact: true }).waitFor();
  const afterAdd = await basketItems.count();
  if (afterAdd !== 2) throw new Error(`Expected 2 basket items, got ${afterAdd}`);
  const basket = await page.locator(".basket").innerText();
  await stage("group-added", { beforeSearch, afterSearch, afterAdd, proposal, basket });

  await page.getByRole("button", { name: "Sprawdź dostępność i cenę", exact: true }).click();
  await page.getByRole("button", { name: "Potwierdź blokadę miejsc", exact: true }).waitFor({ timeout: 30_000 });
  const quote = await page.locator(".hold-panel").innerText();
  await stage("quote", { panel: quote });
  await page.getByRole("button", { name: "Potwierdź blokadę miejsc", exact: true }).click();
  await page.getByRole("heading", { name: "Miejsca są czasowo zablokowane", exact: true }).waitFor({ timeout: 30_000 });
  const active = await page.locator(".hold-panel").innerText();
  await shot("03-active-hold");
  await stage("hold-created", { panel: active });

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Przywrócono Twoją blokadę", exact: true }).waitFor({ timeout: 30_000 });
  const recovered = await page.locator(".hold-panel").innerText();
  await shot("04-recovered-hold");
  await stage("hold-recovered", { panel: recovered });

  await page.getByRole("button", { name: "Zwolnij całą grupę", exact: true }).click();
  await page.getByText("Blokada została zwolniona. Miejsca można wybrać ponownie.", { exact: true }).waitFor({ timeout: 30_000 });
  const released = await page.locator(".hold-panel").innerText();
  await shot("05-released-hold");
  await stage("hold-released", { panel: released });
} catch (error) {
  evidence.failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  await shot("failure").catch(() => {});
} finally {
  evidence.completedAt = new Date().toISOString();
  await writeFile(new URL("verification.json", import.meta.url), `${JSON.stringify(evidence, null, 2)}\n`);
  await context.close();
  await browser.close();
}

if (evidence.failure) {
  console.error(evidence.failure);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(evidence, null, 2));
}
