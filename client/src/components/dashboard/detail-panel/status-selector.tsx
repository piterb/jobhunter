import { useState, useRef, useEffect } from "react";
import { JobStatus, JobStatusSchema } from "@/types/job";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusSelectorProps {
    currentStatus: JobStatus;
    onStatusChange: (status: JobStatus) => void;
    disabled?: boolean;
}

export function StatusSelector({ currentStatus, onStatusChange, disabled }: StatusSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const allStatuses = JobStatusSchema.options;

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-1 rounded-md transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                    disabled && "cursor-not-allowed opacity-50 hover:opacity-50"
                )}
            >
                <StatusBadge status={currentStatus} className="cursor-pointer" />
                <ChevronDown size={14} className="text-slate-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 z-50 rounded-md border border-slate-800 bg-slate-900 shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Change Status
                    </div>
                    {allStatuses.map((status) => (
                        <button
                            key={status}
                            onClick={() => {
                                onStatusChange(status);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-slate-800 transition-colors flex items-center justify-between group",
                                currentStatus === status ? "bg-slate-800/50" : ""
                            )}
                        >
                            <StatusBadge status={status} className="border-none w-auto" />
                            {currentStatus === status && (
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
