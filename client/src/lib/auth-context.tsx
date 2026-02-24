'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthUser } from '@/services/auth-service';
import { useRouter } from 'next/navigation';

type AuthContextType = {
    user: AuthUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
    signIn: () => Promise<void>;
    setUser: (user: AuthUser | null) => void;
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
            const data = await authService.signIn();
            if (data?.user) {
                setUser(data.user);
                router.push('/');
            }
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
        setUser,
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
