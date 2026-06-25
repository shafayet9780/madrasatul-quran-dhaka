import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDataLayer, pushToDataLayer, pushTrackedEvent, setAnalyticsConsent } from './push';

describe('pushToDataLayer', () => {
  beforeEach(() => {
    (globalThis as { window?: Window }).window = {
      dataLayer: [],
    } as unknown as Window;
  });

  afterEach(() => {
    delete (globalThis as { window?: Window }).window;
    setAnalyticsConsent(null);
  });

  it('no-ops on server', () => {
    delete (globalThis as { window?: Window }).window;
    expect(pushToDataLayer({ event: 'page_view', page_path: '/' })).toBeNull();
  });

  it('initializes dataLayer and pushes sanitized payload', () => {
    const result = pushToDataLayer({
      event: 'page_view',
      page_path: '/bengali',
      locale: 'bengali',
      email: 'hidden@example.com',
    });

    expect(result?.event).toBe('page_view');
    expect(result?.email).toBeUndefined();
    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toMatchObject({
      event: 'page_view',
      page_path: '/bengali',
      locale: 'bengali',
    });
  });

  it('reuses existing dataLayer array', () => {
    window.dataLayer = [{ event: 'consent_default' }];
    initDataLayer();
    pushToDataLayer({ event: 'page_view', page_path: '/' });
    expect(window.dataLayer).toHaveLength(2);
  });

  it('gates tracked events when consent denies analytics and advertising', () => {
    setAnalyticsConsent({
      region: 'regulated',
      analytics: false,
      advertising: false,
      requiresOptIn: true,
    });

    const result = pushTrackedEvent({ event: 'form_start', form_type: 'pre_admission' });

    expect(result).toBeNull();
    expect(window.dataLayer).toHaveLength(0);
  });

  it('allows tracked events when consent grants analytics or advertising', () => {
    setAnalyticsConsent({
      region: 'general',
      analytics: true,
      advertising: false,
      requiresOptIn: false,
    });

    const result = pushTrackedEvent({ event: 'form_start', form_type: 'pre_admission' });

    expect(result?.event).toBe('form_start');
    expect(window.dataLayer).toHaveLength(1);
  });
});
