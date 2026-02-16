import { Auth0AuthAdapter } from './adapters/auth0-auth-adapter';
import { DevAuthAdapter } from './adapters/dev-auth-adapter';
import { AuthProvider, FrontendAuthAdapter } from './types';

function detectProvider(): AuthProvider {
    const explicit = (process.env.NEXT_PUBLIC_AUTH_PROVIDER || '').trim().toLowerCase();
    if (explicit === 'auth0' || explicit === 'dev') {
        return explicit;
    }

    if (process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID) {
        return 'auth0';
    }

    return 'dev';
}

export function createFrontendAuthAdapter(): FrontendAuthAdapter {
    const provider = detectProvider();
    if (provider === 'auth0') {
        return new Auth0AuthAdapter();
    }
    return new DevAuthAdapter();
}
