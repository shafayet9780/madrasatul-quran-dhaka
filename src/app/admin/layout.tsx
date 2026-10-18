import type { Metadata } from 'next';
import { adminFontVariables } from '@/components/survey/fonts';
import { admissionsNav } from '@/lib/admissions/admin';
import { shellData } from '@/lib/survey/admin-shell';
import { AdminShell } from './AdminShell';
import '../globals.css';
import '@/components/survey/tokens.css';
import './admin.css';

export const metadata: Metadata = {
  title: { template: '%s · অ্যাডমিন', default: 'অ্যাডমিন' },
  robots: { index: false, follow: false },
  icons: { icon: '/api/favicon' },
};

/** The admin's root layout (Bengali; the public site's is src/app/[locale]/layout.tsx). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [data, admissions] = await Promise.all([shellData(), admissionsNav()]);
  return (
    <html lang="bn" className={adminFontVariables}>
      <body className="font-bengali antialiased">
        <div className="sv-root sv-admin">
          <AdminShell data={data} admissions={admissions}>
            {children}
          </AdminShell>
        </div>
      </body>
    </html>
  );
}
