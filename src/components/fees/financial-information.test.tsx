import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FinancialInformation, financialLinks } from './financial-information';
import { initialFeeSettings } from '@/lib/fee-setup';
import {
  ApplicationAction,
  ContactPanel,
} from '@/components/admissions/contact-panel';
vi.mock('@/lib/analytics/track', () => ({
  trackClickToWhatsapp: vi.fn(),
  trackClickToCall: vi.fn(),
}));
afterEach(cleanup);
describe('financial information', () => {
  it('shows fees, transport, eligibility and no aggregate or percentage claims', () => {
    render(
      <FinancialInformation settings={initialFeeSettings} locale="english" />
    );
    expect(screen.getAllByText(/6,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not applicable').length).toBeGreaterThan(0);
    expect(screen.getByText('Optional · Monthly')).toBeInTheDocument();
    expect(screen.getByText('Applies to: Tuition')).toBeInTheDocument();
    expect(
      screen.queryByText(/total|estimate|calculator|25%/i)
    ).not.toBeInTheDocument();
  });
  it('renders Bengali values and hides empty optional sections and links', () => {
    const settings = { ...initialFeeSettings, transport: [], discounts: [] };
    render(<FinancialInformation settings={settings} locale="bengali" />);
    expect(screen.getAllByText(/৬,০০০/).length).toBeGreaterThan(0);
    expect(document.querySelector('#transport')).toBeNull();
    expect(financialLinks(settings, 'bengali').map(l => l.id)).toEqual([
      'fees',
      'payment',
    ]);
  });
  it('shows a contact fallback instead of static prices', () => {
    render(<FinancialInformation settings={null} locale="english" />);
    expect(
      screen.getByText('Please contact the office for current fee information.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  it('omits hidden fees and shows custom frequency and distinct vehicle prices', () => {
    const settings = structuredClone(initialFeeSettings);
    settings.fees[0].visible = false;
    settings.fees[1].frequency = 'custom';
    settings.fees[1].customFrequency = {
      english: 'Per term',
      bengali: 'প্রতি টার্ম',
    };
    settings.transport[0].price = { status: 'priced', amount: 1200 };
    settings.transport[1].price = { status: 'priced', amount: 800 };
    render(<FinancialInformation settings={settings} locale="english" />);
    expect(screen.queryByText('Tuition')).not.toBeInTheDocument();
    expect(screen.getAllByText('Per term').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1,200/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/800/).length).toBeGreaterThan(0);
  });
});
it('changes primary action with form availability and preserves locale', () => {
  const { rerender } = render(<ApplicationAction available locale="english" />);
  expect(screen.getByRole('link')).toHaveAttribute(
    'href',
    '/english/pre-admission'
  );
  rerender(<ApplicationAction available={false} locale="bengali" />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/bengali/contact');
});
it('does not render broken contact buttons', () => {
  render(
    <ContactPanel
      locale="english"
      contact={{ admissionsPhone: 'invalid', whatsappNumber: 'invalid' }}
    />
  );
  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/english/contact');
});
