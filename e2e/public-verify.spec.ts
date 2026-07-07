import { expect, test } from "@playwright/test";

test.describe("Public verify (B2B contract)", () => {
  test("verify lookup page renders form", async ({ page }) => {
    await page.goto("/verify", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Verifikasi Kontrak B2B" })).toBeVisible();
    await expect(page.getByLabel("Nomor pesanan / kontrak")).toBeVisible();
    await expect(page.getByRole("button", { name: "Verifikasi" })).toBeVisible();
  });

  test("submit navigates to verify detail route", async ({ page }) => {
    await page.goto("/verify", { waitUntil: "networkidle" });
    await page.getByLabel("Nomor pesanan / kontrak").fill("BISA-SEED-CONF-01");
    await page.getByRole("button", { name: "Verifikasi" }).click();
    await expect(page).toHaveURL(/\/verify\/BISA-SEED-CONF-01/);
  });
});
