"use client";

import { Job } from "@/types/job";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapPin, Calendar, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobTableProps {
    jobs: Job[];
    onSelectJob: (job: Job) => void;
    selectedJobId?: string;
}

export function JobTable({ jobs, onSelectJob, selectedJobId }: JobTableProps) {
    return (
        <div className="w-full overflow-hidden bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                            <div className="flex items-center gap-1 cursor-pointer hover:text-slate-300 transition-colors">
                                Role & Company
                                <ArrowUpDown size={12} />
                            </div>
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 tracking-wider hidden md:table-cell">
                            Location
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                            <div className="flex items-center gap-1 cursor-pointer hover:text-slate-300 transition-colors">
                                Applied
                                <ArrowUpDown size={12} />
                            </div>
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">
                            Status
                        </th>
                        <th className="px-4 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {jobs.map((job) => (
                        <tr
                            key={job.id}
                            onClick={() => onSelectJob(job)}
                            className={cn(
                                "group cursor-pointer hover:bg-slate-800/50 transition-colors",
                                selectedJobId === job.id && "bg-slate-800/80 shadow-inner"
                            )}
                        >
                            <td className="px-4 py-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                                        {job.title}
                                    </span>
                                    <span className="text-xs text-slate-400 leading-relaxed">
                                        {job.company}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <MapPin size={14} className="text-slate-500" />
                                    {job.location || "Remote"}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <Calendar size={14} className="text-slate-500" />
                                    {job.applied_at
                                        ? new Date(job.applied_at).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                        : "Not applied"}
                                </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                                <StatusBadge status={job.status} />
                            </td>
                            <td className="px-4 py-4 text-right">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Action menu logic here
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}

                    {jobs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-12 text-center">
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
