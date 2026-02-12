"use client";

import { Header } from "./header";

interface AppShellProps {
    children: React.ReactNode;
    detailPanel?: React.ReactNode;
}

export function AppShell({ children, detailPanel }: AppShellProps) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
            <Header />

            <div className="flex flex-1 pt-16 overflow-hidden">
                {/* Main Content Area (Table) */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>

                {/* Detail Panel Area */}
                {detailPanel && (
                    <aside className="w-[400px] border-l border-slate-800 bg-slate-900 overflow-y-auto hidden lg:block">
                        {detailPanel}
                    </aside>
                )}
            </div>
        </div>
    );
}
