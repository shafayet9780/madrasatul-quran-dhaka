import 'server-only';
import { randomBytes } from 'node:crypto';
import { del, get, put } from '@vercel/blob';
import type { FileAnswer } from './answers';
import { saveDraft, type Application, type SaveResult } from './drafts';
import { checkUpload, documentPath, type UploadCheck } from './files';
import { allFields, type FormSnapshot } from './form-config';
import { localOverrides } from './local';

// Guardian documents in the private Blob store (ADMISSIONS_BLOB_READ_WRITE_TOKEN). Never public:
// the admin reads them through an authenticated route; the PDF renderer embeds them server-side.

export type BlobStore = {
  put: (path: string, body: Uint8Array, contentType: string, opts?: { overwrite?: boolean }) => Promise<void>;
  del: (path: string) => Promise<void>;
  get: (path: string) => Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null>;
};

function token(): string {
  const t = process.env.ADMISSIONS_BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error('ADMISSIONS_BLOB_READ_WRITE_TOKEN is not set (the private Blob store for admissions documents)');
  return t;
}

export const privateBlobStore: BlobStore = {
  put: async (path, body, contentType, opts) => {
    await put(path, Buffer.from(body), { access: 'private', token: token(), contentType, addRandomSuffix: false, allowOverwrite: opts?.overwrite ?? false });
  },
  del: (path) => del(path, { token: token() }),
  get: async (path) => {
    const result = await get(path, { access: 'private', token: token() });
    if (!result || !result.stream) return null;
    return { stream: result.stream, contentType: result.blob.contentType };
  },
};

/** The private store, or the in-memory one in the local preview. */
export function blobStore(): BlobStore {
  return localOverrides()?.store ?? privateBlobStore;
}

export type UploadResult = { ok: true; file: FileAnswer; save: SaveResult } | Extract<UploadCheck, { ok: false }> | { ok: false; error: 'locked' };

/** Stores a document for one file field and links it to the draft; the replaced file is deleted. */
export async function uploadDocument(
  app: Application,
  snapshot: FormSnapshot,
  fieldKey: string,
  bytes: Uint8Array,
  originalName: string,
  store: BlobStore = blobStore(),
): Promise<UploadResult> {
  if (app.status !== 'draft' && app.status !== 'unpaid') return { ok: false, error: 'locked' };
  const field = allFields(snapshot).find((f) => f.key === fieldKey);
  const check = checkUpload(field, bytes);
  if (!check.ok) return check;

  const path = documentPath(app.id, fieldKey, check.type, randomBytes(9).toString('base64url'));
  await store.put(path, bytes, check.type);
  const file: FileAnswer = { key: path, name: originalName.slice(0, 200) || fieldKey, size: bytes.length, type: check.type };
  const save = await saveDraft(app, snapshot, { [fieldKey]: file });
  if (!save.ok) {
    await store.del(path).catch(() => {});
    return { ok: false, error: 'locked' };
  }
  const previous = app.answers[fieldKey];
  if (previous && typeof previous === 'object' && !Array.isArray(previous) && previous.key !== path) {
    await store.del(previous.key).catch(() => {});
  }
  return { ok: true, file, save };
}
