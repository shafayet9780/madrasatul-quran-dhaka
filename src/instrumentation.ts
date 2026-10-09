export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { localModeRequested, setLocalOverrides } = await import('@/lib/admissions/local');
  if (!localModeRequested()) return;

  const { createPgliteDb, pgliteDrizzle } = await import('@/lib/admissions/testing/pg');
  const surveySchema = await import('@/lib/survey/schema');
  const { liveFormDocument } = await import('@/lib/admissions/testing/live-form');
  const { mockGateway } = await import('@/lib/admissions/testing/mock-gateway');
  const { sslConfigFromEnv } = await import('@/lib/admissions/sslcommerz');
  const files = new Map<string, { body: Uint8Array; contentType: string }>();
  const { db, client } = await createPgliteDb();
  setLocalOverrides({
    db,
    surveyDb: pgliteDrizzle(client, surveySchema) as never,
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
  // The survey admin and forms get the sample survey data (pnpm survey:fixtures does the same in Neon).
  const { loadSurveyFixtures } = await import('@/lib/survey/testing/dev-fixtures');
  console.log(`Survey: ${await loadSurveyFixtures().catch((e) => `sample data failed to load: ${e instanceof Error ? e.message : e}`)}`);
  console.log(`Admissions: local preview (in-memory database, converted live form, ${sslConfigFromEnv() ? 'SSLCommerz sandbox' : 'stand-in payment gateway'}).`);
}
