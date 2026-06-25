import { headers } from 'next/headers';
import { AnalyticsRoot } from './analytics-provider';
import { AnalyticsClientUI } from './analytics-client-ui';

export async function AnalyticsShell({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const countryCode = headerStore.get('x-vercel-ip-country');

  return (
    <AnalyticsRoot countryCode={countryCode}>
      <AnalyticsClientUI>{children}</AnalyticsClientUI>
    </AnalyticsRoot>
  );
}
