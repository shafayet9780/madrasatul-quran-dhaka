import { execFileSync } from 'node:child_process';

// Reloads the sample survey data: in the Neon dev branch (pnpm survey:fixtures), or, when the specs
// run against the local preview (pnpm test:e2e:admissions), in its in-memory database.
export async function loadFixtures(mode?: 'rate-limits') {
  const local = process.env.SURVEY_E2E_LOCAL;
  if (local) {
    const res = await fetch(`${local}/api/admissions/dev/survey-fixtures${mode ? `?mode=${mode}` : ''}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Loading survey fixtures failed: ${res.status}`);
    return;
  }
  execFileSync('pnpm', ['survey:fixtures', ...(mode ? [`--${mode}`] : [])], { stdio: 'ignore' });
}
