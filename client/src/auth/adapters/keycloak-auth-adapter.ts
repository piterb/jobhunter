import type { KeycloakInstance, KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js';
import { AuthResponse, AuthUser, FrontendAuthAdapter } from '../types';

let keycloakClient: KeycloakInstance | null = null;

type TokenClaims = KeycloakTokenParsed & {
    email?: string;
    preferred_username?: string;
};

function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

function getRedirectUri(): string {
    if (!isBrowser()) return '';
    return process.env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI || `${window.location.origin}/auth/callback`;
}

function getLogoutUri(): string {
    if (!isBrowser()) return '';
    return process.env.NEXT_PUBLIC_KEYCLOAK_LOGOUT_REDIRECT_URI || `${window.location.origin}/login`;
}

function getScope(): string {
    return process.env.NEXT_PUBLIC_KEYCLOAK_SCOPE || 'openid profile email';
}

type InitMode = 'session-check' | 'interactive';

function buildFallbackLogoutUrl(): string {
    const baseUrl = (process.env.NEXT_PUBLIC_KEYCLOAK_URL || '').replace(/\/$/, '');
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || '';
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || '';
    const redirectUri = encodeURIComponent(getLogoutUri());
    const encodedClientId = encodeURIComponent(clientId);
    return `${baseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/logout?client_id=${encodedClientId}&post_logout_redirect_uri=${redirectUri}`;
}

function mapUser(profile: KeycloakProfile | undefined, claims: TokenClaims | undefined): AuthUser {
    const id = claims?.sub || claims?.preferred_username || profile?.username || 'unknown-user';
    const email = claims?.email || profile?.email || claims?.preferred_username || 'unknown@local';
    return { id, email };
}

export class KeycloakAuthAdapter implements FrontendAuthAdapter {
    readonly provider = 'keycloak' as const;

    isConfigured(): boolean {
        return Boolean(
            process.env.NEXT_PUBLIC_KEYCLOAK_URL &&
            process.env.NEXT_PUBLIC_KEYCLOAK_REALM &&
            process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
        );
    }

    private async getClient(): Promise<KeycloakInstance> {
        if (!this.isConfigured()) {
            throw new Error('Keycloak is not configured. Missing NEXT_PUBLIC_KEYCLOAK_URL, NEXT_PUBLIC_KEYCLOAK_REALM or NEXT_PUBLIC_KEYCLOAK_CLIENT_ID.');
        }

        if (!keycloakClient) {
            const keycloakModule = await import('keycloak-js');
            // Handle ESM/CJS interop differences in browser bundlers.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const KeycloakCtor = (keycloakModule.default ?? (keycloakModule as any)) as unknown;
            if (typeof KeycloakCtor !== 'function') {
                throw new Error('Keycloak SDK initialization failed (constructor export is invalid).');
            }

            keycloakClient = new (KeycloakCtor as new(config: { url: string; realm: string; clientId: string }) => KeycloakInstance)({
                url: process.env.NEXT_PUBLIC_KEYCLOAK_URL as string,
                realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM as string,
                clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID as string
            });
        }

        if (!keycloakClient || typeof keycloakClient.login !== 'function') {
            throw new Error('Keycloak SDK initialization failed (login function is missing).');
        }

        return keycloakClient;
    }

    private async ensureInitialized(client: KeycloakInstance, mode: InitMode = 'session-check'): Promise<void> {
        if (client.didInitialize) {
            return;
        }

        const initOptions =
            mode === 'session-check'
                ? {
                    onLoad: 'check-sso' as const,
                    pkceMethod: 'S256' as const,
                    checkLoginIframe: false
                }
                : {
                    pkceMethod: 'S256' as const,
                    checkLoginIframe: false
                };

        await client.init(initOptions);
    }

    async signIn(): Promise<void> {
        const client = await this.getClient();
        await this.ensureInitialized(client, 'interactive');
        await client.login({
            redirectUri: getRedirectUri(),
            scope: getScope()
        });
    }

    async completeCallback(): Promise<AuthResponse> {
        const client = await this.getClient();
        await this.ensureInitialized(client);
        const authenticated = Boolean(client.authenticated && client.token);

        if (!authenticated || !client.token) {
            throw new Error('Authentication callback completed but no Keycloak session/token was returned.');
        }

        return {
            user: mapUser(undefined, client.tokenParsed as TokenClaims | undefined),
            access_token: client.token,
            refresh_token: client.refreshToken,
            expires_in: typeof client.tokenParsed?.exp === 'number'
                ? Math.max(client.tokenParsed.exp - Math.floor(Date.now() / 1000), 0)
                : undefined
        };
    }

    async logout(): Promise<void> {
        if (!isBrowser()) return;
        try {
            const client = await this.getClient();
            await this.ensureInitialized(client);
            if (typeof client.logout === 'function') {
                await client.logout({
                    redirectUri: getLogoutUri()
                });
                return;
            }
        } catch {
            // Fallback below.
        }

        window.location.assign(buildFallbackLogoutUrl());
    }
}
