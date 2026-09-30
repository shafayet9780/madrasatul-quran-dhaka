import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, expect, it, vi } from 'vitest';
import WhatsAppSupport from './whatsapp-support';

vi.mock('@/lib/analytics/track', () => ({ trackClickToWhatsapp: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it.each(['bengali', 'english'])(
  'shows and opens the configured WhatsApp number in %s',
  locale => {
    vi.useFakeTimers();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <NextIntlClientProvider locale={locale} messages={{}}>
        <WhatsAppSupport contact={{ whatsappNumber: '01712 345678' }} />
      </NextIntlClientProvider>
    );
    act(() => vi.advanceTimersByTime(3000));
    fireEvent.click(screen.getByRole('button', { name: 'WhatsApp Support' }));
    expect(screen.getByText(/\+8801712345678/)).toBeInTheDocument();
    expect(screen.queryByText(/01301-226644/)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: locale === 'bengali'
          ? 'WhatsApp-এ মেসেজ করুন'
          : 'Send WhatsApp Message',
      })
    );
    expect(open.mock.calls[0][0]).toMatch(/^https:\/\/wa.me\/8801712345678\?text=/);
  }
);
