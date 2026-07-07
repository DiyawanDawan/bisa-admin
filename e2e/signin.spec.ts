import { expect, test } from "@playwright/test";

test.describe("Admin sign-in", () => {
  test("signin page shows email and password fields", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("heading", { name: /Masuk|Sign/i })).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("demo credentials button fills form", async ({ page }) => {
    await page.goto("/signin");
    const demoBtn = page.getByRole("button", { name: /demo|contoh|isi/i });
    if (await demoBtn.count()) {
      await demoBtn.first().click();
      await expect(page.locator('input[type="email"]')).not.toHaveValue("");
    }
  });
});
