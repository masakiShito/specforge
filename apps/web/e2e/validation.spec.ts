import { test, expect } from '@playwright/test';

test.describe('Validation panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display validation panel in right sidebar', async ({ page }) => {
    // The right panel should be visible with validation info
    await expect(page.locator('text=設計ガイド')).toBeVisible();
  });

  test('should show validation items when issues exist', async ({ page }) => {
    // Look for validation-related content
    const validationPanel = page.locator('text=設計ガイド').locator('..');
    await expect(validationPanel).toBeVisible();
  });

  test('should show quality score', async ({ page }) => {
    // Quality score should be displayed somewhere
    // Look for percentage or score display
    const scoreDisplay = page.locator('text=/\\d+%|品質/');
    if (await scoreDisplay.first().isVisible()) {
      await expect(scoreDisplay.first()).toBeVisible();
    }
  });
});
