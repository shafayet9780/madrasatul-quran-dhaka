export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { localModeRequested, setLocalOverrides } = await import('@/lib/admissions/local');
  if (!localModeRequested()) return;

  const { createPgliteDb } = await import('@/lib/admissions/testing/pg');
  const { liveFormDocument } = await import('@/lib/admissions/testing/live-form');
  const files = new Map<string, { body: Uint8Array; contentType: string }>();
  const { db } = await createPgliteDb();
  setLocalOverrides({
    db,
    form: liveFormDocument(),
    store: {
      put: async (path, body, contentType) => void files.set(path, { body, contentType }),
      del: async (path) => void files.delete(path),
      get: async (path) => {
        const f = files.get(path);
        return f ? { stream: new Blob([f.body as BlobPart]).stream(), contentType: f.contentType } : null;
      },
    },
  });
  console.log('Admissions: local preview (in-memory database, converted live form).');
}
