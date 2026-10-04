import type { Metadata } from 'next';
import { surveyFontVariables } from '@/components/survey/fonts';
import { AdminNav } from './AdminNav';
import '@/components/survey/tokens.css';
import './admin.css';

export const metadata: Metadata = {
  title: { template: '%s · রিভিউ রিপোর্ট', default: 'রিভিউ রিপোর্ট' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`sv-root sv-admin ${surveyFontVariables} flex flex-wrap items-start`}>
      <AdminNav />
      <main className="min-w-0 flex flex-col gap-5" style={{ flex: '999 1 560px', padding: '22px 28px 48px' }}>
        {children}
      </main>
    </div>
  );
}
