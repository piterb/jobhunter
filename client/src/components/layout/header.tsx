"use client";


import { Plus, LogOut, Settings, ChevronDown, LayoutDashboard, Cpu, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { jobService } from "@/services/job-service";
import { AddJobModal } from "../dashboard/add-job-modal";
import { ApiKeyMissingModal } from "../dashboard/api-key-missing-modal";
import { Job } from "@/types/job";

export function Header() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isAddJobOpen, setIsAddJobOpen] = useState(false);
    const [ingestedData, setIngestedData] = useState<Partial<Job> | null>(null);
    const [profile, setProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null);

    // Ingest State
    const [url, setUrl] = useState("");
    const [model, setModel] = useState("gpt-4o-mini");
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [isIngesting, setIsIngesting] = useState(false);
    const [isApiKeyMissingOpen, setIsApiKeyMissingOpen] = useState(false);

    const models = [
        { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "Fast & Cheap", icon: <Cpu size={14} /> },
        { id: "gpt-4o", name: "GPT-4o", desc: "High Quality", icon: <Sparkles size={14} className="text-indigo-400" /> },
    ];

    const fetchProfileData = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('default_ai_model, avatar_url, full_name')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                if (data.default_ai_model) setModel(data.default_ai_model);
                setProfile({
                    avatar_url: data.avatar_url,
                    full_name: data.full_name
                });
            }
        } catch (err) {
            console.error("Failed to fetch profile data:", err);
        }
    }, [user]);

    useEffect(() => {
        fetchProfileData();

        // Listen for profile updates from other components
        window.addEventListener('profile-updated', fetchProfileData);

        return () => {
            window.removeEventListener('profile-updated', fetchProfileData);
        };
    }, [fetchProfileData]);

    const handleIngest = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!url || isIngesting) return;

        setIsIngesting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            console.log(`Starting ingest for ${url} using ${model}`);
            const data = await jobService.ingestJob(url, token);

            // Set the ingested data and open the modal
            setIngestedData({
                title: data.title,
                company: data.company,
                location: data.location,
                salary_min: data.salary_min,
                salary_max: data.salary_max,
                employment_type: data.employment_type,
                skills_tools: data.skills_tools,
                notes: data.description_summary,
                url: url
            });
            setIsAddJobOpen(true);
            setUrl("");
        } catch (err: unknown) {
            let errorMessage = "Unknown error";
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            } else if (err && typeof err === 'object' && 'message' in err) {
                errorMessage = (err as { message: string }).message;
            } else if (err && typeof err === 'object') {
                errorMessage = JSON.stringify(err);
            }

            console.error("Ingest detailed error:", errorMessage, err);

            // Check if it's an API key error (case insensitive)
            const lowerError = (errorMessage || "").toLowerCase();
            if (lowerError.includes("api key") || lowerError.includes("openai") || lowerError.includes("byok")) {
                setIsApiKeyMissingOpen(true);
            } else {
                alert(`Failed to ingest job: ${errorMessage}`);
            }
        } finally {
            setIsIngesting(false);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50 px-6 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image src="/logo.png" alt="Job hunter logo" width={32} height={32} className="w-8 h-8 rounded-lg object-contain" />
                <span className="text-white font-semibold text-xl tracking-tight hidden sm:block">
                    JobHunter
                </span>
            </Link>

            {/* Central Controls (Only on Dashboard) */}
            {pathname === "/" ? (
                <div className="flex-1 max-w-4xl mx-8 flex items-center gap-4">
                    {/* Quick Add Input */}
                    <form onSubmit={handleIngest} className="relative group flex items-center gap-2 flex-1">
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
                                <>
                                    <Wand2 size={16} />
                                    Ingest
                                </>
                            )}
                        </button>
                    </form>

                    <div className="h-8 w-px bg-slate-800" />

                    <button
                        onClick={() => {
                            setIngestedData(null);
                            setIsAddJobOpen(true);
                        }}
                        className="h-10 px-6 bg-slate-800 text-slate-200 rounded-full text-sm font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Manual Add
                    </button>

                    <AddJobModal
                        isOpen={isAddJobOpen}
                        onClose={() => {
                            setIsAddJobOpen(false);
                            setIngestedData(null);
                        }}
                        onJobAdded={() => window.location.reload()}
                        initialData={ingestedData || undefined}
                    />

                    <ApiKeyMissingModal
                        isOpen={isApiKeyMissingOpen}
                        onClose={() => setIsApiKeyMissingOpen(false)}
                    />
                </div>
            ) : (
                /* Spacer for when controls are hidden */
                <div className="flex-1" />
            )}

            {/* User & Actions */}
            <div className="flex items-center gap-3">




                <div className="relative">
                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all group"
                    >
                        <div className="flex flex-col items-end mr-1 hidden md:flex">
                            <span className="text-xs font-bold text-white">
                                {profile?.full_name || user?.email?.split('@')[0]}
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform overflow-hidden border border-white/10 relative">
                            {profile?.avatar_url ? (
                                <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" unoptimized />
                            ) : (
                                profile?.full_name ? profile.full_name[0].toUpperCase() : user?.email?.[0].toUpperCase()
                            )}
                        </div>
                        <ChevronDown size={14} className={cn("text-slate-500 transition-transform", isProfileMenuOpen && "rotate-180")} />
                    </button>

                    {isProfileMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsProfileMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-slate-800 mb-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Signed in as</p>
                                    <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                                </div>

                                <Link
                                    href="/"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all font-medium"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <LayoutDashboard size={16} />
                                    Dashboard
                                </Link>

                                <Link
                                    href="/settings/profile"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all font-medium"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <Settings size={16} />
                                    Settings
                                </Link>

                                <div className="h-px bg-slate-800 my-1 mx-2" />

                                <button
                                    onClick={() => {
                                        setIsProfileMenuOpen(false);
                                        signOut();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-all font-bold uppercase text-[10px] tracking-widest"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
