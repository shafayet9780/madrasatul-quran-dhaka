import { FORBIDDEN_ANALYTICS_KEYS, type SafeAnalyticsEvent } from './types';
import { sanitizePathWithAllowedQuery } from './url';

const FORBIDDEN_SET = new Set<string>(FORBIDDEN_ANALYTICS_KEYS);
const URL_PATH_KEYS = new Set(['page_path', 'landing_page']);

export function sanitizeAnalyticsPayload(
  payload: Record<string, unknown>
): SafeAnalyticsEvent {
  const sanitized: Record<string, string | number | boolean | null | undefined> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_SET.has(key)) {
      continue;
    }

    if (URL_PATH_KEYS.has(key) && typeof value === 'string') {
      sanitized[key] = sanitizePathWithAllowedQuery(value);
      continue;
    }

    if (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      sanitized[key] = value as string | number | boolean | null | undefined;
    }
  }

  if (!sanitized.event || typeof sanitized.event !== 'string') {
    throw new Error('Analytics payload must include a string event name');
  }

  return sanitized as SafeAnalyticsEvent;
}
