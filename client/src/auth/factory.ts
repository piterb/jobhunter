import { DevAuthAdapter } from './adapters/dev-auth-adapter';
import { KeycloakAuthAdapter } from './adapters/keycloak-auth-adapter';
import { AuthProvider, FrontendAuthAdapter } from './types';

function detectProvider(): AuthProvider {
    const explicit = (process.env.NEXT_PUBLIC_AUTH_PROVIDER || '').trim().toLowerCase();
    if (explicit === 'keycloak' || explicit === 'dev') {
        return explicit;
    }

    if (
        process.env.NEXT_PUBLIC_KEYCLOAK_URL &&
        process.env.NEXT_PUBLIC_KEYCLOAK_REALM &&
        process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
    ) {
        return 'keycloak';
    }

    return 'dev';
}

export function createFrontendAuthAdapter(): FrontendAuthAdapter {
    const provider = detectProvider();
    if (provider === 'keycloak') {
        return new KeycloakAuthAdapter();
    }
    return new DevAuthAdapter();
}
