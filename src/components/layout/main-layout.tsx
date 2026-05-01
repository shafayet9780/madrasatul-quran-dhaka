'use client';

import { useEffect, useState } from 'react';
import Header from './header';
import Footer from './footer';
import AdmissionBanner from './admission-banner';
import WhatsAppSupport from '@/components/ui/whatsapp-support';
import { getContentService } from '@/lib/content-service';
import { useScrollVisibility } from '@/hooks/use-scroll-visibility';
import type { SiteSettings, FooterSettings } from '@/types/sanity';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(
    null
  );
  const isScrollVisible = useScrollVisibility();

  console.log(
    'MainLayout rendered. SiteSettings:',
    siteSettings?.admissionBanner
  );

  // Fetch site settings for header and footer
  useEffect(() => {
    const fetchSettings = async () => {
      const contentService = getContentService(false);
      const [site, footer] = await Promise.all([
        contentService.getSiteSettings(),
        contentService.getFooterSettings(),
      ]);
      setSiteSettings(site);
      setFooterSettings(footer);
    };

    fetchSettings();
  }, []);

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
