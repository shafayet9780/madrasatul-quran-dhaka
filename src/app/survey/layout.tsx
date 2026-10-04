import type { Metadata, Viewport } from 'next';
import { surveyFontVariables } from '@/components/survey/fonts';
import '@/components/survey/tokens.css';
import './survey.css';

export const metadata: Metadata = {
  title: { template: '%s · মাদরাসাতুল কুরআন', default: 'রিভিউ · মাদরাসাতুল কুরআন' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#FCFBF8' };

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return <div className={`sv-root sv-survey ${surveyFontVariables}`}>{children}</div>;
}
