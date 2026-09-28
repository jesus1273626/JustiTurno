import js from '@eslint/js'
import globals from 'globals'
export default [{ ignores: ['node_modules', 'prisma/generated'] }, js.configs.recommended, { files: ['**/*.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, describe: 'readonly', test: 'readonly', expect: 'readonly', beforeEach: 'readonly' } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } }]
