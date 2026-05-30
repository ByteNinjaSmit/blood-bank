// server/eslint.config.js  — ESLint 9 flat config.
//
// Rules tuned for this transitional codebase: keep the old controllers
// quiet while enforcing real bugs and basic security hygiene. Tighten
// progressively as files move under server/src/.

const js = require('@eslint/js');
const n = require('eslint-plugin-n');
const security = require('eslint-plugin-security');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'logs/**',
      'uploads/**',
      'reports/**',
      'src/**/*.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    plugins: {
      n,
      security,
    },
    rules: {
      // Real bugs only — no style nags.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
      'no-shadow': 'warn',
      'no-prototype-builtins': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      eqeqeq: ['warn', 'smart'],
      'no-var': 'error',
      'prefer-const': 'warn',

      // Node-specific
      'n/no-process-exit': 'off',
      'n/no-missing-require': 'off',

      // Security
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-unsafe-regex': 'warn',
    },
  },
  prettier,
];
