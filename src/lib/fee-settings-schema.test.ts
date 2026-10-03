// @vitest-environment node
import {
  createSchema,
  validateDocument,
  type Workspace,
  type SanityDocument,
} from 'sanity';
import { createClient } from '@sanity/client';
import { describe, expect, it } from 'vitest';
import { feeSettings } from '../../sanity/schemas/feeSettings';
import { initialFeeSettings } from './fee-setup';

const schema = createSchema({ name: 'fees-test', types: [feeSettings] });
const validate = (document: typeof initialFeeSettings) =>
  validateDocument({
    document: document as unknown as SanityDocument,
    workspace: { schema } as Workspace,
    getClient: () =>
      createClient({
        projectId: 'fees-test',
        dataset: 'test',
        apiVersion: '2026-09-30',
        useCdn: false,
      }),
    getDocumentExists: async () => false,
  });

describe('mandatory bilingual financial text', () => {
  it('accepts the complete bilingual setup document', async () => {
    expect(await validate(initialFeeSettings)).toEqual([]);
  });
  it.each(['english', 'bengali'] as const)(
    'rejects whitespace-only fee names in %s',
    async locale => {
      const settings = structuredClone(initialFeeSettings);
      settings.fees[0].name[locale] = ' \n\t ';
      const markers = await validate(settings);
      expect(markers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: 'error',
            path: ['fees', { _key: 'tuition' }, 'name', locale],
          }),
        ])
      );
    }
  );
});
