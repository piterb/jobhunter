"use client";

import { useState } from "react";
import { Job, JobStatus } from "@/types/job";
import { X, ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { OverviewTab } from "./tabs/overview";
import { ActivityTab } from "./tabs/activity-timeline";
import { CoverLetterTab } from "./tabs/cover-letter";
import { jobService } from "@/services/job-service";
import { StatusSelector } from "./status-selector";

interface DetailPanelProps {
    job: Job | null;
    onClose?: () => void;
    onActivityAdded?: () => void;
}

type TabType = "overview" | "activity" | "cover-letter";

export function DetailPanel({ job, onClose, onActivityAdded, onJobUpdated }: DetailPanelProps & { onJobUpdated?: () => void }) {
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    const handleStatusChange = async (newStatus: JobStatus) => {
        if (!job) return;
        try {
            await jobService.updateJobStatus(job.id, newStatus);
            // Optimistically update local state if needed, but for now relies on parent refresh
            if (onJobUpdated) {
                onJobUpdated();
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            // Optionally show toast error
        }
    };

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
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-4">
                        <h2 className="text-xl font-semibold text-white leading-tight mb-1">
                            {job.title}
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-indigo-400">{job.company}</span>
                            {job.url && (
                                <>
                                    <span className="text-slate-600">•</span>
                                    <a
                                        href={job.url}
                                        className="text-xs text-slate-400 hover:text-white hover:underline flex items-center gap-1 transition-colors"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Link <ExternalLink size={10} />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <StatusSelector
                            currentStatus={job.status}
                            onStatusChange={handleStatusChange}
                        />
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 -mr-1 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-800 mt-6">
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

            {/* Note: Footer with generic status button removed as requested */}
        </div>
    );
}
