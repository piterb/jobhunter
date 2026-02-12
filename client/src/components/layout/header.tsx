"use client";

import { Search, Plus, User, LogOut, Settings, BarChart3, ChevronDown, Cpu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { jobService } from "@/services/job-service";
import { useAuth } from "@/lib/auth-context";

export function Header() {
    const { user, signOut } = useAuth();
    const [url, setUrl] = useState("");
    const [model, setModel] = useState("gpt-4o-mini");
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    const models = [
        { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "Fast & Cheap", icon: <Cpu size={14} /> },
        { id: "gpt-4o", name: "GPT-4o", desc: "High Quality", icon: <Sparkles size={14} className="text-indigo-400" /> },
    ];

    const [isIngesting, setIsIngesting] = useState(false);

    const handleIngest = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!url || isIngesting) return;

        setIsIngesting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            console.log(`Starting ingest for ${url} using ${model}`);
            await jobService.ingestJob(url, token);

            setUrl("");
            // Refresh the page or trigger a refresh in a more React-way later
            window.location.reload();
        } catch (err) {
            console.error("Ingest failed:", err);
            alert("Failed to ingest job. Make sure the URL is valid and server is running.");
        } finally {
            setIsIngesting(false);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50 px-6 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-bold text-lg">J</span>
                </div>
                <span className="text-white font-semibold text-xl tracking-tight hidden sm:block">
                    JobHunter
                </span>
            </div>

            {/* Quick Add Input */}
            <div className="flex-1 max-w-2xl mx-8">
                <form onSubmit={handleIngest} className="relative group flex items-center gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                            <Plus size={18} />
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste job URL to quick add with AI..."
                            className="w-full h-10 bg-slate-900/50 border border-slate-800 rounded-md pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Model Selector */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            className="h-10 px-3 bg-slate-900/50 border border-slate-800 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-medium whitespace-nowrap"
                        >
                            {models.find(m => m.id === model)?.icon}
                            <span className="hidden md:inline">{models.find(m => m.id === model)?.name}</span>
                            <ChevronDown size={14} className={cn("transition-transform", isModelMenuOpen && "rotate-180")} />
                        </button>

                        {isModelMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsModelMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in duration-200">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        AI Model
                                    </div>
                                    {models.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => {
                                                setModel(m.id);
                                                setIsModelMenuOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                                                model === m.id ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {m.icon}
                                                <div className="text-left">
                                                    <div className="font-medium">{m.name}</div>
                                                    <div className="text-[10px] opacity-60 leading-none">{m.desc}</div>
                                                </div>
                                            </div>
                                            {model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!url || isIngesting}
                        className="h-10 px-4 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        {isIngesting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Ingest"
                        )}
                    </button>
                </form>
            </div>

            {/* User & Actions */}
            <div className="flex items-center gap-3">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <BarChart3 size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <Settings size={20} />
                </button>
                <div className="w-px h-6 bg-slate-800 mx-1" />
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-800 transition-colors group"
                    title="Sign Out"
                >
                    <div className="flex flex-col items-end mr-2 hidden md:flex">
                        <span className="text-xs font-semibold text-white">{user?.email?.split('@')[0]}</span>
                        <span className="text-[10px] text-slate-500">{user?.email}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:border-slate-500">
                        <LogOut size={16} />
                    </div>
                </button>
            </div>
        </header>
    );
}
