export type AnalyticsLocale = 'bengali' | 'english' | string;

export type RegionBucket = 'general' | 'regulated' | 'unknown';

export type ConsentStorage = 'granted' | 'denied';

export interface ConsentPreferences {
  analytics: boolean;
  advertising: boolean;
  updatedAt: string;
}

export interface EffectiveConsent {
  analytics: boolean;
  advertising: boolean;
  region: RegionBucket;
  requiresOptIn: boolean;
}

export type FormType =
  | 'pre_admission'
  | 'contact_general'
  | 'contact_admission'
  | 'contact_feedback'
  | 'admission_inquiry';

export type FileCategory = 'prospectus' | 'curriculum' | 'code_of_conduct';

export type AttributionModel = 'first_touch' | 'last_touch';

export interface SafeAttribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid_present?: boolean;
  fbclid_present?: boolean;
  landing_page?: string | null;
  referrer_domain?: string | null;
  attribution_model?: AttributionModel;
}

export type AnalyticsEventName =
  | 'consent_default'
  | 'consent_update'
  | 'page_view'
  | 'generate_lead'
  | 'form_start'
  | 'form_submit'
  | 'form_attempt'
  | 'file_download'
  | 'click_to_call'
  | 'click_to_email'
  | 'click_to_whatsapp'
  | 'outbound_click'
  | 'language_change'
  | 'view_content'
  | 'exception';

export interface SafeAnalyticsEvent {
  event: AnalyticsEventName;
  [key: string]: string | number | boolean | null | undefined;
}

export const CONSENT_STORAGE_KEY = 'mq-analytics-consent-v1';

export const FORBIDDEN_ANALYTICS_KEYS = [
  'email',
  'phone',
  'name',
  'message',
  'user_agent',
  'error_stack',
  'gclid',
  'fbclid',
  'file_name',
  'student_name',
  'guardian_name',
] as const;
