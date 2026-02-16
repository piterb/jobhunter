import { AuthResponse, FrontendAuthAdapter } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class DevAuthAdapter implements FrontendAuthAdapter {
    readonly provider = 'dev' as const;

    isConfigured(): boolean {
        return true;
    }

    async signIn(): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/dev-login`);
        if (!response.ok) {
            throw new Error('Failed to perform dev login');
        }
        return await response.json();
    }

    async completeCallback(): Promise<AuthResponse> {
        throw new Error('Dev auth does not use OAuth callbacks');
    }

    async logout(): Promise<void> {
        return;
    }
}
