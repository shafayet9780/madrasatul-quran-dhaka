import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { getAdmissionsContact } from '@/lib/admissions-contact';
import { txt } from '@/lib/admissions/display';
import { sitePhone } from '@/lib/site/phone';
import { dhakaToday, newestFirst, NOTICE_TYPES, toNotice, type Notice, type NoticeAttachmentIn, type NoticeIn } from '@/lib/notices/notices';
import type { NoticeLabels } from './notice-row';

/** The notices the board can show, in the page's language, newest first. */
export const noticesIn = (raw: NoticeIn[], locale: Locale): Notice[] => {
  const today = dhakaToday();
  return raw.flatMap((n) => toNotice(n, locale, today) ?? []).sort(newestFirst);
};

/** A picture's address on the page (wide enough for the sheet), and the full picture a tap opens. */
export const pictureSrc = (a: NoticeAttachmentIn) => a.src ?? urlFor(a).width(1400).fit('max').url();
export const pictureFull = (a: NoticeAttachmentIn) => a.src ?? urlFor(a).url();

/** The link preview of a notice with a picture: its top, where a paper notice has its heading. */
export const noticeShareImage = (n: Notice) => {
  const first = n.pictures[0];
  return first?.attachment.asset?._ref ? { url: urlFor(first.attachment).width(1200).height(630).fit('crop').crop('top').url(), alt: first.alt || n.title } : undefined;
};

/** The office's phone and hours (School details → Contact), for questions about a notice. */
export function officeContact(settings: SiteSettings | null, locale: Locale) {
  const contact = settings?.contactInfo;
  return { phone: sitePhone(getAdmissionsContact(contact).phone ?? undefined, locale), hours: txt(contact?.officeHours, locale).trim() };
}

/** The words every list of notices shares: the number, the marks and the types. */
export async function noticeWords(locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'notices' });
  const labels: NoticeLabels = {
    number: t.raw('number') as string,
    new: t('new'),
    pinned: t('board.pinned'),
    pdf: t('pdf'),
    picture: t('picture'),
    types: Object.fromEntries(NOTICE_TYPES.map((k) => [k, t(`types.${k}`)])) as NoticeLabels['types'],
  };
  return { t, labels };
}
