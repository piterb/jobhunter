import { describe, expect, it } from 'vitest';
import { enforceAuthPolicy } from '../auth/policy';
import { AuthContext, AuthPolicyConfig } from '../auth/types';

const baseContext: AuthContext = {
    provider: 'auth0',
    userId: 'user-1',
    subject: 'google-oauth2|user-1',
    issuer: 'https://issuer.example',
    audience: ['jobhunter-api'],
    clientId: 'jobhunter-web',
    appId: 'jobhunter',
    appEnv: 'tst',
    roles: ['authenticated'],
    scopes: ['read:jobs', 'write:jobs'],
    rawClaims: {}
};

const basePolicy: AuthPolicyConfig = {
    enforceAppClaims: true,
    expectedAppId: 'jobhunter',
    expectedAppEnv: 'tst',
    allowedClientIds: ['jobhunter-web'],
    requiredScopes: ['read:jobs']
};

describe('auth policy', () => {
    it('allows a matching auth context', () => {
        expect(() => enforceAuthPolicy(baseContext, basePolicy)).not.toThrow();
    });

    it('blocks token with different environment claim', () => {
        const wrongEnv = { ...baseContext, appEnv: 'prod' };
        expect(() => enforceAuthPolicy(wrongEnv, basePolicy)).toThrow(/app_env/);
    });

    it('blocks token with missing required scope', () => {
        const missingScope = { ...baseContext, scopes: ['read:jobs'] };
        const strictPolicy: AuthPolicyConfig = { ...basePolicy, requiredScopes: ['read:jobs', 'write:jobs'] };
        expect(() => enforceAuthPolicy(missingScope, strictPolicy)).toThrow(/required scopes/);
    });
});
