import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { pickMessages, SHARED_CLIENT_MESSAGES } from '@/lib/i18n-messages';

/**
 * A section's own text for its client components (pre-admission, teachers, news), with the shared messages: the root
 * layout sends the browser the shared ones only (src/lib/i18n-messages.ts).
 */
export async function ClientMessages({ locale, keys, children }: { locale: string; keys: string[]; children: React.ReactNode }) {
  const messages = await getMessages({ locale });
  return <NextIntlClientProvider messages={pickMessages(messages, [...SHARED_CLIENT_MESSAGES, ...keys])}>{children}</NextIntlClientProvider>;
}
