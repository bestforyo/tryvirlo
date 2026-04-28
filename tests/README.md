# Testing Guide

## Overview

This project uses a comprehensive testing strategy with three types of tests:
- **Unit Tests**: Test individual functions and utilities in isolation
- **Integration Tests**: Test API routes and database interactions
- **E2E Tests**: Test complete user flows in the browser

## Tools Used

- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end browser testing
- **Prisma**: Database test utilities

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

## Test Structure

```
tests/
├── setup.ts              # Global test configuration and mocks
├── utils/
│   └── test-helpers.ts   # Reusable test utilities
├── unit/
│   └── utils/
│       └── credits.test.ts  # Unit tests for credits utility
├── integration/
│   └── api/
│       ├── generate.test.ts # API route tests
│       └── status.test.ts    # Status endpoint tests
└── e2e/
    └── user-flow.spec.ts    # E2E user flow tests
```

## Writing Tests

### Unit Tests

Unit tests should be fast and isolated. Mock all external dependencies.

```typescript
import { describe, it, expect } from 'vitest';
import { calculateCredits } from '@/lib/utils/credits';

describe('calculateCredits', () => {
  it('should calculate correctly for 1080p video', () => {
    const credits = calculateCredits('TEXT_TO_VIDEO', 10, '1080p');
    expect(credits).toBe(100);
  });
});
```

### Integration Tests

Integration tests use the actual database but mock external services.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/generate/route';

describe('POST /api/generate', () => {
  beforeEach(async () => {
    // Clean database before each test
    await cleanupTestData();
  });

  it('should create generation and deduct credits', async () => {
    // Arrange: Create test user
    const user = await createTestUser({ creditsBalance: 1000 });

    // Act: Make request
    const response = await POST(mockRequest(user));

    // Assert: Verify results
    expect(response.status).toBe(200);
    // ... more assertions
  });
});
```

### E2E Tests

E2E tests test the actual user experience in a browser.

```typescript
import { test, expect } from '@playwright/test';

test('user can navigate to pricing', async ({ page }) => {
  await page.goto('/');

  await page.click('text=Pricing');
  await expect(page).toHaveURL(/\/pricing/);
  await expect(page.locator('h1')).toContainText('Pricing');
});
```

## Test Utilities

Use the helper functions in `tests/utils/test-helpers.ts`:

```typescript
import { createTestUser, createTestGeneration, cleanupTestData } from '@/tests/utils/test-helpers';

// Create a test user with custom credits
const user = await createTestUser({ creditsBalance: 500, plan: 'LITE' });

// Create a test generation
const generation = await createTestGeneration(user.id, {
  status: 'PROCESSING',
  modelId: 'pollo-3.0'
});

// Clean up after test
await cleanupTestData(user.id);
```

## CI/CD Integration

Tests run automatically in CI:

```yaml
# Example GitHub Actions
- name: Run unit tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e
```

## Coverage Goals

- **Critical paths**: >90% coverage
- **Utilities**: >80% coverage
- **API routes**: >70% coverage
- **Components**: >60% coverage

## Common Patterns

### Mocking External Services

```typescript
vi.mock('@/lib/auth/supabase', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'test-user', email: 'test@example.com' })
}));
```

### Testing Error Cases

```typescript
it('should return 402 when user has insufficient credits', async () => {
  const user = await createTestUser({ creditsBalance: 10 });
  const response = await POST(mockRequest(user));

  expect(response.status).toBe(402);
  const data = await response.json();
  expect(data.error).toBe('INSUFFICIENT_CREDITS');
});
```

### Testing Async Operations

```typescript
it('should refund credits on failed generation', async () => {
  const user = await createTestUser({ creditsBalance: 100 });
  await triggerGenerationFailure(user.id);

  // Wait for async refund
  await new Promise(resolve => setTimeout(resolve, 100));

  const updatedUser = await getUser(user.id);
  expect(updatedUser.creditsBalance).toBe(100);
});
```

## Debugging Tests

### Vitest Debugging

```bash
# Run with inspector
node --inspect-brk node_modules/.bin/vitest --inspect-brk
```

### Playwright Debugging

```bash
# Run with debug mode
npm run test:e2e:debug

# Or use the UI
npm run test:e2e:ui
```

## Best Practices

1. **Test names should describe behavior**: "should return 401 when user is not authenticated"
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Clean up after tests**: Use beforeEach/afterEach hooks
4. **Mock external dependencies**: Don't make real API calls in tests
5. **Test edge cases**: Not just happy path
6. **Keep tests fast**: Use `test.skip()` for slow tests during development
7. **Use descriptive assertions**: `expect(response.status).toBe(401)` not `expect(response.status)`
