import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  {
    // Next 16 removed `next lint`; the bare `eslint` CLI would otherwise scan
    // build output and generated types. Mirror what `next lint` used to ignore.
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      // Standalone Node (CommonJS) tooling scripts — not part of the app build.
      'scripts/**',
      // Design prototypes and their render scripts.
      'docs/**',
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      // React Compiler rules that eslint-config-next 16 turned on. Older components (admin, surveys, pre-admission,
      // pages not yet redesigned) break them; warnings until those are reworked.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
];

export default eslintConfig;
