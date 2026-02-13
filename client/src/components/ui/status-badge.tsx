import { cn } from "@/lib/utils";
import { JobStatus } from "@/types/job";

interface StatusBadgeProps {
    status: JobStatus;
    className?: string;
    onStatusChange?: (status: JobStatus) => void;
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

const ALL_STATUSES: JobStatus[] = ["Saved", "Applied", "Interview", "Offer", "Rejected", "Ghosted"];

export function StatusBadge({ status, className, onStatusChange }: StatusBadgeProps) {
    if (onStatusChange) {
        return (
            <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value as JobStatus)}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-medium border w-24 uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none bg-center text-center transition-all hover:brightness-110 active:scale-95",
                    statusStyles[status],
                    className
                )}
            >
                {ALL_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-white py-2">
                        {statusLabels[s]}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-medium border w-24 uppercase tracking-wider",
                statusStyles[status],
                className
            )}
        >
            {statusLabels[status]}
        </span>
    );
}
