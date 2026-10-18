import type { AbstractIntlMessages } from 'next-intl';

/** The value at a dotted path, or undefined. */
function at(messages: AbstractIntlMessages, path: string[]): AbstractIntlMessages | string | undefined {
  let value: AbstractIntlMessages | string | undefined = messages;
  for (const part of path) value = typeof value === 'object' ? value[part] : undefined;
  return value;
}

/**
 * The messages the browser needs, not the whole language file: the parts under these keys (a namespace, or a dotted
 * path to part of one). Server components read every message on the server; only client components need these.
 */
export function pickMessages(messages: AbstractIntlMessages, keys: readonly string[]): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const key of keys) {
    const path = key.split('.');
    const value = at(messages, path);
    if (value === undefined) continue;
    let into = picked;
    for (const part of path.slice(0, -1)) into = (into[part] ??= {}) as AbstractIntlMessages;
    into[path.at(-1)!] = value;
  }
  return picked;
}

/** What client components across the site use: the admissions banner and bar, the consent banner, the preview banner. */
export const SHARED_CLIENT_MESSAGES = ['admissionCta', 'analytics.consent', 'preview'] as const;
