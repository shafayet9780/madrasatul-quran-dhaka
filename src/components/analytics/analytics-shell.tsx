import { AnalyticsRoot } from './analytics-provider';
import { AnalyticsClientUI } from './analytics-client-ui';

/** Consent and Google Tag Manager around the public site. The visitor's country is read in the browser (a cookie). */
export function AnalyticsShell({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsRoot>
      <AnalyticsClientUI>{children}</AnalyticsClientUI>
    </AnalyticsRoot>
  );
}
