import { cn } from "@/lib/utils";
import { JobStatus } from "@/types/job";

interface StatusBadgeProps {
    status: JobStatus;
    className?: string;
}

const statusStyles: Record<JobStatus, string> = {
    applied: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    interview: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    offer: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/15 text-red-400 border-red-500/20",
    draft: "bg-slate-700/50 text-slate-400 border-slate-700",
    ghosted: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const statusLabels: Record<JobStatus, string> = {
    applied: "Applied",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
    draft: "Draft",
    ghosted: "Ghosted",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-medium border w-24 uppercase tracking-wider",
                statusStyles[status],
                className
            )}
        >
            {statusLabels[status]}
        </div>
    );
}
