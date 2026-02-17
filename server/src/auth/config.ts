import { AuthRuntimeConfig, AuthProviderName } from './types';
import { AuthError } from './errors';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
    if (value === undefined) return fallback;
    return TRUE_VALUES.has(value.trim().toLowerCase());
}

function parseCsv(value: string | undefined): string[] {
    if (!value) return [];
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function loadAuthRuntimeConfig(): AuthRuntimeConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const provider = (process.env.AUTH_PROVIDER || 'auth0').trim().toLowerCase() as AuthProviderName;
    const appName = process.env.APP_NAME || 'jobhunter';
    const appEnv = process.env.APP_ENV || (nodeEnv === 'production' ? 'prod' : 'local');
    const devBypassDefault = nodeEnv === 'development';
    const devBypass = parseBoolean(
        process.env.AUTH_LOCAL_DEV_USE_MOCK_IDENTITY ?? process.env.AUTH_DEV_BYPASS,
        devBypassDefault
    );

    const issuer = (process.env.OIDC_ISSUER || process.env.AUTH0_ISSUER_BASE_URL || '').trim();
    const audience = parseCsv(process.env.OIDC_AUDIENCE || process.env.AUTH0_AUDIENCE || '');

    const appClaimsDefault = nodeEnv === 'production';
    const enforceAppClaims = parseBoolean(process.env.AUTH_ENFORCE_APP_CLAIMS, appClaimsDefault);
    const requireClientAllowlistDefault = appEnv !== 'local';
    const requireClientAllowlist = parseBoolean(process.env.AUTH_REQUIRE_CLIENT_ALLOWLIST, requireClientAllowlistDefault);

    const config: AuthRuntimeConfig = {
        provider,
        devBypass,
        nodeEnv,
        appName,
        appEnv,
        oidc: {
            issuer,
            audience,
            appIdClaim: process.env.AUTH_APP_ID_CLAIM || 'app_id',
            appEnvClaim: process.env.AUTH_APP_ENV_CLAIM || 'app_env',
            allowedAlgorithms: parseCsv(process.env.OIDC_ALLOWED_ALGORITHMS || 'RS256')
        },
        policy: {
            enforceAppClaims,
            requireClientAllowlist,
            expectedAppId: appName,
            expectedAppEnv: appEnv,
            allowedClientIds: parseCsv(process.env.OIDC_CLIENT_ALLOWLIST),
            requiredScopes: parseCsv(process.env.AUTH_REQUIRED_SCOPES)
        }
    };
    validateAuthRuntimeConfig(config);
    return config;
}

export function validateAuthRuntimeConfig(config: AuthRuntimeConfig): void {
    if (!config.appName.trim()) {
        throw new AuthError(500, 'auth_misconfigured', 'APP_NAME must be set for auth policy enforcement');
    }
    if (!config.appEnv.trim()) {
        throw new AuthError(500, 'auth_misconfigured', 'APP_ENV must be set for auth policy enforcement');
    }

    if (config.devBypass) {
        return;
    }

    if (!config.oidc.issuer.trim()) {
        throw new AuthError(500, 'auth_misconfigured', 'OIDC_ISSUER (or AUTH0_ISSUER_BASE_URL) is required when mock identity is disabled');
    }
    if (config.oidc.audience.length === 0) {
        throw new AuthError(500, 'auth_misconfigured', 'OIDC_AUDIENCE (or AUTH0_AUDIENCE) is required when mock identity is disabled');
    }
    if (config.policy.requireClientAllowlist && config.policy.allowedClientIds.length === 0) {
        throw new AuthError(500, 'auth_misconfigured', 'OIDC_CLIENT_ALLOWLIST is required for isolated non-local deployments');
    }
}
