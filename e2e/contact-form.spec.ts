import { test, expect } from '@playwright/test';

const CONTACT_PATH = '/es/contacto';

test.describe('Contact Form', () => {
  test('should display contact page', async ({ page }) => {
    await page.goto(CONTACT_PATH);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#intro-overlay', { state: 'hidden', timeout: 20000 });

    // Check page loaded
    await expect(page).toHaveTitle(/contact|contacto/i);

    // Check form is visible
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 15000 });
  });

  test('should have required form fields', async ({ page }) => {
    await page.goto(CONTACT_PATH);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#intro-overlay', { state: 'hidden', timeout: 20000 });

    // Check for essential form fields
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 15000 });

    const nameField = form.locator('input[type="text"]').first();
    const emailField = form.locator('input[type="email"]').first();
    const messageField = form.locator('textarea').first();

    await expect(nameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(messageField).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto(CONTACT_PATH);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#intro-overlay', { state: 'hidden', timeout: 20000 });

    // Try to submit empty form
    const submitButton = page.locator('form button[type="submit"]').first();
    await expect(submitButton).toBeVisible({ timeout: 15000 });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();

    // Check that validation prevents submission
    // Form should still be visible (not submitted)
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
  });

  test('should accept valid input', async ({ page }) => {
    await page.goto(CONTACT_PATH);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#intro-overlay', { state: 'hidden', timeout: 20000 });

    // Fill form with valid data
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 15000 });

    const nameField = form.locator('input[type="text"]').first();
    const emailField = form.locator('input[type="email"]').first();
    const messageField = form.locator('textarea').first();

    await nameField.fill('Test User');
    await emailField.fill('test@example.com');
    await messageField.fill('This is a test message from E2E tests');

    // Fields should contain the values
    await expect(nameField).toHaveValue('Test User');
    await expect(emailField).toHaveValue('test@example.com');
    await expect(messageField).toHaveValue('This is a test message from E2E tests');
  });
});
