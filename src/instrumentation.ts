export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { localModeRequested, setLocalOverrides } = await import('@/lib/admissions/local');
  if (!localModeRequested()) return;

  const { createPgliteDb } = await import('@/lib/admissions/testing/pg');
  const { liveFormDocument } = await import('@/lib/admissions/testing/live-form');
  const { mockGateway } = await import('@/lib/admissions/testing/mock-gateway');
  const { sslConfigFromEnv } = await import('@/lib/admissions/sslcommerz');
  const files = new Map<string, { body: Uint8Array; contentType: string }>();
  const { db } = await createPgliteDb();
  setLocalOverrides({
    db,
    // ADMISSIONS_LOCAL_FORM: a form exported from the Studio (Inspect → Raw JSON) instead of the built-in one.
    form: process.env.ADMISSIONS_LOCAL_FORM ? JSON.parse((await import('node:fs')).readFileSync(process.env.ADMISSIONS_LOCAL_FORM, 'utf8')) : liveFormDocument(),
    // With SSLCommerz sandbox credentials in the environment the real sandbox is used instead.
    gateway: sslConfigFromEnv() ? undefined : mockGateway(),
    outbox: [],
    store: {
      put: async (path, body, contentType) => void files.set(path, { body, contentType }),
      del: async (path) => void files.delete(path),
      get: async (path) => {
        const f = files.get(path);
        return f ? { stream: new Blob([f.body as BlobPart]).stream(), contentType: f.contentType } : null;
      },
    },
  });
  console.log(`Admissions: local preview (in-memory database, converted live form, ${sslConfigFromEnv() ? 'SSLCommerz sandbox' : 'stand-in payment gateway'}).`);
}
