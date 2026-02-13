"use client";

import { useState } from "react";
import {
    Moon,
    Sun,
    Monitor,
    Palette,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
    { id: 'light', name: 'Light', icon: Sun, description: 'Clean and bright interface' },
    { id: 'dark', name: 'Dark', icon: Moon, description: 'Easy on the eyes in low light' },
    { id: 'system', name: 'System', icon: Monitor, description: 'Follows your device settings' },
];

export default function AppearancePage() {
    const [selectedTheme, setSelectedTheme] = useState('dark');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSave = () => {
        setMessage({ type: 'success', text: 'Appearance settings saved!' });
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Page Header */}
                <div className="border-b border-slate-800 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Appearance</h1>
                        <p className="mt-1 text-sm text-slate-400">Customize how JobHunter looks and feels.</p>
                    </div>
                    {message && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-in zoom-in duration-300",
                            message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        )}>
                            {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {message.text}
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    {/* Theme Selection */}
                    <section className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />
                        <div className="mb-6">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                                <Palette className="w-5 h-5 text-indigo-400" />
                                Interface Theme
                            </h2>
                            <p className="text-sm text-slate-400">Select your preferred color mode.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {themes.map((theme) => {
                                const Icon = theme.icon;
                                const isSelected = selectedTheme === theme.id;
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => setSelectedTheme(theme.id)}
                                        className={cn(
                                            "flex flex-col items-start p-4 rounded-xl border transition-all text-left group/card",
                                            isSelected
                                                ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50"
                                                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg mb-3 transition-colors",
                                            isSelected ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 group-hover/card:text-slate-200"
                                        )}>
                                            <Icon size={20} />
                                        </div>
                                        <span className={cn(
                                            "text-sm font-semibold transition-colors",
                                            isSelected ? "text-white" : "text-slate-300"
                                        )}>{theme.name}</span>
                                        <p className="text-xs text-slate-500 mt-1">{theme.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
