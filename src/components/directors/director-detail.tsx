'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Mail, Facebook, Linkedin, Twitter, Globe } from 'lucide-react';
import { RichText } from '@/components/ui/rich-text';
import { ProfileAvatar } from '@/components/people/profile-avatar';
import {
  ProfileBreadcrumb,
  SectionHeading,
  Qualifications,
  EducationSection,
} from '@/components/people/profile-sections';
import { getLocalizedText, getFontClass, type Language } from '@/lib/sanity-utils';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { Director, ProfileSocialLink } from '@/types/sanity';

const ICONS = { email: Mail, facebook: Facebook, linkedin: Linkedin, twitter: Twitter, website: Globe } as const;

function SocialLinks({ links }: { links: ProfileSocialLink[] }) {
  return (
    <div className="mt-5 flex justify-center gap-3">
      {links.map((link) => {
        const Icon = ICONS[link.platform] ?? Globe;
        const href = link.platform === 'email' && !link.url.startsWith('mailto:') ? `mailto:${link.url}` : link.url;
        return (
          <a
            key={link.platform + link.url}
            href={href}
            target={link.platform === 'email' ? undefined : '_blank'}
            rel="noopener noreferrer"
            aria-label={link.platform}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors hover:bg-primary-100 hover:text-primary-700"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}

interface DirectorDetailProps {
  director: Director;
  placeholders?: AvatarPlaceholders;
}

export function DirectorDetail({ director, placeholders }: DirectorDetailProps) {
  const locale = useLocale() as Language;
  const t = useTranslations('people');
  const td = useTranslations('directors');
  const font = getFontClass(locale);
  const name = getLocalizedText(director.name, locale);

  const message = director.message?.[locale];
  const bio = director.fullBio?.[locale];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container-custom py-4">
          <ProfileBreadcrumb
            language={locale}
            parentHref="/directors"
            parentLabel={td('title')}
            current={name}
          />
        </div>
      </div>

      <div className="container-custom grid gap-8 py-10 lg:grid-cols-[320px_1fr] md:py-14">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-gray-100">
            <ProfileAvatar
              photo={director.photo}
              gender={director.gender}
              placeholders={placeholders}
              name={name}
              className="mx-auto h-36 w-36 ring-4 ring-primary-100"
            />
            <h1 className={`mt-5 text-2xl font-bold text-gray-900 ${font}`}>{name}</h1>
            <p className={`mt-1 text-primary-600 ${font}`}>{getLocalizedText(director.designation, locale)}</p>
            {director.socialLinks && director.socialLinks.length > 0 && (
              <SocialLinks links={director.socialLinks} />
            )}
          </div>
        </aside>

        {/* Content */}
        <div className="space-y-10">
          {message && message.length > 0 && (
            <section className="rounded-2xl border-l-4 border-accent-400 bg-white p-6 shadow-sm md:p-8">
              <SectionHeading language={locale}>{t('message')}</SectionHeading>
              <RichText content={message} language={locale} />
              {director.signatureName && (
                <p className={`mt-4 text-right font-semibold text-primary-700 ${font}`}>
                  — {director.signatureName}
                </p>
              )}
            </section>
          )}

          {bio && bio.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <SectionHeading language={locale}>{t('biography')}</SectionHeading>
              <RichText content={bio} language={locale} />
            </section>
          )}

          {(director.qualifications || director.education) && (
            <section className="grid gap-8 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2 md:p-8">
              <Qualifications items={director.qualifications} language={locale} />
              <EducationSection items={director.education} language={locale} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
