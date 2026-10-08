import type { Metadata } from 'next';
import { surveyFontVariables } from '@/components/survey/fonts';
import { admissionsNav } from '@/lib/admissions/admin';
import { shellData } from '@/lib/survey/admin-shell';
import { AdminShell } from './AdminShell';
import '@/components/survey/tokens.css';
import './admin.css';

export const metadata: Metadata = {
  title: { template: '%s · অ্যাডমিন', default: 'অ্যাডমিন' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`sv-root sv-admin ${surveyFontVariables}`}>
      <AdminShell data={await shellData()} admissions={await admissionsNav()}>
        {children}
      </AdminShell>
    </div>
  );
}
