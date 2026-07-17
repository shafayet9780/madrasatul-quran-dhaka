import { sanitizeAnalyticsPayload } from './sanitize';
import type {
  AnalyticsLocale,
  FileCategory,
  FormType,
  RegionBucket,
  SafeAnalyticsEvent,
  SafeAttribution,
} from './types';

function buildEvent(
  event: SafeAnalyticsEvent['event'],
  params: Record<string, string | number | boolean | null | undefined>
): SafeAnalyticsEvent {
  return sanitizeAnalyticsPayload({ event, ...params });
}

export function buildConsentDefault(params: {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  region: RegionBucket;
  consent_mode: string;
}): SafeAnalyticsEvent {
  return buildEvent('consent_default', params);
}

export function buildConsentUpdate(params: {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
}): SafeAnalyticsEvent {
  return buildEvent('consent_update', params);
}

export function buildPageView(params: {
  page_path: string;
  page_title: string;
  locale: AnalyticsLocale;
}): SafeAnalyticsEvent {
  return buildEvent('page_view', params);
}

export function buildGenerateLead(params: {
  form_type: FormType;
  locale: AnalyticsLocale;
  page_path: string;
  cta_source?: string | null;
  program_category?: string | null;
  attribution?: SafeAttribution;
}): SafeAnalyticsEvent {
  const { attribution, ...rest } = params;
  return buildEvent('generate_lead', { ...rest, ...attribution });
}

export function buildFormStart(params: {
  form_type: FormType;
  locale: AnalyticsLocale;
  page_path: string;
}): SafeAnalyticsEvent {
  return buildEvent('form_start', params);
}

export function buildFormSubmit(params: {
  form_type: FormType;
  locale: AnalyticsLocale;
  page_path: string;
  success: boolean;
}): SafeAnalyticsEvent {
  return buildEvent('form_submit', params);
}

export function buildFormAttempt(params: {
  form_type: FormType;
  locale: AnalyticsLocale;
  page_path: string;
}): SafeAnalyticsEvent {
  return buildEvent('form_attempt', params);
}

export function buildFileDownload(params: {
  file_category: FileCategory;
  locale: AnalyticsLocale;
  page_path: string;
  cta_source?: string | null;
}): SafeAnalyticsEvent {
  return buildEvent('file_download', params);
}

export function buildClickToCall(params: {
  cta_location: string;
  locale: AnalyticsLocale;
  page_path: string;
}): SafeAnalyticsEvent {
  return buildEvent('click_to_call', params);
}

export function buildClickToEmail(params: {
  cta_location: string;
  locale: AnalyticsLocale;
  page_path: string;
}): SafeAnalyticsEvent {
  return buildEvent('click_to_email', params);
}

export function buildClickToWhatsapp(params: {
  cta_location: string;
  locale: AnalyticsLocale;
  page_path: string;
}): SafeAnalyticsEvent {
  return buildEvent('click_to_whatsapp', params);
}

export function buildOutboundClick(params: {
  link_domain: string;
  locale: AnalyticsLocale;
  page_path: string;
  cta_location?: string | null;
}): SafeAnalyticsEvent {
  return buildEvent('outbound_click', params);
}

export function buildLanguageChange(params: {
  from_locale: AnalyticsLocale;
  to_locale: AnalyticsLocale;
  page_path: string;
}): SafeAnalyticsEvent {
  return buildEvent('language_change', params);
}

export function buildViewContent(params: {
  content_type: string;
  content_id: string;
  locale: AnalyticsLocale;
  page_path: string;
}): SafeAnalyticsEvent {
  return buildEvent('view_content', params);
}

export function buildException(params: {
  error_name: string;
  context?: string | null;
  page_path: string;
}): SafeAnalyticsEvent {
  return buildEvent('exception', params);
}
