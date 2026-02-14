"use client";

import { Cpu, Clock, Zap, ExternalLink, CheckCircle, AlertCircle, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { aiService } from "@/services/ai-service";
import { AIUsageLog } from "shared";
import { LogDetailPanel } from "@/components/settings/log-detail-panel";
import { cn } from "@/lib/utils";

export default function AiLogsPage() {
    const [logs, setLogs] = useState<AIUsageLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AIUsageLog | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Panel Resizing State
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);

    // Global Stats
    const [totalTokens, setTotalTokens] = useState(0);
    const [avgLatency, setAvgLatency] = useState(0);

    const fetchLogs = useCallback(async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await aiService.getLogs(page, limit);
            setLogs(response.data);
            setTotalCount(response.count);
            setTotalPages(response.totalPages);
            setTotalTokens(response.totalTokens);
            setAvgLatency(response.avgLatency);
        } catch (err) {
            console.error('Error fetching AI logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchLogs(currentPage, pageSize);
    }, [currentPage, pageSize, fetchLogs]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page when changing page size
    };

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

    const formatFullTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-GB');
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
                            { label: 'Total Requests', value: totalCount.toString(), icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
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

                    <section className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                        <div className="overflow-x-auto flex-1">
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
                                            <td colSpan={5} className="px-6 py-32 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                                                    <span>Loading logs...</span>
                                                </div>
                                            </td>
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
                                                <td className="px-6 py-4 font-medium text-white">{log.feature?.replace('_', ' ') || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{log.model || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter border flex items-center w-fit gap-1.5 ${getStatusColor(log.status || 'unknown')}`}>
                                                        {getStatusIcon(log.status || 'unknown')}
                                                        {log.status || 'Unknown'}
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

                        {/* Pagination Footer */}
                        <div className="bg-slate-950/50 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500">
                                    Page {currentPage} of {totalPages} ({totalCount} total)
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                        className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        {[10, 20, 50, 100].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                    className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let p = i + 1;
                                        if (totalPages > 5) {
                                            if (currentPage > 3) p = currentPage - 2 + i;
                                            if (p > totalPages) p = totalPages - (4 - i);
                                        }
                                        if (p <= 0) return null;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => handlePageChange(p)}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                                                    currentPage === p
                                                        ? "bg-indigo-600 text-white"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                    className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
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
