import { createAuth0Client, Auth0Client } from '@auth0/auth0-spa-js';
import { AuthResponse, AuthUser, FrontendAuthAdapter } from '../types';

let auth0ClientPromise: Promise<Auth0Client> | null = null;

function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

function getRedirectUri(): string {
    if (!isBrowser()) return '';
    return process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || `${window.location.origin}/auth/callback`;
}

function mapAuth0UserToAuthUser(user: Record<string, unknown>): AuthUser {
    const sub = typeof user.sub === 'string' ? user.sub : '';
    const email = typeof user.email === 'string' ? user.email : '';
    return { id: sub || email || 'unknown-user', email: email || sub || 'unknown@local' };
}

export class Auth0AuthAdapter implements FrontendAuthAdapter {
    readonly provider = 'auth0' as const;

    isConfigured(): boolean {
        return Boolean(process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);
    }

    private async getClient(): Promise<Auth0Client> {
        if (!this.isConfigured()) {
            throw new Error('Auth0 is not configured. Missing NEXT_PUBLIC_AUTH0_DOMAIN or NEXT_PUBLIC_AUTH0_CLIENT_ID.');
        }

        if (!auth0ClientPromise) {
            auth0ClientPromise = createAuth0Client({
                domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN as string,
                clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID as string,
                authorizationParams: {
                    redirect_uri: getRedirectUri(),
                    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
                    scope: process.env.NEXT_PUBLIC_AUTH0_SCOPE || 'openid profile email'
                },
                cacheLocation: 'localstorage',
                useRefreshTokens: true
            });
        }

        return await auth0ClientPromise;
    }

    async signIn(): Promise<void> {
        const client = await this.getClient();
        await client.loginWithRedirect({
            authorizationParams: { redirect_uri: getRedirectUri() }
        });
    }

    async completeCallback(): Promise<AuthResponse> {
        const client = await this.getClient();
        await client.handleRedirectCallback();

        const [user, token] = await Promise.all([
            client.getUser(),
            client.getTokenSilently()
        ]);

        if (!user || !token) {
            throw new Error('Authentication callback completed but no user/token was returned.');
        }

        return {
            user: mapAuth0UserToAuthUser(user as unknown as Record<string, unknown>),
            access_token: token
        };
    }

    async logout(): Promise<void> {
        const client = await this.getClient();
        if (!isBrowser()) return;
        client.logout({
            logoutParams: {
                returnTo: process.env.NEXT_PUBLIC_AUTH0_LOGOUT_URL || `${window.location.origin}/login`
            }
        });
    }
}
