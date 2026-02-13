"use client";

import { Job } from "@/types/job";
import { Mail, Phone, Linkedin, ExternalLink } from "lucide-react";

interface OverviewTabProps {
    job: Job;
}

export function OverviewTab({ job }: OverviewTabProps) {
    const hasContact = job.contact_person || job.contact_email || job.contact_phone || job.contact_linkedin;

    return (
        <div className="space-y-6">
            {/* Contact Person */}
            {hasContact && (
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</h3>
                    <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-4 space-y-3">
                        {job.contact_person && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-400">
                                    {job.contact_person.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{job.contact_person}</div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 pt-1">
                            {job.contact_email && (
                                <a href={`mailto:${job.contact_email}`} className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-white transition-colors group">
                                    <Mail size={14} className="text-slate-500 group-hover:text-indigo-400" />
                                    {job.contact_email}
                                </a>
                            )}
                            {job.contact_phone && (
                                <a href={`tel:${job.contact_phone}`} className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-white transition-colors group">
                                    <Phone size={14} className="text-slate-500 group-hover:text-indigo-400" />
                                    {job.contact_phone}
                                </a>
                            )}
                            {job.contact_linkedin && (
                                <a href={job.contact_linkedin} target="_blank" className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-white transition-colors group">
                                    <Linkedin size={14} className="text-slate-500 group-hover:text-indigo-400" />
                                    LinkedIn Profile
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Highlights */}
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Salary Range</span>
                    <span className="text-sm font-medium text-emerald-400">
                        {job.salary_min ? (
                            job.salary_max && job.salary_max !== job.salary_min
                                ? `$${(job.salary_min / 1000)}k - $${(job.salary_max / 1000)}k`
                                : `$${(job.salary_min / 1000)}k`
                        ) : "Not disclosed"}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Location</span>
                    <span className="text-sm font-medium text-white">{job.location || "Remote"}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Experience</span>
                    <span className="text-sm font-medium text-white">{job.experience_level || "Not specified"}</span>
                </div>
            </div>

            {/* Description */}
            {job.notes && (
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description / Notes</h3>
                    <div
                        className="text-sm text-slate-400 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar pr-2"
                        dangerouslySetInnerHTML={{ __html: job.notes.replace(/\n/g, '<br/>') }}
                    />
                </div>
            )}

            {/* Skills */}
            {job.skills_tools && job.skills_tools.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {job.skills_tools.map(skill => (
                            <span key={skill} className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {job.url && (
                <a
                    href={job.url}
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all text-sm font-medium"
                >
                    View Original Job Post
                    <ExternalLink size={14} />
                </a>
            )}
        </div>
    );
}
