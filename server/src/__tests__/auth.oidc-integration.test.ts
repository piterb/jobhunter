import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeycloakAdapter } from '../auth/providers/keycloak';
import { enforceAuthPolicy } from '../auth/policy';
import { AuthPolicyConfig } from '../auth/types';

const ISSUER = 'https://issuer.integration.test/';
const AUDIENCE = 'https://api.integration.test';
const CLIENT_ID = 'client-a';

// jose is ESM-only in this workspace setup, so we keep runtime dynamic import lightly typed.
type JoseModule = Awaited<typeof import('jose')>;

let jose: JoseModule;
let privateKey: CryptoKey;
let jwk: Record<string, unknown>;
let originalFetch: typeof global.fetch;

async function createSignedToken(options?: {
    issuer?: string;
    audience?: string | string[];
    clientId?: string;
}) {
    const jwt = await new jose.SignJWT({
        azp: options?.clientId ?? CLIENT_ID,
        scope: 'openid profile email'
    })
        .setProtectedHeader({ alg: 'RS256', kid: 'integration-test-kid', typ: 'JWT' })
        .setIssuer(options?.issuer ?? ISSUER)
        .setAudience(options?.audience ?? AUDIENCE)
        .setSubject('google-oauth2|integration-user')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);

    return jwt;
}

describe('OIDC adapter integration (JWKS + JWT verify)', () => {
    beforeEach(async () => {
        jose = await import('jose');

        const keys = await jose.generateKeyPair('RS256');
        privateKey = keys.privateKey;

        const exported = await jose.exportJWK(keys.publicKey);
        jwk = {
            ...exported,
            kid: 'integration-test-kid',
            alg: 'RS256',
            use: 'sig'
        };

        originalFetch = global.fetch;
        global.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            if (url === `${ISSUER.replace(/\/$/, '')}/protocol/openid-connect/certs`) {
                return new Response(JSON.stringify({ keys: [jwk] }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                });
            }
            return new Response('not found', { status: 404 });
        }) as typeof global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('accepts a valid token with matching iss/aud/signature', async () => {
        const adapter = new KeycloakAdapter({
            issuer: ISSUER,
            audience: [AUDIENCE],
            appIdClaim: 'app_id',
            appEnvClaim: 'app_env',
            allowedAlgorithms: ['RS256']
        });
        const token = await createSignedToken();

        const context = await adapter.authenticate(token);

        expect(context.subject).toBe('google-oauth2|integration-user');
        expect(context.issuer).toBe(ISSUER);
        expect(context.audience).toContain(AUDIENCE);
        expect(context.clientId).toBe(CLIENT_ID);
    });

    it('rejects a token with wrong audience', async () => {
        const adapter = new KeycloakAdapter({
            issuer: ISSUER,
            audience: [AUDIENCE],
            appIdClaim: 'app_id',
            appEnvClaim: 'app_env',
            allowedAlgorithms: ['RS256']
        });
        const token = await createSignedToken({ audience: 'https://wrong-audience.integration.test' });

        await expect(adapter.authenticate(token)).rejects.toMatchObject({
            status: 401,
            code: 'invalid_token'
        });
    });

    it('rejects a token with wrong issuer', async () => {
        const adapter = new KeycloakAdapter({
            issuer: ISSUER,
            audience: [AUDIENCE],
            appIdClaim: 'app_id',
            appEnvClaim: 'app_env',
            allowedAlgorithms: ['RS256']
        });
        const token = await createSignedToken({ issuer: 'https://wrong-issuer.integration.test/' });

        await expect(adapter.authenticate(token)).rejects.toMatchObject({
            status: 401,
            code: 'invalid_token'
        });
    });

    it('enforces azp/client allowlist and returns forbidden_client', async () => {
        const adapter = new KeycloakAdapter({
            issuer: ISSUER,
            audience: [AUDIENCE],
            appIdClaim: 'app_id',
            appEnvClaim: 'app_env',
            allowedAlgorithms: ['RS256']
        });
        const token = await createSignedToken({ clientId: 'client-b' });
        const context = await adapter.authenticate(token);

        const policy: AuthPolicyConfig = {
            enforceAppClaims: false,
            requireClientAllowlist: true,
            expectedAppId: 'jobhunter',
            expectedAppEnv: 'tst',
            allowedClientIds: ['client-a'],
            requiredScopes: []
        };

        expect(() => enforceAuthPolicy(context, policy)).toThrow(/Token client is not allowed/);
    });
});
