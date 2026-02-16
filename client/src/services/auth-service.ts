const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface AuthUser {
    id: string;
    email: string;
}

export interface AuthResponse {
    user: AuthUser;
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export const authService = {
    /**
     * Development login bypass
     */
    async devLogin(): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/dev-login`);
        if (!response.ok) {
            throw new Error('Failed to perform dev login');
        }
        const data = await response.json();

        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
        }

        return data;
    },

    /**
     * Logout and clear local state
     */
    async logout(): Promise<void> {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
    },

    /**
     * Get stored token
     */
    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    },

    /**
     * Get stored user
     */
    getUser(): AuthUser | null {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('auth_user');
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }
};
