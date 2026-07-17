import { describe, it, expect } from 'vitest';
import {
  buildClickToCall,
  buildConsentDefault,
  buildConsentUpdate,
  buildFileDownload,
  buildFormAttempt,
  buildFormStart,
  buildFormSubmit,
  buildGenerateLead,
  buildLanguageChange,
  buildOutboundClick,
  buildPageView,
} from './events';
import { sanitizeAnalyticsPayload } from './sanitize';

describe('analytics event builders', () => {
  it('builds page_view with safe params', () => {
    const event = buildPageView({
      page_path: '/bengali/admissions?utm_source=google&gclid=raw-click-id&email=test@example.com',
      page_title: 'Admissions',
      locale: 'bengali',
    });

    expect(event).toEqual({
      event: 'page_view',
      page_path: '/bengali/admissions?utm_source=google',
      page_title: 'Admissions',
      locale: 'bengali',
    });
  });

  it('builds generate_lead with attribution fields', () => {
    const event = buildGenerateLead({
      form_type: 'pre_admission',
      locale: 'english',
      page_path: '/english/pre-admission',
      program_category: 'hifz',
      attribution: {
        utm_source: 'facebook',
        gclid_present: false,
        fbclid_present: true,
        attribution_model: 'last_touch',
      },
    });

    expect(event.event).toBe('generate_lead');
    expect(event.page_path).toBe('/english/pre-admission');
    expect(event.utm_source).toBe('facebook');
    expect(event.fbclid_present).toBe(true);
    expect(event.gclid_present).toBe(false);
  });

  it('builds form lifecycle events', () => {
    expect(
      buildFormStart({
        form_type: 'contact_general',
        locale: 'bengali',
        page_path: '/bengali/contact',
      }).event
    ).toBe('form_start');

    expect(
      buildFormAttempt({
        form_type: 'admission_inquiry',
        locale: 'english',
        page_path: '/english/admissions',
      }).event
    ).toBe('form_attempt');

    expect(
      buildFormSubmit({
        form_type: 'pre_admission',
        locale: 'english',
        page_path: '/english/pre-admission',
        success: false,
      }).success
    ).toBe(false);
  });

  it('builds engagement events', () => {
    expect(
      buildFileDownload({
        file_category: 'prospectus',
        locale: 'bengali',
        page_path: '/bengali',
      }).file_category
    ).toBe('prospectus');

    expect(
      buildClickToCall({
        cta_location: 'header',
        locale: 'english',
        page_path: '/english/contact',
      }).event
    ).toBe('click_to_call');

    expect(
      buildOutboundClick({
        link_domain: 'alquranervasha.com',
        locale: 'english',
        page_path: '/english',
      }).link_domain
    ).toBe('alquranervasha.com');

    expect(
      buildLanguageChange({
        from_locale: 'bengali',
        to_locale: 'english',
        page_path: '/bengali/about',
      }).to_locale
    ).toBe('english');
  });

  it('builds consent events', () => {
    expect(
      buildConsentDefault({
        analytics_storage: 'denied',
        ad_storage: 'denied',
        region: 'regulated',
        consent_mode: 'default',
      }).region
    ).toBe('regulated');

    expect(
      buildConsentUpdate({
        analytics_storage: 'granted',
        ad_storage: 'denied',
      }).ad_storage
    ).toBe('denied');
  });

  it('strips forbidden PII keys from payloads', () => {
    const event = sanitizeAnalyticsPayload({
      event: 'generate_lead',
      form_type: 'pre_admission',
      email: 'test@example.com',
      phone: '+880123',
      name: 'Student',
      gclid: 'secret-id',
    });

    expect(event.email).toBeUndefined();
    expect(event.phone).toBeUndefined();
    expect(event.name).toBeUndefined();
    expect(event.gclid).toBeUndefined();
    expect(event.form_type).toBe('pre_admission');
  });
});
