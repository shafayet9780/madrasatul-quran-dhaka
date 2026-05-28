import '@testing-library/jest-dom/vitest';

// Default env so modules that read Sanity/site env vars at import time don't crash.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||= 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET ||= 'test';
process.env.SANITY_PREVIEW_SECRET ||= 'test-secret';
process.env.NEXT_PUBLIC_SITE_URL ||= 'http://localhost:3000';
