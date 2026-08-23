import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/admin/status", (route) => route.fulfill({ json: { ok: true, service: "admin" } }));
  await page.route("**/api/v1/admin/jobs", (route) => route.fulfill({ json: [{ id: "job-1", status: "QUEUED", attemptCount: 0, maxAttempts: 3 }] }));
  await page.route("**/api/v1/admin/calendar", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/v1/admin/coverage", (route) => route.fulfill({ json: { coverage: 2, target: 7, belowThree: true } }));
  await page.route("**/api/v1/admin/jobs/job-1/hold", (route) => route.fulfill({ json: { id: "job-1", status: "HELD" } }));
});

test("local admin dashboard shows queue warning and performs a guarded job action", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Solver queue" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("only 2 approved/scheduled spots remain");
  await expect(page.getByText("job-1")).toBeVisible();
  const holdResponse = page.waitForResponse("**/api/v1/admin/jobs/job-1/hold");
  await page.getByRole("button", { name: "Hold" }).click();
  await expect((await holdResponse).status()).toBe(200);
});

test("admin controls are absent when the backend kill switch is disabled", async ({ page }) => {
  await page.unroute("**/api/v1/admin/status");
  await page.route("**/api/v1/admin/status", (route) => route.fulfill({ status: 404, body: "disabled" }));
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Solver queue" })).toHaveCount(0);
});
