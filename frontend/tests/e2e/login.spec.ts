import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveTitle(/Login|Barbershop/);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Entrar")').first()).toBeVisible();
  });
});
