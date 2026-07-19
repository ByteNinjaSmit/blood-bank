import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    // Only wire up react's JSX-usage detection so no-unused-vars sees
    // variables referenced solely inside JSX (e.g. <motion.div>, <Icon/>).
    // We intentionally do NOT enable the full react/recommended ruleset.
    plugins: { react },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
  {
    // Build/config files run in Node, not the browser.
    files: ['*.config.js', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
  },
  {
    // shadcn/ui primitives intentionally export style-variant helpers
    // (buttonVariants, badgeVariants, …) beside their component, and the
    // auth module co-locates its context/provider. Fast-refresh's
    // one-export-per-file rule doesn't apply to these by design.
    files: ['src/components/ui/**/*.jsx', 'src/store/auth.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
