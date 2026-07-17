import type { AnalyticsLocale, FileCategory, FormType } from './types';
import {
  buildClickToCall,
  buildClickToEmail,
  buildClickToWhatsapp,
  buildException,
  buildFileDownload,
  buildFormAttempt,
  buildFormStart,
  buildFormSubmit,
  buildGenerateLead,
  buildLanguageChange,
  buildOutboundClick,
} from './events';
import { getAttributionForEvent } from './attribution';
import { pushTrackedEvent } from './push';
import { sanitizeCurrentPath } from './url';

function pagePath(): string {
  return sanitizeCurrentPath();
}

export function trackGenerateLead(params: {
  formType: FormType;
  locale: AnalyticsLocale;
  ctaSource?: string | null;
  programCategory?: string | null;
}): void {
  pushTrackedEvent(
    buildGenerateLead({
      form_type: params.formType,
      locale: params.locale,
      page_path: pagePath(),
      cta_source: params.ctaSource,
      program_category: params.programCategory,
      attribution: getAttributionForEvent('last_touch'),
    })
  );
}

export function trackFormStart(params: { formType: FormType; locale: AnalyticsLocale }): void {
  pushTrackedEvent(
    buildFormStart({
      form_type: params.formType,
      locale: params.locale,
      page_path: pagePath(),
    })
  );
}

export function trackFormSubmit(params: {
  formType: FormType;
  locale: AnalyticsLocale;
  success: boolean;
}): void {
  pushTrackedEvent(
    buildFormSubmit({
      form_type: params.formType,
      locale: params.locale,
      page_path: pagePath(),
      success: params.success,
    })
  );
}

export function trackFormAttempt(params: { formType: FormType; locale: AnalyticsLocale }): void {
  pushTrackedEvent(
    buildFormAttempt({
      form_type: params.formType,
      locale: params.locale,
      page_path: pagePath(),
    })
  );
}

export function trackFileDownload(params: {
  fileCategory: FileCategory;
  locale: AnalyticsLocale;
  ctaSource?: string | null;
}): void {
  pushTrackedEvent(
    buildFileDownload({
      file_category: params.fileCategory,
      locale: params.locale,
      page_path: pagePath(),
      cta_source: params.ctaSource,
    })
  );
}

export function trackClickToCall(params: {
  ctaLocation: string;
  locale: AnalyticsLocale;
}): void {
  pushTrackedEvent(
    buildClickToCall({
      cta_location: params.ctaLocation,
      locale: params.locale,
      page_path: pagePath(),
    })
  );
}

export function trackClickToEmail(params: {
  ctaLocation: string;
  locale: AnalyticsLocale;
}): void {
  pushTrackedEvent(
    buildClickToEmail({
      cta_location: params.ctaLocation,
      locale: params.locale,
      page_path: pagePath(),
    })
  );
}

export function trackClickToWhatsapp(params: {
  ctaLocation: string;
  locale: AnalyticsLocale;
}): void {
  pushTrackedEvent(
    buildClickToWhatsapp({
      cta_location: params.ctaLocation,
      locale: params.locale,
      page_path: pagePath(),
    })
  );
}

export function trackOutboundClick(params: {
  linkDomain: string;
  locale: AnalyticsLocale;
  ctaLocation?: string | null;
}): void {
  pushTrackedEvent(
    buildOutboundClick({
      link_domain: params.linkDomain,
      locale: params.locale,
      page_path: pagePath(),
      cta_location: params.ctaLocation,
    })
  );
}

export function trackLanguageChange(params: {
  fromLocale: AnalyticsLocale;
  toLocale: AnalyticsLocale;
}): void {
  pushTrackedEvent(
    buildLanguageChange({
      from_locale: params.fromLocale,
      to_locale: params.toLocale,
      page_path: pagePath(),
    })
  );
}

export function trackException(error: Error, context?: string): void {
  pushTrackedEvent(
    buildException({
      error_name: error.name,
      context: context ?? null,
      page_path: pagePath(),
    })
  );
}
