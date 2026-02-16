import { AuthError } from '../errors';
import { AuthContext, AuthProviderAdapter, OidcAdapterConfig } from '../types';
import { getStringClaim, JwtPayloadLike, mergeUnique, normalizeAudience, normalizeScopes, normalizeStringArray } from './shared';

export class Auth0Adapter implements AuthProviderAdapter {
    readonly provider = 'auth0' as const;

    private config: OidcAdapterConfig;
    private jwksUrl: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private jwks?: any;

    constructor(config: OidcAdapterConfig) {
        if (!config.issuer) {
            throw new AuthError(500, 'auth_misconfigured', 'OIDC issuer is not configured');
        }
        if (config.audience.length === 0) {
            throw new AuthError(500, 'auth_misconfigured', 'OIDC audience is not configured');
        }

        this.config = config;
        const issuer = config.issuer.replace(/\/$/, '');
        this.jwksUrl = `${issuer}/.well-known/jwks.json`;
    }

    async authenticate(token: string): Promise<AuthContext> {
        try {
            const jose = await import('jose');
            if (!this.jwks) {
                this.jwks = jose.createRemoteJWKSet(new URL(this.jwksUrl));
            }
            const verified = await jose.jwtVerify(token, this.jwks, {
                issuer: this.config.issuer,
                audience: this.config.audience,
                algorithms: this.config.allowedAlgorithms
            });
            const payload = verified.payload as JwtPayloadLike;
            const userId = payload.sub;

            if (!userId) {
                throw new AuthError(401, 'invalid_token', 'Token does not include subject claim');
            }

            const roles = mergeUnique([
                normalizeStringArray(payload.roles),
                normalizeStringArray((payload as JwtPayloadLike & { permissions?: unknown }).permissions)
            ]);

            return {
                provider: this.provider,
                userId,
                email: getStringClaim(payload, 'email'),
                issuer: getStringClaim(payload, 'iss') || this.config.issuer,
                audience: normalizeAudience(payload.aud),
                clientId: getStringClaim(payload, 'azp') || getStringClaim(payload, 'client_id'),
                appId: getStringClaim(payload, this.config.appIdClaim),
                appEnv: getStringClaim(payload, this.config.appEnvClaim),
                roles,
                scopes: normalizeScopes(payload.scope),
                rawClaims: { ...payload }
            };
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(401, 'invalid_token', 'Access token validation failed');
        }
    }
}
