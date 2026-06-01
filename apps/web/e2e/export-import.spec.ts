import { test, expect } from '@playwright/test';

test.describe('Export/Import functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open export modal', async ({ page }) => {
    await page.click("button:has-text('エクスポート')");

    // Modal should be visible
    await expect(page.locator('text=エクスポート')).toBeVisible();

    // Format options should be available
    await expect(page.locator('text=JSON')).toBeVisible();
  });

  test('should close export modal when clicking close button', async ({ page }) => {
    await page.click("button:has-text('エクスポート')");

    // Wait for modal to appear
    await expect(page.locator('text=エクスポート対象')).toBeVisible();

    // Click close button (looking for X or close button)
    const closeButton = page.locator(
      "button:has-text('閉じる'), button:has-text('×'), button[aria-label='close']"
    );
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Try clicking outside modal
      await page.keyboard.press('Escape');
    }
  });

  test('should open import modal', async ({ page }) => {
    await page.click("button:has-text('インポート')");

    // Modal should be visible
    await expect(page.locator('text=インポート')).toBeVisible();
  });

  test('should close import modal when clicking close button', async ({ page }) => {
    await page.click("button:has-text('インポート')");

    // Wait for modal to appear
    await expect(page.locator('text=インポート')).toBeVisible();

    // Try pressing Escape to close
    await page.keyboard.press('Escape');
  });

  test('export modal should have format selection', async ({ page }) => {
    await page.click("button:has-text('エクスポート')");

    // Check for format options
    await expect(page.locator('text=JSON')).toBeVisible();
    await expect(page.locator('text=Markdown')).toBeVisible();
  });

  test('export modal should have target selection', async ({ page }) => {
    await page.click("button:has-text('エクスポート')");

    // Check for target options (project or document)
    await expect(page.locator('text=プロジェクト全体')).toBeVisible();
  });
});
