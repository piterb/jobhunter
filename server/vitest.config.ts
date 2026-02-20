import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localTmpDir = path.resolve(__dirname, '.vitest_tmp');

// VSCode Vitest extension may ignore npm script env vars, so force stable local temp dirs.
process.env.TMPDIR = process.env.TMPDIR || localTmpDir;
process.env.TMP = process.env.TMP || localTmpDir;
process.env.TEMP = process.env.TEMP || localTmpDir;

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/**/*.{test,spec}.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
    },
    cacheDir: './.vitest',
});
