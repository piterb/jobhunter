import { AuthRuntimeConfig, AuthProviderName } from './types';

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

    return {
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
            expectedAppId: appName,
            expectedAppEnv: appEnv,
            allowedClientIds: parseCsv(process.env.OIDC_CLIENT_ALLOWLIST),
            requiredScopes: parseCsv(process.env.AUTH_REQUIRED_SCOPES)
        }
    };
}
