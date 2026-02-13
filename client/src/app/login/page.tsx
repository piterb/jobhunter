'use client';

import React from 'react';
import { Crosshair, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('Error logging in with Google:', error.message);
        }
    };

    return (
        <div className="bg-slate-950 text-slate-50 min-h-screen flex items-center justify-center overflow-hidden relative font-sans">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-md px-6 relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-2xl mb-4 group transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                        <Crosshair className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">JobHunter</h1>
                    <p className="text-slate-400 text-center">Your ultimate AI-powered job application tracker</p>
                </div>

                {/* Auth Card */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-white">Welcome back</h2>
                            <p className="text-sm text-slate-400">Sign in to manage your applications</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                    />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-900/50 px-2 text-slate-500">More methods coming soon</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/50 flex flex-col items-center">
                                <ShieldCheck className="w-5 h-5 text-indigo-400 mb-1" />
                                <span className="text-[10px] text-slate-400">Secure Auth</span>
                            </div>
                            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/50 flex flex-col items-center">
                                <Zap className="w-5 h-5 text-indigo-400 mb-1" />
                                <span className="text-[10px] text-slate-400">Instant Setup</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-slate-500">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-indigo-400 hover:underline">
                        Terms
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-indigo-400 hover:underline">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
}
