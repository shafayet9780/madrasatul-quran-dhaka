import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { getContentService } from '@/lib/content-service';
import { curriculumPlan, type LaneLabels } from './plan';

/** The curriculum from the Studio in the page's language (null while it is not usable: its sections are left out). */
export async function loadPlan(locale: Locale) {
  const [doc, t] = await Promise.all([getContentService(false).getCurriculum(), getTranslations({ locale, namespace: 'home.plan' })]);
  return curriculumPlan(doc, locale, t.raw('segments') as LaneLabels);
}
