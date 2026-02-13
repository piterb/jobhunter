'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthCallback() {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { error } = await supabase.auth.getSession();
                if (error) throw error;

                setStatus('success');
                // Stay on success screen for 1.5s to show the nice UI
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } catch (error: any) {
                console.error('Error during auth callback:', error.message);
                setStatus('error');
                setErrorMessage(error.message || 'Authentication failed');
            }
        };

        handleAuthCallback();
    }, [router]);

    if (status === 'error') {
        return (
            <div className="bg-slate-950 text-slate-50 min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="h-20 w-20 bg-red-500/10 rounded-full border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
                <p className="text-slate-400 max-w-sm mb-6">
                    We couldn't verify your account. This might be a temporary issue or the connection was interrupted.
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full max-w-md mb-8">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="font-mono text-xs text-red-400">Error: {errorMessage}</span>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="w-full max-w-xs py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg active:scale-[0.98]"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="bg-slate-950 text-slate-50 min-h-screen flex flex-col items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                    <div className="h-24 w-24 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                        <Check className="w-12 h-12" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Authenticated Successfully</h2>
                        <p className="text-slate-400">Welcome back. Redirecting you to dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 text-slate-50 min-h-screen flex flex-col items-center justify-center font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Authenticating with Google</h2>
                    <p className="text-slate-400 text-sm animate-pulse">Establishing secure connection...</p>
                </div>
            </div>
        </div>
    );
}
