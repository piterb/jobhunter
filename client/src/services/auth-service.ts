import { createFrontendAuthAdapter } from '@/auth/factory';
import { AuthProvider, AuthResponse, AuthUser, FrontendAuthAdapter } from '@/auth/types';

const TOKEN_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';

let adapter: FrontendAuthAdapter | null = null;

function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

function persistAuthState(data: AuthResponse): void {
    if (!isBrowser()) return;
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
}

function clearAuthState(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
}

function getAdapter(): FrontendAuthAdapter {
    if (!adapter) {
        adapter = createFrontendAuthAdapter();
    }
    return adapter;
}

export const authService = {
    getProvider(): AuthProvider {
        return getAdapter().provider;
    },

    isProviderConfigured(): boolean {
        return getAdapter().isConfigured();
    },

    isAuth0Configured,

    async signIn(): Promise<AuthResponse | void> {
        const response = await getAdapter().signIn();
        if (response) {
            persistAuthState(response);
        }
        return response;
    },

    async completeCallback(): Promise<AuthResponse> {
        const response = await getAdapter().completeCallback();
        persistAuthState(response);
        return response;
    },

    async completeAuth0Redirect(): Promise<AuthResponse> {
        return this.completeCallback();
    },

    async devLogin(): Promise<AuthResponse> {
        const response = await getAdapter().signIn();
        if (!response) {
            throw new Error('Current auth provider does not support direct dev-login response');
        }
        persistAuthState(response);
        return response;
    },

    async logout(): Promise<void> {
        clearAuthState();
        await getAdapter().logout();
    },

    /**
     * Get stored token
     */
    getToken(): string | null {
        if (isBrowser()) {
            return localStorage.getItem(TOKEN_STORAGE_KEY);
        }
        return null;
    },

    /**
     * Get stored user
     */
    getUser(): AuthUser | null {
        if (isBrowser()) {
            const userStr = localStorage.getItem(USER_STORAGE_KEY);
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch {
                    return null;
                }
            }
        }
        return null;
    }
};

function isAuth0Configured(): boolean {
    return getAdapter().provider === 'auth0' && getAdapter().isConfigured();
}

export type { AuthUser, AuthResponse };
