import type { Metadata } from 'next';
import { surveyFontVariables } from '@/components/survey/fonts';
import { shellData } from '@/lib/survey/admin-shell';
import { AdminShell } from './AdminShell';
import '@/components/survey/tokens.css';
import './admin.css';

export const metadata: Metadata = {
  title: { template: '%s · রিভিউ রিপোর্ট', default: 'রিভিউ রিপোর্ট' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`sv-root sv-admin ${surveyFontVariables}`}>
      <AdminShell data={await shellData()}>{children}</AdminShell>
    </div>
  );
}
