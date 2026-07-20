import { expect, test } from '@playwright/test'

test.describe('share-only downloads library', () => {
  test('shows the localized invalid-link state without an access cookie', async ({ page }) => {
    await page.goto('/english/downloads')
    await expect(page.getByRole('heading', { name: 'Link invalid or expired' })).toBeVisible()

    await page.goto('/bengali/downloads')
    await expect(page.getByRole('heading', { name: 'লিংকটি অবৈধ অথবা মেয়াদ শেষ' })).toBeVisible()
  })
})
