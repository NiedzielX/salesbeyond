import playwright from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
import { writeFile } from "node:fs/promises";

const { chromium } = playwright;
const target = "https://salesbeyond.vercel.app/?seat=II-2-1-16";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--disable-webgl"],
});
const errors = { sessionA: [], sessionB: [] };

async function createSession(name) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors[name].push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors[name].push(`console: ${message.text()}`);
  });
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
  await page.getByRole("button", { name: "Potwierdź blokadę miejsc" }).waitFor();
  return { context, page };
}

async function releaseIfHeld(page) {
  const release = page.getByRole("button", { name: "Zwolnij całą grupę" });
  if ((await release.count()) > 0 && (await release.isVisible())) {
    await release.click();
    await page.getByText("Blokada została zwolniona", { exact: false }).waitFor();
    return true;
  }
  return false;
}

let sessionA;
let sessionB;
const result = {
  checkedAt: new Date().toISOString(),
  target,
  seat: "II-2-1-16",
  sessionA: {},
  sessionB: {},
  cleanup: {},
  errors,
};

try {
  sessionA = await createSession("sessionA");
  sessionB = await createSession("sessionB");

  await sessionA.page.getByRole("button", { name: "Potwierdź blokadę miejsc" }).click();
  await sessionA.page.getByRole("heading", { name: "Miejsca są czasowo zablokowane" }).waitFor();
  result.sessionA.holdCreatedFromFreshSession = true;

  await sessionB.page.getByRole("button", { name: "Potwierdź blokadę miejsc" }).click();
  await sessionB.page
    .getByText("Ktoś właśnie zablokował część miejsc", { exact: false })
    .waitFor();
  result.sessionB.conflictShown = true;
  result.sessionB.activeHoldAfterConflict = false;

  await sessionA.page.reload({ waitUntil: "networkidle" });
  await sessionA.page.getByRole("heading", { name: "Przywrócono Twoją blokadę" }).waitFor();
  result.sessionA.recoveredAfterReload = true;

  result.cleanup.sessionAReleased = await releaseIfHeld(sessionA.page);
  const afterRelease = await sessionB.page.evaluate(async () => {
    const [currentResponse, inventoryResponse] = await Promise.all([
      fetch("/api/seat-api?op=current&eventId=enea-demo"),
      fetch("/api/seat-api?op=inventory&eventId=enea-demo&sectionId=II-2"),
    ]);
    const current = await currentResponse.json();
    const inventory = await inventoryResponse.json();
    const seat = inventory.seats?.find((candidate) => candidate.seatId === "II-2-1-16");
    return {
      currentStatus: currentResponse.status,
      activeHold: current.hold ?? null,
      inventoryStatus: inventoryResponse.status,
      seatStatus: seat?.status ?? null,
    };
  });
  result.afterRelease = afterRelease;
} finally {
  if (sessionA?.page) result.cleanup.sessionAReleased ||= await releaseIfHeld(sessionA.page).catch(() => false);
  if (sessionB?.page) result.cleanup.sessionBReleased ||= await releaseIfHeld(sessionB.page).catch(() => false);
  await sessionA?.context.close();
  await sessionB?.context.close();
  await browser.close();
  await writeFile(
    new URL("two-session-ui-verification.json", import.meta.url),
    `${JSON.stringify(result, null, 2)}\n`,
  );
}

console.log(JSON.stringify(result, null, 2));
