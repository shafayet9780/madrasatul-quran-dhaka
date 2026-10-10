'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './header';
import Footer from './footer';
import AdmissionBanner from './admission-banner';
import { AdmissionCtaProvider } from './admission-cta-context';
import WhatsAppSupport from '@/components/ui/whatsapp-support';
import { useScrollVisibility } from '@/hooks/use-scroll-visibility';
import type { SiteSettings, FooterSettings } from '@/types/sanity';
import type { PeopleNavData } from '@/lib/queries/site';
import type { AdmissionCta } from '@/lib/admissions/intake';

const FOCUSED_FLOW = /^\/(bengali|english)\/pre-admission\/(start|form|review|status|find)(\/|$)/;

interface MainLayoutProps {
  children: React.ReactNode;
  // Fetched server-side in the locale layout and passed down. Cache Components
  // forbids importing the (server-only, `use cache`) content service into this
  // client component.
  siteSettings: SiteSettings | null;
  footerSettings: FooterSettings | null;
  peopleNav?: PeopleNavData;
  admissionCta: AdmissionCta | null;
}

export default function MainLayout({
  children,
  siteSettings,
  footerSettings,
  peopleNav,
  admissionCta,
}: MainLayoutProps) {
  const isScrollVisible = useScrollVisibility();
  const pathname = usePathname();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const showBanner = !!admissionCta && !bannerDismissed;

  // The application flow has its own focused header and no footer or chat button.
  if (FOCUSED_FLOW.test(pathname)) return <>{children}</>;

  return (
    <AdmissionCtaProvider value={admissionCta}>
      <div className="min-h-screen flex flex-col">
        {/* Fixed Header Container */}
        <div
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            transform: isScrollVisible ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {showBanner && <AdmissionBanner onDismiss={() => setBannerDismissed(true)} />}
          <Header siteSettings={siteSettings} peopleNav={peopleNav} />
        </div>

        <main
          className="flex-1"
          style={{
            paddingTop: showBanner
              ? 'calc(clamp(3.5rem, 4vw, 5.5rem) + 3rem)'
              : 'clamp(3.5rem, 4vw, 5.5rem)',
          }}
        >
          {children}
        </main>
        <Footer footerSettings={footerSettings} siteSettings={siteSettings} />
        <WhatsAppSupport contact={siteSettings?.contactInfo} />
      </div>
    </AdmissionCtaProvider>
  );
}
