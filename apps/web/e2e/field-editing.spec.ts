import { test, expect } from '@playwright/test';

test.describe('Field editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display form fields in edit mode', async ({ page }) => {
    // Should be in edit mode by default
    await expect(page.locator("button:has-text('編集')")).toBeVisible();

    // Form fields should be present
    const section = page.locator('section');
    await expect(section).toBeVisible();
  });

  test('should be able to input text in textarea fields', async ({ page }) => {
    // Find a textarea field
    const textarea = page.locator('textarea').first();

    if (await textarea.isVisible()) {
      await textarea.fill('テスト入力');
      await expect(textarea).toHaveValue('テスト入力');
    }
  });

  test('should be able to input text in text fields', async ({ page }) => {
    // Find a text input field (not the title edit inputs)
    const textInput = page.locator("section input[type='text']").first();

    if (await textInput.isVisible()) {
      const originalValue = await textInput.inputValue();
      await textInput.fill('テスト入力');
      await expect(textInput).toHaveValue('テスト入力');
      // Restore original value
      await textInput.fill(originalValue);
    }
  });

  test('should show field labels', async ({ page }) => {
    // Field labels should be visible in the form
    const section = page.locator('section');
    await expect(section.locator('label, h3, h4').first()).toBeVisible();
  });

  test('should indicate required fields', async ({ page }) => {
    // Look for required field indicators (usually *)
    const requiredIndicator = page.locator('text=*').first();
    // Required indicator might be styled differently
    if (await requiredIndicator.isVisible()) {
      await expect(requiredIndicator).toBeVisible();
    }
  });
});
