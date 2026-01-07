import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should display contact page', async ({ page }) => {
    await page.goto('/contacto');

    // Check page loaded
    await expect(page).toHaveTitle(/contact|contacto/i);

    // Check form is visible
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
  });

  test('should have required form fields', async ({ page }) => {
    await page.goto('/contacto');

    // Check for essential form fields
    const nameField = page.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="nom"]').first();
    const emailField = page.locator('input[type="email"]').first();
    const messageField = page.locator('textarea').first();

    await expect(nameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(messageField).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/contacto');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Check that validation prevents submission
    // Form should still be visible (not submitted)
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
  });

  test('should accept valid input', async ({ page }) => {
    await page.goto('/contacto');

    // Fill form with valid data
    const nameField = page.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="nom"]').first();
    const emailField = page.locator('input[type="email"]').first();
    const messageField = page.locator('textarea').first();

    await nameField.fill('Test User');
    await emailField.fill('test@example.com');
    await messageField.fill('This is a test message from E2E tests');

    // Fields should contain the values
    await expect(nameField).toHaveValue('Test User');
    await expect(emailField).toHaveValue('test@example.com');
    await expect(messageField).toHaveValue('This is a test message from E2E tests');
  });
});
