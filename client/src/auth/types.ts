export type AuthProvider = 'keycloak' | 'dev';

export interface AuthUser {
    id: string;
    email: string;
}

export interface AuthResponse {
    user: AuthUser;
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
}

export interface FrontendAuthAdapter {
    readonly provider: AuthProvider;
    isConfigured(): boolean;
    signIn(): Promise<AuthResponse | void>;
    completeCallback(): Promise<AuthResponse>;
    logout(): Promise<void>;
}
