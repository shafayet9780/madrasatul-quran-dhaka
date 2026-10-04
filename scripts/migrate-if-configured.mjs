// Vercel build step: apply pending survey migrations before `next build`.
// Without DATABASE_URL_UNPOOLED (e.g. an environment without the Neon integration) the public site
// still deploys: migrations are skipped with a warning. A failing migration stops the deploy,
// because the new code would expect the new tables.
import { spawnSync } from 'node:child_process';

if (!process.env.DATABASE_URL_UNPOOLED) {
  console.warn('\n⚠ DATABASE_URL_UNPOOLED is not set: skipping survey migrations. Survey pages will not work in this deployment.\n');
  process.exit(0);
}
const result = spawnSync('pnpm', ['exec', 'drizzle-kit', 'migrate'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
