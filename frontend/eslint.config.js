import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import hooks from 'eslint-plugin-react-hooks'
export default [{ ignores: ['dist'] }, js.configs.recommended, { files: ['**/*.{js,jsx}'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, describe: 'readonly', beforeEach: 'readonly', test: 'readonly', expect: 'readonly' }, parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { react, 'react-hooks': hooks }, settings: { react: { version: 'detect' } }, rules: { ...react.configs.recommended.rules, ...hooks.configs.recommended.rules, 'react/react-in-jsx-scope': 'off', 'react/prop-types': 'off' } }]
