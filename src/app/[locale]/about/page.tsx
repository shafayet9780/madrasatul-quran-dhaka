import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { sanityFetch } from '@/lib/sanity-fetch';
import { leadershipTeamQuery, pageBySlugQuery } from '@/lib/sanity-queries';
import {
  SchoolHistoryVision,
  LeadershipTeam,
  EducationalPhilosophy,
} from '@/components/about';
import type { StaffMember, Page } from '@/types/sanity';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function AboutPage() {
  try {
    // Fetch leadership team data
    const leaders = await sanityFetch<StaffMember[]>({
      query: leadershipTeamQuery,
      tags: ['staffMember'],
    });

    // Fetch page content for history and philosophy (optional - can be managed through CMS)
    let historyContent: Page | undefined = undefined;
    let visionContent: Page | undefined = undefined;
    let philosophyContent: Page | undefined = undefined;

    try {
      historyContent = await sanityFetch<Page>({
        query: pageBySlugQuery,
        params: { slug: 'school-history' },
        tags: ['page'],
      });
    } catch {
      // History content is optional - will use default content
    }

    try {
      visionContent = await sanityFetch<Page>({
        query: pageBySlugQuery,
        params: { slug: 'school-vision' },
        tags: ['page'],
      });
    } catch {
      // Vision content is optional - will use default content
    }

    try {
      philosophyContent = await sanityFetch<Page>({
        query: pageBySlugQuery,
        params: { slug: 'educational-philosophy' },
        tags: ['page'],
      });
    } catch {
      // Philosophy content is optional - will use default content
    }

    return (
      <>
        {/* School History and Vision Section */}
        <SchoolHistoryVision
          historyContent={historyContent}
          visionContent={visionContent}
        />

        {/* Leadership Team Section */}
        <LeadershipTeam leaders={leaders} />

        {/* Educational Philosophy and Accreditation Section */}
        <EducationalPhilosophy philosophyContent={philosophyContent} />
      </>
    );
  } catch (error) {
    console.error('Error loading about page:', error);
    notFound();
  }
}
