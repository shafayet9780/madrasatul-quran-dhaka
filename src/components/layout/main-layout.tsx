import Header from './header';
import Footer from './footer';
import { getContentService } from '@/lib/content-service';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  // Fetch site settings for header and footer
  const contentService = getContentService(false);
  const siteSettings = await contentService.getSiteSettings();

  return (
    <div className="min-h-screen flex flex-col">
      <Header siteSettings={siteSettings} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}