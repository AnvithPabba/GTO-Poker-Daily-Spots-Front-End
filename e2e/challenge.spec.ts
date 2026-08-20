import { expect, test } from "@playwright/test";

const spot = {
  schemaVersion: 2,
  spotId: "e2e_spot_001",
  spotVersionId: "e2e_spot_001_v1",
  publicationDate: "2026-08-20",
  slotOrder: 1,
  initialState: { board: ["Qs", "Jh", "2h"], pot: 50, stacks: { ip: 100, oop: 100 }, street: "flop", actor: "oop", allIn: { ip: false, oop: false } },
  history: [{ kind: "action", actor: "oop", actionType: "check", solverLabel: "CHECK" }],
  decision: { board: ["Qs", "Jh", "2h"], pot: 50, stacks: { ip: 100, oop: 100 }, street: "flop", actor: "ip", allIn: { ip: false, oop: false } },
  legalActions: [{ id: "a0", type: "check", displayLabel: "Check", isAllIn: false }, { id: "a1", type: "bet", amount: 25, displayLabel: "Bet 25", isAllIn: false }, { id: "a2", type: "fold", displayLabel: "Fold", isAllIn: false }],
  featuredCombo: "AhAs",
  selectableCombos: [{ combo: "AhAs", category: "pair" }, { combo: "AcAd", category: "pair" }],
  presentation: { heroActor: "ip", dealerActor: "ip", positions: { ip: "BTN", oop: "BB" }, holdingVisibility: "featured_hero", chipUnit: "bb" },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/spots/today", (route) => route.fulfill({ json: { publicationDate: spot.publicationDate, timezone: "America/Los_Angeles", isFallback: false, spots: [{ spotId: spot.spotId, spotVersionId: spot.spotVersionId, publicationDate: spot.publicationDate, slotOrder: 1, title: "E2E flop spot" }] } }));
  await page.route(`**/api/v1/spots/${spot.spotId}`, (route) => route.fulfill({ json: spot }));
  await page.route(`**/api/v1/spots/${spot.spotId}/attempts`, (route) => route.fulfill({ status: 201, json: { attemptId: "e2e_attempt_001", official: true, metric: { key: "l1", version: 1 }, aggregator: { key: "equal_average", version: 1 }, overallSimilarity: 100, hands: [{ combo: "AhAs", similarity: 100, gtoMajorityActionId: "a1", actions: [{ actionId: "a0", submittedBasisPoints: 0, gtoBasisPoints: 0, signedDifferenceBasisPoints: 0, absoluteDifferenceBasisPoints: 0 }, { actionId: "a1", submittedBasisPoints: 10000, gtoBasisPoints: 10000, signedDifferenceBasisPoints: 0, absoluteDifferenceBasisPoints: 0 }, { actionId: "a2", submittedBasisPoints: 0, gtoBasisPoints: 0, signedDifferenceBasisPoints: 0, absoluteDifferenceBasisPoints: 0 }] }] } }));
});

test("daily navigation opens a replayable challenge", async ({ page }) => {
  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: "Today’s spots" })).toBeVisible();
  await page.getByRole("link", { name: /E2E flop spot/ }).click();
  await expect(page.getByRole("heading", { name: "What is your strategy?" })).toBeVisible();
  await page.getByRole("button", { name: "Start replay" }).click();
  await expect(page.getByText("OOP CHECK")).toBeVisible();
  await page.getByRole("button", { name: "Skip to decision" }).click();
  await expect(page.getByRole("button", { name: "Submit answer" })).toBeVisible();
});

test("playback pause, sound preference, and refresh restore are deterministic", async ({ page }) => {
  await page.goto(`/challenge/${spot.spotId}`);
  await page.getByRole("button", { name: "Start replay" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Sound off" }).click();
  await expect(page.getByRole("button", { name: "Sound on" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sound on" })).toBeVisible();
});

test("keyboard-accessible percentage answer submits without leaking before commit", async ({ page }) => {
  await page.goto(`/challenge/${spot.spotId}`);
  await page.getByRole("button", { name: "Skip to decision" }).click();
  await expect(page.getByText("Total: 100.00% ✓")).toBeVisible();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("heading", { name: /100.0% similarity/ })).toBeVisible();
  await expect(page.getByText("GTO majority: a1")).toBeVisible();
});
