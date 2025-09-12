import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContactPage } from '@/components/contact';


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact.meta' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  };
}

export default async function Contact() {
  const { getContentService } = await import('@/lib/content-service');
  const contentService = getContentService(false);
  const siteSettings = await contentService.getSiteSettings();
  
  return <ContactPage siteSettings={siteSettings} />;
}