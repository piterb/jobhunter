import { loadAuthRuntimeConfig } from './config';
import { AuthError } from './errors';
import { enforceAuthPolicy } from './policy';
import { Auth0Adapter } from './providers/auth0';
import { KeycloakAdapter } from './providers/keycloak';
import { AuthContext, AuthProviderAdapter, AuthRuntimeConfig } from './types';

function parseBearerToken(authHeader?: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthError(401, 'missing_token', 'Unauthorized: Missing or invalid token');
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        throw new AuthError(401, 'missing_token', 'Unauthorized: Missing or invalid token');
    }
    return token;
}

function createDevContext(config: AuthRuntimeConfig): AuthContext {
    return {
        provider: config.provider,
        userId: 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
        email: 'dev@jobhunter.local',
        issuer: 'local-dev-bypass',
        audience: ['local-dev-bypass'],
        clientId: 'local-dev-client',
        appId: config.appName,
        appEnv: config.appEnv,
        roles: ['authenticated'],
        scopes: [],
        rawClaims: {
            sub: 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
            email: 'dev@jobhunter.local',
            app_id: config.appName,
            app_env: config.appEnv
        }
    };
}

function createProviderAdapter(config: AuthRuntimeConfig): AuthProviderAdapter {
    if (config.provider === 'auth0') {
        return new Auth0Adapter(config.oidc);
    }
    if (config.provider === 'keycloak') {
        return new KeycloakAdapter(config.oidc);
    }

    throw new AuthError(500, 'auth_misconfigured', `Unsupported auth provider '${config.provider}'`);
}

class AuthService {
    private cachedConfig?: AuthRuntimeConfig;
    private cachedAdapter?: AuthProviderAdapter;
    private adapterProvider?: string;

    private getConfig(): AuthRuntimeConfig {
        if (!this.cachedConfig) {
            this.cachedConfig = loadAuthRuntimeConfig();
        }
        return this.cachedConfig;
    }

    private getAdapter(config: AuthRuntimeConfig): AuthProviderAdapter {
        if (!this.cachedAdapter || this.adapterProvider !== config.provider) {
            this.cachedAdapter = createProviderAdapter(config);
            this.adapterProvider = config.provider;
        }
        return this.cachedAdapter;
    }

    async authenticateRequest(authHeader?: string): Promise<AuthContext> {
        const config = this.getConfig();
        const token = parseBearerToken(authHeader);

        if (config.devBypass) {
            return createDevContext(config);
        }

        const adapter = this.getAdapter(config);
        const context = await adapter.authenticate(token);
        enforceAuthPolicy(context, config.policy);
        return context;
    }
}

export const authService = new AuthService();
