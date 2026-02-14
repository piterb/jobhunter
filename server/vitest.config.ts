import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/**/*.{test,spec}.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
    },
    cacheDir: './.vitest',
});
