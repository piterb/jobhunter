"use client";

import { useState, useEffect } from "react";
import { Key, Shield, Loader2, CheckCircle2, AlertCircle, Cpu, Sparkles, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const MODELS = [
    { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "Fast & Cheap", icon: <Cpu size={14} /> },
    { id: "gpt-4o", name: "GPT-4o", desc: "High Quality", icon: <Sparkles size={14} className="text-indigo-400" /> },
];

export default function ApiKeysPage() {
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState("");
    const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('openai_api_key, default_ai_model, updated_at')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setApiKey(data.openai_api_key || "");
                    setDefaultModel(data.default_ai_model || "gpt-4o-mini");
                    setLastUpdated(data.updated_at);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    openai_api_key: apiKey,
                    default_ai_model: defaultModel,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            setSaveStatus('success');
            setLastUpdated(new Date().toISOString());

            // Clear success status after 3 seconds
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-slate-800 pb-6">
                    <h1 className="text-2xl font-semibold text-white">API Keys & AI settings</h1>
                    <p className="mt-1 text-sm text-slate-400">Manage your AI service credentials and default configuration.</p>
                </div>

                <section className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />

                    <div className="space-y-8">
                        {/* OpenAI Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                                    <Key size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-medium text-white">OpenAI API Key</h2>
                                    <p className="text-sm text-slate-400">Required for AI-powered job analysis and cover letter generation.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <Shield size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Securely Stored</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono tracking-wider italic">
                                        Last updated: {formatDate(lastUpdated)}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="sk-..."
                                            disabled={isLoading}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono disabled:opacity-50"
                                        />
                                        {isLoading && (
                                            <div className="absolute right-3 top-2.5">
                                                <Loader2 size={16} className="animate-spin text-slate-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">Your key is stored in your private profile and never shared.</p>
                            </div>
                        </div>

                        {/* Model Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                                    <Cpu size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-medium text-white">Default AI Model</h2>
                                    <p className="text-sm text-slate-400">Choose the AI model you want to use by default.</p>
                                </div>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-900 rounded-lg text-slate-300">
                                            {MODELS.find(m => m.id === defaultModel)?.icon}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-white">{MODELS.find(m => m.id === defaultModel)?.name}</div>
                                            <div className="text-xs text-slate-500">{MODELS.find(m => m.id === defaultModel)?.desc}</div>
                                        </div>
                                    </div>
                                    <ChevronDown size={20} className={cn("text-slate-500 transition-transform", isModelMenuOpen && "rotate-180")} />
                                </button>

                                {isModelMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsModelMenuOpen(false)} />
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                                            {MODELS.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        setDefaultModel(m.id);
                                                        setIsModelMenuOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-4 py-3 text-sm transition-all",
                                                        defaultModel === m.id ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-1.5 rounded-md", defaultModel === m.id ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500")}>
                                                            {m.icon}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-semibold">{m.name}</div>
                                                            <div className="text-[10px] opacity-60 uppercase tracking-widest">{m.desc}</div>
                                                        </div>
                                                    </div>
                                                    {defaultModel === m.id && <CheckCircle2 size={16} className="text-indigo-400" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className={cn(
                                    "px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 min-w-[140px] justify-center",
                                    saveStatus === 'success'
                                        ? "bg-emerald-600 text-white shadow-emerald-500/20"
                                        : saveStatus === 'error'
                                            ? "bg-red-600 text-white shadow-red-500/20"
                                            : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20"
                                )}
                            >
                                {isSaving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : saveStatus === 'success' ? (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Saved Changes
                                    </>
                                ) : saveStatus === 'error' ? (
                                    <>
                                        <AlertCircle size={18} />
                                        Failed to Save
                                    </>
                                ) : (
                                    'Save Settings'
                                )}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

