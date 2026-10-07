import type { AdmissionsDb } from './db';
import type { FormDocument } from './snapshot';
import type { BlobStore } from './uploads';

// Local preview (ADMISSIONS_LOCAL=1, never on Vercel): src/instrumentation.ts puts an in-memory
// Postgres, the converted live form and an in-memory file store here before the server takes
// requests, so the whole guardian flow runs without Neon, Sanity or Blob credentials (dev, e2e).

export type LocalOverrides = { db: AdmissionsDb; form: FormDocument; store: BlobStore };

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
