import { cn } from "@/lib/utils";
import { JobStatus } from "@/types/job";

interface StatusBadgeProps {
    status: JobStatus;
    className?: string;
}

const statusStyles: Record<JobStatus, string> = {
    Applied: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Interview: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Offer: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Rejected: "bg-red-500/15 text-red-400 border-red-500/20",
    Saved: "bg-slate-700/50 text-slate-400 border-slate-700",
    Ghosted: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const statusLabels: Record<JobStatus, string> = {
    Applied: "Applied",
    Interview: "Interview",
    Offer: "Offer",
    Rejected: "Rejected",
    Saved: "Draft",
    Ghosted: "Ghosted",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-medium border w-24 uppercase tracking-wider",
                statusStyles[status],
                className
            )}
        >
            {statusLabels[status]}
        </span>
    );
}
