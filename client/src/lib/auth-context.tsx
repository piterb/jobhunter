'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthUser } from '@/services/auth-service';
import { useRouter } from 'next/navigation';

type AuthContextType = {
    user: AuthUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
    signIn: () => Promise<void>; // New signIn for dev
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initialize from local storage
        const storedUser = authService.getUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const signIn = async () => {
        try {
            setLoading(true);
            const data = await authService.devLogin();
            setUser(data.user);
            router.push('/'); // Redirect to dashboard
        } catch (error) {
            console.error('Sign in failed:', error);
            alert('Sign in failed. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await authService.logout();
        setUser(null);
        router.push('/login');
    };

    const value = {
        user,
        loading,
        signOut,
        signIn,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
