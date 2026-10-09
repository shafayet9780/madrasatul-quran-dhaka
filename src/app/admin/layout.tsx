import type { Metadata } from 'next';
import { adminFontVariables } from '@/components/survey/fonts';
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
  const [data, admissions] = await Promise.all([shellData(), admissionsNav()]);
  return (
    <div className={`sv-root sv-admin ${adminFontVariables}`}>
      <AdminShell data={data} admissions={admissions}>
        {children}
      </AdminShell>
    </div>
  );
}
