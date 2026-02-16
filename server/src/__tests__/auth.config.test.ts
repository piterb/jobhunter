import { afterEach, describe, expect, it } from 'vitest';
import { loadAuthRuntimeConfig } from '../auth/config';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
});

describe('auth config', () => {
    it('loads Auth0-compatible defaults', () => {
        process.env.NODE_ENV = 'development';
        process.env.AUTH0_ISSUER_BASE_URL = 'https://tenant.example.auth0.com/';
        process.env.AUTH0_AUDIENCE = 'jobhunter-api';

        const config = loadAuthRuntimeConfig();

        expect(config.provider).toBe('auth0');
        expect(config.devBypass).toBe(true);
        expect(config.oidc.issuer).toBe('https://tenant.example.auth0.com/');
        expect(config.oidc.audience).toEqual(['jobhunter-api']);
    });

    it('supports provider switch and explicit OIDC values', () => {
        process.env.NODE_ENV = 'production';
        process.env.AUTH_PROVIDER = 'keycloak';
        process.env.OIDC_ISSUER = 'https://id.example.com/realms/appa-tst1';
        process.env.OIDC_AUDIENCE = 'appa-api,common-api';
        process.env.AUTH_LOCAL_DEV_USE_MOCK_IDENTITY = 'false';

        const config = loadAuthRuntimeConfig();

        expect(config.provider).toBe('keycloak');
        expect(config.devBypass).toBe(false);
        expect(config.oidc.audience).toEqual(['appa-api', 'common-api']);
    });
});
