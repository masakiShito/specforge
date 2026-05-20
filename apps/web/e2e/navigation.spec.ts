import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should switch between edit and preview modes", async ({ page }) => {
    // Default should be edit mode
    await expect(page.locator("button:has-text('編集')")).toBeVisible();

    // Click preview tab
    await page.click("button:has-text('プレビュー')");

    // Preview content should be visible
    await expect(page.locator("text=プレビュー")).toBeVisible();

    // Click edit tab to return
    await page.click("button:has-text('編集')");
  });

  test("should navigate to project health view", async ({ page }) => {
    await page.click("button:has-text('プロジェクトヘルス')");

    // Health dashboard should be visible
    await expect(page.locator("text=プロジェクト品質")).toBeVisible();

    // Return to editor
    await page.click("button:has-text('エディタに戻る')");

    // Should be back in editor mode
    await expect(page.locator("text=編集")).toBeVisible();
  });

  test("should select different sections", async ({ page }) => {
    // Find and click on a section in the sidebar
    const sectionList = page.locator("aside");

    // Click on UI要素 section if it exists
    const uiSection = sectionList.locator("text=UI要素");
    if (await uiSection.isVisible()) {
      await uiSection.click();
      // The section form should update to show UI elements content
      await expect(page.locator("section")).toBeVisible();
    }
  });

  test("should be able to select different documents", async ({ page }) => {
    // Wait for document list to load
    await expect(page.locator("aside")).toBeVisible();

    // Find API document if exists
    const apiDoc = page.locator("text=API設計書");
    if (await apiDoc.isVisible()) {
      await apiDoc.click();
      // The document content should change
      await expect(page.locator("text=API")).toBeVisible();
    }
  });
});
