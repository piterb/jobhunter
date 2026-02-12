"use client";

import { Job } from "@/types/job";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapPin, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobTableProps {
    jobs: Job[];
    onSelectJob: (job: Job) => void;
    selectedJobId?: string;
}

export function JobTable({ jobs, onSelectJob, selectedJobId }: JobTableProps) {
    return (
        <div className="w-full bg-slate-950/30">
            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-800/50">
                {jobs.map((job) => (
                    <div
                        key={job.id}
                        onClick={() => onSelectJob(job)}
                        className={cn(
                            "p-4 hover:bg-slate-900/40 transition-colors cursor-pointer",
                            selectedJobId === job.id && "bg-slate-900/60"
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-medium text-white">{job.title}</h3>
                            <StatusBadge status={job.status} />
                        </div>
                        <div className="text-sm text-slate-400 mb-2">{job.company}</div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={12} />
                                {job.location || "Remote"}
                            </div>
                            <span>
                                {job.applied_at
                                    ? new Date(job.applied_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric"
                                    })
                                    : "Draft"}
                            </span>
                        </div>
                    </div>
                ))}

                {jobs.length === 0 && (
                    <div className="px-4 py-12 text-center">
                        <p className="text-slate-400 font-medium">No applications yet.</p>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden lg:table">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm border-b border-slate-800">
                    <tr>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group">
                            <div className="flex items-center gap-1">
                                Title
                                <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group">
                            <div className="flex items-center gap-1">
                                Company
                                <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group hidden xl:table-cell">
                            <div className="flex items-center gap-1">
                                Location
                                <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group hidden 2xl:table-cell">
                            <div className="flex items-center gap-1">
                                Type
                                <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group">
                            <div className="flex items-center gap-1">
                                Applied At
                                <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </th>
                        <th className="px-6 py-3 text-right cursor-pointer hover:text-slate-300 group">
                            <div className="flex items-center justify-end gap-1">
                                Status
                                <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </th>
                        <th className="px-4 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {jobs.map((job) => (
                        <tr
                            key={job.id}
                            onClick={() => onSelectJob(job)}
                            className={cn(
                                "group cursor-pointer hover:bg-slate-900/40 transition-colors border-l-2",
                                selectedJobId === job.id
                                    ? "bg-slate-900/60 border-l-indigo-500"
                                    : "border-l-transparent"
                            )}
                        >
                            <td className="px-6 py-4 font-medium text-white">
                                {job.title}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                                {job.company}
                            </td>
                            <td className="px-6 py-4 text-slate-400 hidden xl:table-cell">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-500" />
                                    {job.location || "Remote"}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs hidden 2xl:table-cell">
                                {job.employment_type || "Full-time"}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {job.applied_at
                                    ? new Date(job.applied_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                    })
                                    : "Draft"}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <StatusBadge status={job.status} />
                            </td>
                            <td className="px-4 py-4 text-right">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}

                    {jobs.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-4 py-12 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-slate-400 font-medium">No applications yet.</p>
                                    <p className="text-xs text-slate-500">
                                        Paste a URL above to add your first job application.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
