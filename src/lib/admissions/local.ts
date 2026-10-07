import type { AdmissionsDb } from './db';
import type { FormDocument } from './snapshot';
import type { Gateway } from './sslcommerz';
import type { MailMessage } from './mail';
import type { BlobStore } from './uploads';

// Local preview (ADMISSIONS_LOCAL=1, never on Vercel): src/instrumentation.ts puts an in-memory
// Postgres, the converted live form and an in-memory file store here before the server takes
// requests, so the whole guardian flow runs without Neon, Sanity or Blob credentials (dev, e2e).

/**
 * `gateway` is the SSLCommerz stand-in, set only when no sandbox credentials are configured;
 * `outbox` collects emails instead of sending them (GET /api/admissions/dev/outbox).
 */
export type LocalOverrides = { db: AdmissionsDb; form: FormDocument; store: BlobStore; gateway?: Gateway; outbox?: MailMessage[] };

const holder = globalThis as { __admissionsLocal?: LocalOverrides };

export function localOverrides(): LocalOverrides | undefined {
  return holder.__admissionsLocal;
}

export function setLocalOverrides(value: LocalOverrides) {
  holder.__admissionsLocal = value;
}

export function localModeRequested(): boolean {
  return process.env.ADMISSIONS_LOCAL === '1' && !process.env.VERCEL;
}
