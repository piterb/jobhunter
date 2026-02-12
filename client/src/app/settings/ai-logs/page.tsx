"use client";

import { ScrollText, Cpu, Clock, Zap, ExternalLink, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { AIUsageLog } from "shared";
import { LogDetailPanel } from "@/components/settings/log-detail-panel";
import { cn } from "@/lib/utils";

export default function AiLogsPage() {
    const [logs, setLogs] = useState<AIUsageLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AIUsageLog | null>(null);

    // Panel Resizing State
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('ai_usage_logs')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) setLogs(data);
            } catch (err) {
                console.error('Error fetching AI logs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();

        // Set up real-time subscription
        const subscription = supabase
            .channel('ai_usage_logs_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'jobhunter',
                    table: 'ai_usage_logs'
                },
                (payload) => {
                    console.log('New AI log received:', payload);
                    setLogs((prev) => [payload.new as AIUsageLog, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 350 && newWidth <= 800) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'default';
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    const formatFullTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Failure': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'Partial_Success': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Success': return <CheckCircle size={14} className="text-emerald-400" />;
            case 'Failure': return <AlertCircle size={14} className="text-rose-400" />;
            case 'Partial_Success': return <AlertTriangle size={14} className="text-amber-400" />;
            default: return null;
        }
    };

    // Calculate stats
    const totalRequests = logs.length;
    const totalTokens = logs.reduce((acc, log) => acc + (log.tokens_input || 0) + (log.tokens_output || 0), 0);
    const avgLatency = logs.length > 0
        ? Math.round(logs.reduce((acc, log) => acc + (log.latency_ms || 0), 0) / logs.length)
        : 0;

    return (
        <div className="flex h-full overflow-hidden bg-slate-950">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="border-b border-slate-800 pb-6">
                        <h1 className="text-2xl font-semibold text-white">AI Logs</h1>
                        <p className="mt-1 text-sm text-slate-400">Track your AI usage, tokens, and response history.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Total Requests', value: totalRequests.toString(), icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                            { label: 'Tokens Used', value: (totalTokens / 1000).toFixed(1) + 'k', icon: Cpu, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                            { label: 'Avg Latency', value: avgLatency + 'ms', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-xl font-bold text-white">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <section className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950/50 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Feature</th>
                                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Model</th>
                                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Time</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading logs...</td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No logs found</td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr
                                                key={log.id}
                                                className={cn(
                                                    "hover:bg-slate-800/30 transition-colors cursor-pointer group",
                                                    selectedLog?.id === log.id && "bg-indigo-500/5 border-l-2 border-l-indigo-500"
                                                )}
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <td className="px-6 py-4 font-medium text-white">{log.feature.replace('_', ' ')}</td>
                                                <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{log.model}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter border flex items-center w-fit gap-1.5 ${getStatusColor(log.status)}`}>
                                                        {getStatusIcon(log.status)}
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold tracking-tight">{formatFullTime(log.created_at)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-slate-500 group-hover:text-indigo-400 transition-colors">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* Resizer */}
            {selectedLog && (
                <div
                    onMouseDown={startResizing}
                    className={cn(
                        "w-1 cursor-col-resize hover:bg-indigo-600 transition-colors z-20 -mx-0.5",
                        isResizing && "bg-indigo-600"
                    )}
                />
            )}

            {/* Detail Panel */}
            {selectedLog && (
                <aside
                    style={{ width: `${sidebarWidth}px` }}
                    className="flex-shrink-0 bg-slate-950 border-l border-slate-800 animate-in slide-in-from-right duration-300"
                >
                    <LogDetailPanel
                        log={selectedLog}
                        onClose={() => setSelectedLog(null)}
                    />
                </aside>
            )}
        </div>
    );
}
