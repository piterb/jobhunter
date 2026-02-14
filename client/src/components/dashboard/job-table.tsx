"use client";

import { Job, JobStatus } from "@/types/job";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapPin, ArrowUpDown, Trash2, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobTableProps {
    jobs: Job[];
    onSelectJob: (job: Job) => void;
    onEditJob: (job: Job) => void;
    onDeleteJob: (jobId: string) => void;
    onStatusChange: (jobId: string, status: JobStatus) => void;
    selectedJobId?: string;
    sortField: string;
    sortOrder: "asc" | "desc";
    onSort: (field: string) => void;
}

const SortIcon = ({
    field,
    sortField,
    sortOrder
}: {
    field: string,
    sortField: string,
    sortOrder: "asc" | "desc"
}) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />;
    return sortOrder === "asc" ? <ChevronUp size={12} className="ml-1 text-indigo-400 flex-shrink-0" /> : <ChevronDown size={12} className="ml-1 text-indigo-400 flex-shrink-0" />;
};

export function JobTable({
    jobs,
    onSelectJob,
    onEditJob,
    onDeleteJob,
    onStatusChange,
    selectedJobId,
    sortField,
    sortOrder,
    onSort
}: JobTableProps) {
    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this job? This action cannot be undone and will delete all associated activities.")) {
            onDeleteJob(jobId);
        }
    };

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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditJob(job);
                                    }}
                                    className="p-1 text-slate-500 hover:text-indigo-400 rounded-md transition-colors"
                                    title="Edit job"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, job.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                                    title="Delete job"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <StatusBadge
                                    status={job.status}
                                    onStatusChange={(newStatus) => onStatusChange(job.id, newStatus)}
                                />
                            </div>
                        </div>
                        <div className="text-sm text-slate-400 mb-2">{job.company}</div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={12} />
                                    {job.location || "Remote"}
                                </div>
                                <div className="text-[10px] opacity-70">
                                    Created: {new Date(job.created_at || "").toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                    })}
                                </div>
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
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group" onClick={() => onSort("title")}>
                            <div className="flex items-center">
                                Title
                                <SortIcon field="title" sortField={sortField} sortOrder={sortOrder} />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group" onClick={() => onSort("company")}>
                            <div className="flex items-center">
                                Company
                                <SortIcon field="company" sortField={sortField} sortOrder={sortOrder} />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group hidden xl:table-cell" onClick={() => onSort("location")}>
                            <div className="flex items-center">
                                Location
                                <SortIcon field="location" sortField={sortField} sortOrder={sortOrder} />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group hidden 2xl:table-cell" onClick={() => onSort("employment_type")}>
                            <div className="flex items-center">
                                Type
                                <SortIcon field="employment_type" sortField={sortField} sortOrder={sortOrder} />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group" onClick={() => onSort("applied_at")}>
                            <div className="flex items-center">
                                Applied At
                                <SortIcon field="applied_at" sortField={sortField} sortOrder={sortOrder} />
                            </div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-slate-300 group hidden xl:table-cell" onClick={() => onSort("created_at")}>
                            <div className="flex items-center">
                                Created At
                                <SortIcon field="created_at" sortField={sortField} sortOrder={sortOrder} />
                            </div>
                        </th>
                        <th className="px-6 py-3 text-right cursor-pointer hover:text-slate-300 group" onClick={() => onSort("status")}>
                            <div className="flex items-center justify-end">
                                Status
                                <SortIcon field="status" sortField={sortField} sortOrder={sortOrder} />
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
                                    : "Not applied yet"}
                            </td>
                            <td className="px-6 py-4 text-slate-500 hidden xl:table-cell">
                                {new Date(job.created_at || "").toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                })}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <StatusBadge
                                    status={job.status}
                                    onStatusChange={(newStatus) => onStatusChange(job.id, newStatus)}
                                />
                            </td>
                            <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditJob(job);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors"
                                        title="Edit job"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, job.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                        title="Delete job"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}

                    {jobs.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-4 py-12 text-center">
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
