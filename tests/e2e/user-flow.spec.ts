import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show Google OAuth button on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });

  test('should display terms and privacy links', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('a[href="/terms"]')).toBeVisible();
    await expect(page.locator('a[href="/privacy"]')).toBeVisible();
  });
});

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('AI Video');
  });

  test('should display tool cards', async ({ page }) => {
    await page.goto('/');

    // Check for tool cards
    await expect(page.locator('text=Text to Video')).toBeVisible();
    await expect(page.locator('text=Image to Video')).toBeVisible();
    await expect(page.locator('text=Text to Image')).toBeVisible();
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');

    await page.click('text=Pricing');
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.locator('h1')).toContainText('Pricing');
  });

  test('should navigate to login when clicking Get Started', async ({ page }) => {
    await page.goto('/');

    const getStartedButton = page.locator('text=Get Started').first();
    await getStartedButton.click();

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Pricing Page', () => {
  test('should display all pricing tiers', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.locator('text=Lite')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should toggle between monthly and yearly billing', async ({ page }) => {
    await page.goto('/pricing');

    // Default is monthly
    await expect(page.locator('text=$9')).toBeVisible();
    await expect(page.locator('text=$79')).not.toBeVisible();

    // Click yearly
    await page.click('text=Yearly');

    // Should show yearly prices
    await expect(page.locator('text=$79')).toBeVisible();
    await expect(page.locator('text=$9')).not.toBeVisible();
  });

  test('should show savings badge on yearly toggle', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.locator('text=Save 30%')).toBeVisible();
  });

  test('should highlight Pro plan as most popular', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.locator('text=Most Popular')).toBeVisible();
  });

  test('should display credits reference table', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.locator('text=How Credits Work')).toBeVisible();
    await expect(page.locator('text=Text to Video')).toBeVisible();
    await expect(page.locator('text=Image to Video')).toBeVisible();
  });
});

test.describe('Legal Pages', () => {
  test('should display Terms of Service', async ({ page }) => {
    await page.goto('/terms');

    await expect(page.locator('h1')).toContainText('Terms of Service');
    await expect(page.locator('text=Acceptance of Terms')).toBeVisible();
    await expect(page.locator('text=User Responsibilities')).toBeVisible();
  });

  test('should display Privacy Policy', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page.locator('h1')).toContainText('Privacy Policy');
    await expect(page.locator('text=Information We Collect')).toBeVisible();
    await expect(page.locator('text=Data Storage and Security')).toBeVisible();
  });

  test('should display Contact page with form', async ({ page }) => {
    await page.goto('/contact');

    await expect(page.locator('h1')).toContainText('Contact Us');

    // Check form fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();

    // Check contact info cards
    await expect(page.locator('text=support@tryvirlo.com')).toBeVisible();
    await expect(page.locator('text=business@tryvirlo.com')).toBeVisible();
  });

  test('should validate contact form submission', async ({ page }) => {
    await page.goto('/contact');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Browser validation should prevent submission
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });
});

test.describe('Navigation', () => {
  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Test Tools link
    await page.click('text=Tools');
    await expect(page).toHaveURL(/\/tools/);

    // Test Pricing link
    await page.click('text=Pricing');
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('should display breadcrumbs on inner pages', async ({ page }) => {
    await page.goto('/text-to-video');

    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Tools')).toBeVisible();
    await expect(page.locator('text=Text to Video')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('should display tool cards correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Tools should stack vertically on mobile
    const toolsGrid = page.locator('.grid');
    const box = await toolsGrid.boundingBox();
    expect(box?.width).toBeLessThan(400); // Should be narrow on mobile
  });
});
