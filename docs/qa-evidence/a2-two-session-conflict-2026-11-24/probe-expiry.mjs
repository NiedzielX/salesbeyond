import playwright from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
import { writeFile } from "node:fs/promises";

const { chromium } = playwright;
let seatId;
let target;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--disable-webgl"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

const result = {
  checkedAt: new Date().toISOString(),
  target: undefined,
  seatId: undefined,
  holdCreated: false,
  terminalHeadingShown: false,
  expiryCopyShown: false,
  currentAfterExpiry: undefined,
  seatStatusAfterExpiry: undefined,
  cleanupReleaseNeeded: false,
  pageErrors,
};

async function releaseIfActive() {
  const release = page.getByRole("button", { name: "Zwolnij całą grupę" });
  if ((await release.count()) > 0 && (await release.isVisible())) {
    await release.click();
    await page.getByText("Blokada została zwolniona", { exact: false }).waitFor();
    return true;
  }
  return false;
}

let heartbeat;
try {
  await page.goto("https://salesbeyond.vercel.app/", { waitUntil: "networkidle" });
  const inventory = await page.evaluate(async () => {
    const response = await fetch("/api/seat-api?op=inventory&eventId=enea-demo&sectionId=II-2");
    return response.json();
  });
  const availableSeat = inventory.seats?.find((candidate) => candidate.status === "available");
  if (!availableSeat) throw new Error("No available seat found in section II-2");
  seatId = availableSeat.seatId;
  target = `https://salesbeyond.vercel.app/?seat=${seatId}`;
  result.seatId = seatId;
  result.target = target;
  await page.goto(target, { waitUntil: "networkidle" });
  const add = page.getByRole("button", { name: "Dodaj do wyboru" });
  await add.waitFor();
  await page.waitForFunction(
    () => {
      const button = [...document.querySelectorAll("button")].find((candidate) =>
        candidate.textContent?.includes("Dodaj do wyboru"),
      );
      return button instanceof HTMLButtonElement && !button.disabled;
    },
    undefined,
    { timeout: 30_000 },
  );
  await add.click({ force: true });
  await page.getByRole("button", { name: "Sprawdź dostępność i cenę" }).click({ force: true });
  await page.getByRole("button", { name: "Potwierdź blokadę miejsc" }).click();
  await page.getByRole("heading", { name: "Miejsca są czasowo zablokowane" }).waitFor();
  result.holdCreated = true;
  result.initialClock = await page.locator(".hold-clock").innerText();

  heartbeat = setInterval(async () => {
    const clock = await page.locator(".hold-clock").innerText().catch(() => "brak zegara");
    console.log(`[expiry] ${new Date().toISOString()} ${clock}`);
  }, 30_000);

  await page.getByRole("heading", { name: "Blokada zakończona" }).waitFor({ timeout: 700_000 });
  result.terminalHeadingShown = true;
  result.expiryCopyShown = await page
    .getByText("Termin blokady minął. Sprawdź dostępność ponownie.", { exact: true })
    .isVisible();

  const afterExpiry = await page.evaluate(async (id) => {
    const [currentResponse, inventoryResponse] = await Promise.all([
      fetch("/api/seat-api?op=current&eventId=enea-demo"),
      fetch("/api/seat-api?op=inventory&eventId=enea-demo&sectionId=II-2"),
    ]);
    const current = await currentResponse.json();
    const inventory = await inventoryResponse.json();
    const seat = inventory.seats?.find((candidate) => candidate.seatId === id);
    return {
      currentStatus: currentResponse.status,
      activeHold: current.hold ?? null,
      inventoryStatus: inventoryResponse.status,
      seatStatus: seat?.status ?? null,
    };
  }, seatId);
  result.currentAfterExpiry = afterExpiry.activeHold;
  result.seatStatusAfterExpiry = afterExpiry.seatStatus;
} finally {
  if (heartbeat) clearInterval(heartbeat);
  result.cleanupReleaseNeeded = await releaseIfActive().catch(() => false);
  await context.close();
  await browser.close();
  await writeFile(new URL("expiry-verification.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
