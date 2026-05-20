import { test, expect } from "@playwright/test";

test.describe("Basic functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the main page title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("SpecForge");
  });

  test("should display subtitle", async ({ page }) => {
    await expect(page.locator("text=スキーマ駆動の構造化設計書エディタ")).toBeVisible();
  });

  test("should show project title in sidebar", async ({ page }) => {
    await expect(page.locator("text=Project")).toBeVisible();
  });

  test("should display document list", async ({ page }) => {
    // Wait for the document list to be visible
    await expect(page.locator("aside")).toBeVisible();
    // Check for document items
    await expect(page.locator("aside").locator("text=画面設計書")).toBeVisible();
  });

  test("should display section list for selected document", async ({ page }) => {
    // Sections should be visible
    await expect(page.locator("text=概要")).toBeVisible();
  });

  test("should have edit and preview tabs", async ({ page }) => {
    await expect(page.locator("text=編集")).toBeVisible();
    await expect(page.locator("text=プレビュー")).toBeVisible();
  });

  test("should have export button", async ({ page }) => {
    await expect(page.locator("button:has-text('エクスポート')")).toBeVisible();
  });

  test("should have import button", async ({ page }) => {
    await expect(page.locator("button:has-text('インポート')")).toBeVisible();
  });

  test("should have project health button", async ({ page }) => {
    await expect(page.locator("button:has-text('プロジェクトヘルス')")).toBeVisible();
  });
});
