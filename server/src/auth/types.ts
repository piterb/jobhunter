export type AuthProviderName = 'keycloak';

export interface AuthContext {
    provider: AuthProviderName;
    userId: string;
    subject: string;
    internalUserId?: string;
    email?: string;
    issuer: string;
    audience: string[];
    clientId?: string;
    appId?: string;
    appEnv?: string;
    roles: string[];
    scopes: string[];
    rawClaims: Record<string, unknown>;
}

export interface OidcAdapterConfig {
    issuer: string;
    audience: string[];
    appIdClaim: string;
    appEnvClaim: string;
    allowedAlgorithms: string[];
}

export interface AuthPolicyConfig {
    enforceAppClaims: boolean;
    requireClientAllowlist: boolean;
    expectedAppId: string;
    expectedAppEnv: string;
    allowedClientIds: string[];
    requiredScopes: string[];
}

export interface AuthRuntimeConfig {
    provider: AuthProviderName;
    devBypass: boolean;
    nodeEnv: string;
    appName: string;
    appEnv: string;
    oidc: OidcAdapterConfig;
    policy: AuthPolicyConfig;
}

export interface AuthProviderAdapter {
    readonly provider: AuthProviderName;
    authenticate(token: string): Promise<AuthContext>;
}
