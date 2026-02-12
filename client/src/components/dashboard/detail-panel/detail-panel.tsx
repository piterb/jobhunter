"use client";

import { useState } from "react";
import { Job } from "@/types/job";
import { X, ExternalLink, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { OverviewTab } from "./tabs/overview";
import { ActivityTab } from "./tabs/activity-timeline";
import { CoverLetterTab } from "./tabs/cover-letter";

interface DetailPanelProps {
    job: Job | null;
    onClose?: () => void;
    onActivityAdded?: () => void;
}

type TabType = "overview" | "activity" | "cover-letter";

export function DetailPanel({ job, onClose, onActivityAdded }: DetailPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    if (!job) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <Search size={24} />
                </div>
                <div className="space-y-1">
                    <p className="text-slate-300 font-medium">No Job Selected</p>
                    <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                        Select an application from the table to view more details.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-white leading-tight pr-4">
                        {job.title}
                    </h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 -mr-1 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm font-medium text-indigo-400">{job.company}</span>
                    {job.url && (
                        <>
                            <span className="text-slate-600">•</span>
                            <a
                                href={job.url}
                                className="text-xs text-slate-400 hover:text-white hover:underline flex items-center gap-1 transition-colors"
                                target="_blank"
                            >
                                Link <ExternalLink size={10} />
                            </a>
                        </>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-800">
                    {[
                        { id: "overview", label: "Job Info" },
                        { id: "activity", label: "Activity" },
                        { id: "cover-letter", label: "Cover Letter" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "flex-1 pb-3 text-sm font-medium transition-all relative",
                                activeTab === tab.id
                                    ? "text-white"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
                {activeTab === "overview" && <OverviewTab job={job} />}
                {activeTab === "activity" && <ActivityTab job={job} onActivityAdded={onActivityAdded} />}
                {activeTab === "cover-letter" && <CoverLetterTab job={job} />}
            </div>

            {/* Footer / Quick Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <div className="flex gap-3">
                    <button className="flex-1 py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2">
                        Status: <StatusBadge status={job.status} className="w-auto h-auto px-1.5 py-0 border-none bg-transparent text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
