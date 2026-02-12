"use client";

import { X, ScrollText, Cpu, Clock, Zap, ExternalLink, Code, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { AIUsageLog } from "shared";
import { cn } from "@/lib/utils";

interface LogDetailPanelProps {
    log: AIUsageLog | null;
    onClose: () => void;
}

export function LogDetailPanel({ log, onClose }: LogDetailPanelProps) {
    if (!log) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <ScrollText size={24} />
                </div>
                <div className="space-y-1">
                    <p className="text-slate-300 font-medium">No Log Selected</p>
                    <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                        Select an entry from the table to view more details.
                    </p>
                </div>
            </div>
        );
    }

    const getStatusIcon = (status: string | null) => {
        if (!status) return null;
        switch (status) {
            case 'Success': return <CheckCircle size={14} className="text-emerald-400" />;
            case 'Failure': return <AlertCircle size={14} className="text-rose-400" />;
            case 'Partial_Success': return <AlertTriangle size={14} className="text-amber-400" />;
            default: return null;
        }
    };

    const formatFullTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const formatJson = (json: any) => {
        if (!json) return "null";

        // Deep clone to avoid modifying the original log object
        const cloned = JSON.parse(JSON.stringify(json));

        // Truncate message content if it exists (common for OpenAI requests)
        if (cloned.messages && Array.isArray(cloned.messages)) {
            cloned.messages = cloned.messages.map((msg: any) => {
                if (msg.content && typeof msg.content === 'string' && msg.content.length > 500) {
                    return {
                        ...msg,
                        content: msg.content.substring(0, 500) + "... [TRUNCATED]"
                    };
                }
                return msg;
            });
        }

        return JSON.stringify(cloned, null, 2);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-white leading-tight pr-4">
                        {log.feature?.replace('_', ' ') || 'Unknown'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 -mr-1 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {log.model}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-500">{formatFullTime(log.created_at)}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Status</span>
                        <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="text-sm text-slate-200 font-medium">{log.status}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Latency</span>
                        <div className="flex items-center gap-2 text-slate-200">
                            <Clock size={14} className="text-slate-500" />
                            <span className="text-sm font-medium">{log.latency_ms}ms</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Token Usage</span>
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex gap-4">
                                <span className="text-slate-400">Input: <span className="text-white font-mono">{log.tokens_input}</span></span>
                                <span className="text-slate-400">Output: <span className="text-white font-mono">{log.tokens_output}</span></span>
                            </div>
                            <span className="text-slate-500 font-mono">Total: {((log.tokens_input || 0) + (log.tokens_output || 0))}</span>
                        </div>
                    </div>
                </div>

                {/* Prompt Summary */}
                {log.prompt_summary && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <ScrollText size={12} />
                            Prompt Summary
                        </h3>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-slate-300 leading-relaxed">
                            {log.prompt_summary}
                        </div>
                    </div>
                )}

                {/* JSON Sections */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Code size={12} />
                            Request JSON
                        </h3>
                        <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                            <pre className="p-4 text-[11px] text-emerald-400/90 font-mono overflow-auto max-h-[250px] custom-scrollbar">
                                {formatJson(log.request_json)}
                            </pre>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Code size={12} />
                            Response JSON
                        </h3>
                        <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                            <pre className="p-4 text-[11px] text-indigo-400/90 font-mono overflow-auto max-h-[350px] custom-scrollbar">
                                {JSON.stringify(log.response_json, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <button
                    className="w-full py-2 px-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all flex items-center justify-center gap-2"
                    onClick={() => console.log('Copy JSON logic could go here')}
                >
                    <Code size={14} />
                    Copy Response JSON
                </button>
            </div>
        </div>
    );
}
