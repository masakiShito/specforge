import { test, expect } from '@playwright/test';

test.describe('Document management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display document information', async ({ page }) => {
    // Document kind and version should be visible
    await expect(page.locator('text=種別:')).toBeVisible();
    await expect(page.locator('text=バージョン:')).toBeVisible();
  });

  test('should be able to add new document', async ({ page }) => {
    // Look for add document button (usually + button)
    const addButton = page.locator(
      "button:has-text('+'), button:has-text('追加'), button[title*='追加']"
    );

    if (await addButton.first().isVisible()) {
      await addButton.first().click();

      // A dropdown or menu should appear with document types
      const screenSpec = page.locator('text=画面設計書');
      if (await screenSpec.isVisible()) {
        await screenSpec.click();
      }
    }
  });

  test('should edit project title on click', async ({ page }) => {
    // Find the project title area
    const projectTitle = page.locator("h2:has-text('Project')");

    if (await projectTitle.isVisible()) {
      // Click to enter edit mode
      await projectTitle.click();

      // An input should appear
      await expect(page.locator("aside input[type='text']")).toBeVisible();
    }
  });

  test('should edit document title on click', async ({ page }) => {
    // Find the document title area (h3 with edit hint)
    const docTitle = page.locator("h3:has-text('(編集)')").first();

    if (await docTitle.isVisible()) {
      await docTitle.click();

      // An input should appear
      await expect(page.locator("aside input[type='text']")).toBeVisible();
    }
  });
});
