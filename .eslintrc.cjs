module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'archive', 'src/**/*_old.tsx', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Honour the leading-underscore convention for deliberately unused bindings.
    // The codebase uses destructure-to-omit in several places, e.g.
    //   const { updatedAt: _at, updatedBy: _by, ...rest } = rule
    // where the discarded names are the POINT — deleting them changes behaviour.
    // Without this, ESLint flags the idiom and the only "fixes" are wrong ones.
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
  overrides: [
    {
      files: ['src/contexts/*.tsx'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      // Browser harnesses (see e2e/README.md) are Node scripts that DRIVE a
      // browser rather than run in one, so they need node globals — `process`,
      // `console`, `fetch` at module scope. Scoped here rather than adding
      // `env.node` globally, which would stop ESLint catching a stray `process`
      // reference in src/ that only fails once it reaches a real browser.
      files: ['e2e/**/*.js', 'e2e/**/*.mjs'],
      env: { browser: true, node: true, es2022: true },
    },
  ],
}
