'use client';

import Header from './header';
import Footer from './footer';
import AdmissionBanner from './admission-banner';
import WhatsAppSupport from '@/components/ui/whatsapp-support';
import { useScrollVisibility } from '@/hooks/use-scroll-visibility';
import type { SiteSettings, FooterSettings } from '@/types/sanity';

interface MainLayoutProps {
  children: React.ReactNode;
  // Fetched server-side in the locale layout and passed down. Cache Components
  // forbids importing the (server-only, `use cache`) content service into this
  // client component.
  siteSettings: SiteSettings | null;
  footerSettings: FooterSettings | null;
}

export default function MainLayout({
  children,
  siteSettings,
  footerSettings,
}: MainLayoutProps) {
  const isScrollVisible = useScrollVisibility();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header Container */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          transform: isScrollVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {siteSettings?.admissionBanner?.isEnabled && (
          <AdmissionBanner bannerConfig={siteSettings.admissionBanner} />
        )}
        <Header siteSettings={siteSettings} />
      </div>

      <main
        className="flex-1"
        style={{
          paddingTop: siteSettings?.admissionBanner?.isEnabled
            ? 'calc(clamp(3.5rem, 4vw, 5.5rem) + 4rem)'
            : 'clamp(3.5rem, 4vw, 5.5rem)',
        }}
      >
        {children}
      </main>
      <Footer footerSettings={footerSettings} siteSettings={siteSettings} />
      <WhatsAppSupport />
    </div>
  );
}
