import { expect, test } from "@playwright/test";
import { attemptFixture, dailyGameFixture, heroOopSpotFixture, publicSpotFixture } from "../src/test/fixtures.js";

const stats = { currentStreak: 2, bestStreak: 4, dailyGamesCompleted: 8, spotsCompleted: 11, averageScoreBasisPoints: 8_125, breakdowns: { scenarios: [], streets: [], positions: [] } };
const history = { attempts: [{ attemptId: attemptFixture.attemptId, spotId: attemptFixture.spotId, spotVersionId: attemptFixture.spotVersionId, attemptKind: "official", score: attemptFixture.score, createdAt: attemptFixture.createdAt }] };

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/api/v1/admin/status", (route) => route.fulfill({ status: 403, json: { error: { code: "FORBIDDEN", message: "forbidden", requestId: "req_admin_1" } } }));
  await page.route("**/api/v1/daily-games/today", (route) => route.fulfill({ json: dailyGameFixture }));
  await page.route("**/api/v1/daily-games?*", (route) => route.fulfill({ json: { from: "2026-08-01", to: "2026-08-31", games: [{ date: dailyGameFixture.date, spotCount: 1, completedSpots: 0, status: "available", officialScorePoints: 0, maximumScorePoints: 1000 }] } }));
  await page.route(`**/api/v1/daily-games/${dailyGameFixture.date}`, (route) => route.fulfill({ json: dailyGameFixture }));
  await page.route(`**/api/v1/spots/${publicSpotFixture.spotId}`, (route) => route.fulfill({ json: publicSpotFixture }));
  await page.route("**/api/v1/users/me/stats", (route) => route.fulfill({ json: stats }));
  await page.route("**/api/v1/users/me/attempts?*", (route) => route.fulfill({ json: history }));
  await page.route(`**/api/v1/attempts/${attemptFixture.attemptId}`, (route) => route.fulfill({ json: attemptFixture }));
});

test("home and daily routes focus the visitor on the first unfinished spot", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build your strategy. Find the leak." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Play today/ })).toHaveAttribute("href", `/challenge/${publicSpotFixture.spotId}`);
  await page.getByRole("link", { name: "Daily", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today’s game" })).toBeVisible();
  await page.getByRole("link", { name: /Continue/ }).click();
  await expect(page.getByRole("heading", { name: "Your Decision" })).toBeVisible();
});

test("static context, role labels, and starting ranges are immediately usable", async ({ page }) => {
  await page.goto(`/challenge/${publicSpotFixture.spotId}`);
  await expect(page.getByRole("heading", { name: "Hand history" })).toBeVisible();
  await expect(page.locator(".answer-header").getByText("Your hand", { exact: true })).toBeVisible();
  await expect(page.getByText("Your strategy", { exact: true })).toHaveCount(0);
  await expect(page.getByText("You open to 2.5 bb → Opponent (BB) calls", { exact: true })).toBeVisible();
  await expect(page.getByText("Opponent (BB) checks", { exact: true })).toBeVisible();
  await expect(page.locator(".street-history__row")).toHaveCount(2);
  await expect(page.getByRole("group", { name: "You · BTN · IP, dealer" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Opponent · BB · OOP" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit answer" })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Play|Skip|Replay|Sound/ })).toHaveCount(0);
  await page.getByRole("button", { name: "View starting ranges" }).click();
  await expect(page.getByRole("dialog", { name: "Starting ranges" })).toBeVisible();
  await expect(page.getByRole("grid", { name: "You · BTN · IP starting range" })).toBeVisible();
  await expect(page.getByRole("grid", { name: "Opponent · BB · OOP starting range" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Starting ranges" })).toHaveCount(0);
});

test("BTN owns the dealer button while hero BB/OOP acts first", async ({ page }) => {
  await page.unroute(`**/api/v1/spots/${publicSpotFixture.spotId}`);
  await page.route(`**/api/v1/spots/${heroOopSpotFixture.spotId}`, (route) => route.fulfill({ json: heroOopSpotFixture }));
  await page.goto(`/challenge/${heroOopSpotFixture.spotId}`);

  await expect(page.getByText("Opponent (BTN) opens to 2.5 bb → You call from the BB", { exact: true })).toBeVisible();
  await expect(page.getByText("You act first", { exact: true })).toBeVisible();
  const opponent = page.getByRole("group", { name: "Opponent · BTN · IP, dealer" });
  const hero = page.getByRole("group", { name: "You · BB · OOP" });
  await expect(opponent.getByLabel("Dealer button")).toBeVisible();
  await expect(hero.getByLabel("Dealer button")).toHaveCount(0);
  await expect(page.getByText("In position", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Out of position", { exact: true })).toHaveCount(0);
  await expect(page.locator(".table-meta")).toHaveCount(0);
});

test("additional-hand modal saves, edits, and removes an exact combo", async ({ page }) => {
  await page.goto(`/challenge/${publicSpotFixture.spotId}`);
  await page.getByRole("button", { name: "+ Add another hand" }).click();
  await expect(page.getByRole("dialog", { name: "Add another hand" })).toBeVisible();
  await page.getByRole("gridcell", { name: "AA" }).click();
  await expect(page.getByRole("button", { name: /A♥ A♠ · featured/ })).toBeDisabled();
  await page.getByRole("button", { name: "A♦ A♠" }).click();
  await page.getByRole("button", { name: "Save A♦ A♠" }).click();
  await expect(page.getByText("2/20")).toBeVisible();

  const saved = page.locator(".saved-hand", { hasText: "A♦ A♠" });
  await saved.getByRole("button", { name: "Edit" }).click();
  const editor = page.getByRole("dialog", { name: "Edit A♦ A♠" });
  await expect(editor).toBeVisible();
  await editor.getByLabel("Check percentage").fill("10");
  await editor.getByLabel("Bet 25 bb percentage").fill("90");
  await editor.getByLabel("Bet 75 bb percentage").fill("0");
  await editor.getByRole("button", { name: "Save A♦ A♠" }).click();
  await saved.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("2/20")).not.toBeVisible();
  await expect(page.getByText("1/20")).toBeVisible();
});

test("valid submission sends an idempotency header and reveals answers only on the result route", async ({ page }) => {
  let submittedHeader = "";
  await page.route(`**/api/v1/spots/${publicSpotFixture.spotId}/attempts`, async (route) => {
    submittedHeader = route.request().headers()["idempotency-key"] ?? "";
    await route.fulfill({ status: 201, headers: { Location: `/api/v1/attempts/${attemptFixture.attemptId}` }, json: { attemptId: attemptFixture.attemptId, attemptKind: "official", score: attemptFixture.score, progress: attemptFixture.progress } });
  });
  await page.goto(`/challenge/${publicSpotFixture.spotId}`);
  await expect(page.getByText(/GTO majority:/)).not.toBeVisible();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page).toHaveURL(`/results/${attemptFixture.attemptId}`);
  await expect(page.getByText("Official result")).toBeVisible();
  await expect(page.getByText("GTO majority: Bet 25 bb")).toBeVisible();
  expect(submittedHeader.length).toBeGreaterThanOrEqual(16);
  await page.reload();
  await expect(page.getByText("87.50% strategy similarity")).toBeVisible();
});

test("invalid allocation disables submission and archive/stats use persisted read models", async ({ page }) => {
  await page.goto(`/challenge/${publicSpotFixture.spotId}`);
  await page.getByLabel("Check percentage").fill("99");
  await expect(page.getByRole("button", { name: "Submit answer" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("needs 100%");

  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible();
  await expect(page.getByText("81.3%", { exact: true })).toBeVisible();
  await page.goto("/archive");
  await expect(page.getByRole("heading", { name: "Archive" })).toBeVisible();
  await expect(page.getByRole("link", { name: /22.*0\/1 spots.*0\/1000/ })).toBeVisible();
});
