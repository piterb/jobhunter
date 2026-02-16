'use client';

import React from 'react';
import { Crosshair, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/services/auth-service';

export default function LoginPage() {
    const { signIn } = useAuth();
    const provider = authService.getProvider();
    const isExternalProvider = provider !== 'dev';

    const handleDevLogin = async () => {
        await signIn();
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
                            <p className="text-sm text-slate-400">
                                {isExternalProvider ? 'Sign in to manage your applications' : 'Sign in to manage your applications'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleDevLogin}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                            >
                                <Crosshair className="w-5 h-5" />
                                {isExternalProvider ? 'Continue to Sign In' : 'Sign in as Developer'}
                            </button>
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-900/50 px-2 text-slate-500">
                                    {isExternalProvider ? `Provider: ${provider}` : 'More methods coming soon'}
                                </span>
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
