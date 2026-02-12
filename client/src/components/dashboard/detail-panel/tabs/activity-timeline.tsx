"use client";

import { Job, Activity, ActivityType } from "@/types/job";
import { Calendar, Phone, Mail, StickyNote, Tag, History, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityTabProps {
    job: Job;
}

const activityIcons: Record<string, any> = {
    note: StickyNote,
    status_change: History,
    email: Mail,
    call: Phone,
    meeting: Calendar,
    interview: MessageSquare,
};

const activityStyles: Record<string, string> = {
    note: "bg-slate-800 text-slate-400 border-slate-700",
    status_change: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    email: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    call: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    meeting: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    interview: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const activityLabels: Record<string, string> = {
    note: "Note",
    status_change: "Status Update",
    email: "Email",
    call: "Phone Call",
    meeting: "Meeting",
    interview: "Interview",
};

export function ActivityTab({ job }: ActivityTabProps) {
    return (
        <div className="space-y-6">
            {/* Quick Add Activity */}
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                        <select className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-2 text-xs text-slate-300 appearance-none focus:outline-none focus:border-indigo-500 transition-all cursor-pointer">
                            <option value="note">Note</option>
                            <option value="call">Phone Call</option>
                            <option value="email">Email</option>
                            <option value="interview">Interview</option>
                            <option value="meeting">Meeting</option>
                        </select>
                        <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>
                    <button className="bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-500 transition-colors shadow-sm">
                        Add Activity
                    </button>
                </div>
                <textarea
                    placeholder="Details about this activity..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-indigo-500 h-20 resize-none transition-all placeholder:text-slate-600"
                />
            </div>

            {/* Timeline */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity History</h3>

                <div className="relative space-y-4 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-800 before:via-slate-800 before:to-transparent">
                    {job.activities && job.activities.length > 0 ? (
                        job.activities.slice().sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()).map((activity) => {
                            const Icon = activityIcons[activity.event_type] || StickyNote;
                            return (
                                <div key={activity.id} className="relative pl-10 group">
                                    <div className={cn(
                                        "absolute left-0 w-8 h-8 rounded-md border flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110",
                                        activityStyles[activity.event_type] || activityStyles.note
                                    )}>
                                        <Icon size={16} />
                                    </div>

                                    <div className="p-3 rounded-md bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-medium text-slate-200">
                                                {activityLabels[activity.event_type] || "Activity"}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(activity.occurred_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                                            {activity.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-xs text-slate-500">No activities recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
