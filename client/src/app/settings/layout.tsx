"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Key, ScrollText, Palette, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";

const sidebarItems = [
    { name: "Profile", href: "/settings/profile", icon: User },
    { name: "API Keys", href: "/settings/api-keys", icon: Key },
    { name: "AI Logs", href: "/settings/ai-logs", icon: ScrollText },
    { name: "Appearance", href: "/settings/appearance", icon: Palette },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-slate-950">
            <Header />
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col pt-24 px-4 fixed h-full overflow-y-auto">
                <div className="mb-6 px-2">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors mb-4"
                    >
                        <ChevronLeft size={14} />
                        Back to Dashboard
                    </Link>
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settings</h2>
                </div>

                <nav className="space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                    isActive
                                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                                )}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 pt-16 flex flex-col h-screen overflow-hidden">
                {children}
            </main>
        </div>
    );
}
