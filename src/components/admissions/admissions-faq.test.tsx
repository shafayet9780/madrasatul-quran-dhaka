import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdmissionsFaq } from './admissions-faq';
import { initialFeeSettings } from '@/lib/fee-setup';
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));
afterEach(cleanup);
it('replaces the financial FAQ and links only to a visible discount section', async () => {
  const { unmount } = render(
    await AdmissionsFaq({ locale: 'english', settings: initialFeeSettings })
  );
  expect(
    screen.getByText(initialFeeSettings.faqAnswer.english)
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { hidden: true })).toHaveAttribute(
    'href',
    '#discounts'
  );
  unmount();
  render(
    await AdmissionsFaq({
      locale: 'english',
      settings: { ...initialFeeSettings, discounts: [] },
    })
  );
  expect(screen.queryByRole('link', { hidden: true })).not.toBeInTheDocument();
});
