"use client";

import { Header } from "./header";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
    children: React.ReactNode;
    detailPanel?: React.ReactNode;
}

export function AppShell({ children, detailPanel }: AppShellProps) {
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            // Calculate new width: window width - mouse X position
            const newWidth = window.innerWidth - e.clientX;

            // Constrain width between 300px and 800px
            if (newWidth >= 300 && newWidth <= 800) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.classList.add('select-none');
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'default';
            document.body.classList.remove('select-none');
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col overflow-hidden">
            <Header />

            <div className="flex flex-1 pt-16 overflow-hidden h-screen bg-slate-950 relative">
                {/* Main Content Area (Left Panel) */}
                <main className={cn(
                    "flex-1 flex flex-col min-w-0 border-r border-slate-800/50 overflow-hidden transition-all duration-300",
                    detailPanel ? "hidden lg:flex" : "flex"
                )}>
                    {children}
                </main>

                {/* Resizer Divider */}
                {detailPanel && (
                    <div
                        onMouseDown={startResizing}
                        className={cn(
                            "w-1 cursor-col-resize hover:bg-indigo-600 transition-colors z-20 -mx-0.5 hidden lg:block",
                            isResizing && "bg-indigo-600"
                        )}
                    />
                )}

                {/* Detail Panel Area (Right Panel / Full screen on mobile) */}
                {detailPanel && (
                    <aside
                        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${sidebarWidth}px` : undefined }}
                        className={cn(
                            "bg-slate-950 flex flex-col shrink-0 border-l border-slate-800 overflow-y-auto transition-all duration-300",
                            "fixed inset-0 top-16 z-30 w-full lg:relative lg:top-0 lg:z-0 lg:flex",
                            detailPanel ? "flex" : "hidden lg:flex"
                        )}
                    >
                        {detailPanel}
                    </aside>
                )}
            </div>
        </div>
    );
}
