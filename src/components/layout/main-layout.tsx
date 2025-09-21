import Header from './header';
import Footer from './footer';
import AdmissionBanner from './admission-banner';
import WhatsAppSupport from '@/components/ui/whatsapp-support';
import { getContentService } from '@/lib/content-service';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  // Fetch site settings for header and footer
  const contentService = getContentService(false);
  const siteSettings = await contentService.getSiteSettings();
  const footerSettings = await contentService.getFooterSettings();

  return (
    <div className="min-h-screen flex flex-col">
      <AdmissionBanner bannerConfig={siteSettings?.admissionBanner} />
      <Header siteSettings={siteSettings} />
      <main className="flex-1">
        {children}
      </main>
      <Footer footerSettings={footerSettings} siteSettings={siteSettings} />
      <WhatsAppSupport />
    </div>
  );
}