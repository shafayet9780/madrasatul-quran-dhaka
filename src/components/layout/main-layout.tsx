'use client';

import { usePathname } from 'next/navigation';
import AdmissionBanner from './admission-banner';
import { ApplyBar } from './apply-bar';
import { AdmissionCtaProvider } from './admission-cta-context';
import type { AdmissionCta } from '@/lib/admissions/intake';

const FOCUSED_FLOW = /^\/(bengali|english)\/pre-admission\/(start|form|pledge|review|status|find)(\/|$)/;

interface MainLayoutProps {
  children: React.ReactNode;
  // Server-rendered in the locale layout (they read the CMS); this client shell only decides where they show.
  header: React.ReactNode;
  footer: React.ReactNode;
  skipLabel: string;
  admissionCta: AdmissionCta | null;
}

export default function MainLayout({ children, header, footer, skipLabel, admissionCta }: MainLayoutProps) {
  const pathname = usePathname();

  // The application flow has its own focused header and no footer.
  if (FOCUSED_FLOW.test(pathname)) return <>{children}</>;

  return (
    <AdmissionCtaProvider value={admissionCta}>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-15 text-surface focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {skipLabel}
      </a>
      <div className="flex min-h-screen flex-col">
        <AdmissionBanner />
        {header}
        <main id="main" className="flex-1">
          {children}
        </main>
        {footer}
        <ApplyBar />
      </div>
    </AdmissionCtaProvider>
  );
}
