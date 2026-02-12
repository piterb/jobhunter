"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Job, JobStatus, EmploymentType } from "@/types/job";
import { jobService } from "@/services/job-service";
import { Loader2, X } from "lucide-react";

interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJobAdded: () => void;
    initialData?: Partial<Job>;
}

const JOB_STATUSES: { value: JobStatus; label: string }[] = [
    { value: "Saved", label: "Draft" },
    { value: "Applied", label: "Applied" },
    { value: "Interview", label: "Interviewing" },
    { value: "Offer", label: "Offer" },
    { value: "Rejected", label: "Rejected" },
    { value: "Ghosted", label: "Ghosted" },
];

export function AddJobModal({ isOpen, onClose, onJobAdded, initialData }: AddJobModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Job>>({
        title: "",
        company: "",
        url: "",
        location: "",
        status: "Saved",
        salary_min: null,
        salary_max: null,
        employment_type: "Full-time",
        skills_tools: [],
        notes: "",
    });

    const [skillInput, setSkillInput] = useState("");

    // Sync form data with initialData when modal opens
    const [lastInitialData, setLastInitialData] = useState<Partial<Job> | undefined>(undefined);
    if (isOpen && initialData !== lastInitialData) {
        setFormData({
            title: initialData?.title || "",
            company: initialData?.company || "",
            url: initialData?.url || "",
            location: initialData?.location || "",
            status: initialData?.status || "Saved",
            salary_min: initialData?.salary_min ?? null,
            salary_max: initialData?.salary_max ?? null,
            employment_type: initialData?.employment_type || "Full-time",
            skills_tools: initialData?.skills_tools || [],
            notes: initialData?.notes || "",
        });
        setLastInitialData(initialData);
    }

    const addSkill = (skill: string) => {
        const trimmedSkill = skill.trim();
        if (trimmedSkill && !formData.skills_tools?.includes(trimmedSkill)) {
            setFormData(prev => ({
                ...prev,
                skills_tools: [...(prev.skills_tools || []), trimmedSkill]
            }));
        }
        setSkillInput("");
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills_tools: (prev.skills_tools || []).filter(s => s !== skillToRemove)
        }));
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill(skillInput);
        } else if (e.key === 'Backspace' && !skillInput && formData.skills_tools?.length) {
            removeSkill(formData.skills_tools[formData.skills_tools.length - 1]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await jobService.createJob(formData);
            onJobAdded();
            onClose();
            // Reset form
            setFormData({
                title: "",
                company: "",
                url: "",
                location: "",
                status: "Saved",
                salary_min: null,
                salary_max: null,
                employment_type: "Full-time",
                skills_tools: [],
                notes: "",
            });
        } catch (error) {
            console.error("Failed to add job:", error);
            // In a real app, show a toast here
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Job"
            className="sm:max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Job Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. Senior Frontend Engineer"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Company <span className="text-rose-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. Vercel"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Job URL
                    </label>
                    <input
                        type="url"
                        value={formData.url || ""}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                        placeholder="https://careers.company.com/..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all appearance-none"
                        >
                            {JOB_STATUSES.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location || ""}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. Remote, SF"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Employment Type
                        </label>
                        <select
                            value={formData.employment_type}
                            onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as EmploymentType })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all appearance-none"
                        >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                            <option value="Freelance">Freelance</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Salary Min
                        </label>
                        <input
                            type="number"
                            value={formData.salary_min || ""}
                            onChange={(e) => setFormData({ ...formData, salary_min: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Salary Max
                        </label>
                        <input
                            type="number"
                            value={formData.salary_max || ""}
                            onChange={(e) => setFormData({ ...formData, salary_max: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Skills & Tools
                    </label>
                    <div className="min-h-[42px] p-1.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all">
                        {formData.skills_tools?.map((skill) => (
                            <span
                                key={skill}
                                className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-md border border-indigo-500/20"
                            >
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    className="p-0.5 hover:bg-indigo-500/20 rounded-full transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            onBlur={() => addSkill(skillInput)}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 min-w-[120px] px-2 py-1"
                            placeholder={formData.skills_tools?.length ? "Add more..." : "e.g. React, TypeScript, Node.js"}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500">Press Enter to add a skill</p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Description / Notes
                    </label>
                    <textarea
                        rows={6}
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-none"
                        placeholder="Paste job description or add notes..."
                    />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Save Job
                    </button>
                </div>
            </form>
        </Modal>
    );
}
