import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }],
            '@typescript-eslint/no-empty-object-type': 'off',
            'no-console': 'off',
        },
    },
    {
        files: ['**/*.test.ts', '**/__tests__/**'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', '.vitest_tmp/**', '.pkg_cache_local/**', '.tmp/**', '.vitest/**'],
    }
);
