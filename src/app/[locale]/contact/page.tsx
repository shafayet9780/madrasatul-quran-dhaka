import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContactPage } from '@/components/contact';

interface ContactPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
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

export default async function Contact({ params }: ContactPageProps) {
  const { getContentService } = await import('@/lib/content-service');
  const contentService = getContentService(false);
  const siteSettings = await contentService.getSiteSettings();
  
  return <ContactPage siteSettings={siteSettings} />;
}