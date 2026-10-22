import { describe, expect, it } from 'vitest';
import type { AbstractIntlMessages } from 'next-intl';
import bengaliFile from '../../messages/bengali.json';
import { pickMessages, SHARED_CLIENT_MESSAGES } from './i18n-messages';

// The file holds lists too (read with t.raw), which the message type does not describe.
const bengali = bengaliFile as unknown as AbstractIntlMessages;

describe('pickMessages', () => {
  const messages = { a: { b: 'x', c: { d: 'y' } }, e: 'z', f: { g: 'w' } };

  it('keeps whole namespaces and parts of them, nothing else', () => {
    expect(pickMessages(messages, ['f', 'a.c'])).toEqual({ f: { g: 'w' }, a: { c: { d: 'y' } } });
    expect(pickMessages(messages, ['a.c.d', 'a.b'])).toEqual({ a: { c: { d: 'y' } , b: 'x' } });
  });

  it('skips keys that are not there', () => {
    expect(pickMessages(messages, ['missing', 'a.missing', 'e.x'])).toEqual({});
  });

  it('sends the browser a small part of the language file', () => {
    const shared = pickMessages(bengali, SHARED_CLIENT_MESSAGES);
    expect(Object.keys(shared).sort()).toEqual(['admissionCta', 'analytics', 'preview']);
    expect(Object.keys(shared.analytics as object)).toEqual(['consent']);
    expect(JSON.stringify(shared).length).toBeLessThan(JSON.stringify(bengali).length / 10);
  });
});
