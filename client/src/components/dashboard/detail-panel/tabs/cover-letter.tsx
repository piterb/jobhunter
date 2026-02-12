"use client";

import { useState } from "react";
import { Job } from "@/types/job";
import { Sparkles, Wand2, Copy, Download, Check, FileText, Cpu } from "lucide-react";

interface CoverLetterTabProps {
    job: Job;
}

export function CoverLetterTab({ job }: CoverLetterTabProps) {
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [content, setContent] = useState("");
    const [copying, setCopying] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Mock generation delay
        setTimeout(() => {
            setContent(`Dear Hiring Manager at ${job.company},

I am writing to express my strong interest in the ${job.title} position as advertised. With my background in software engineering and experience with relevant technologies, I am confident that I can contribute effectively to your team.

I have been following ${job.company}'s work and I am impressed by your commitment to innovation. My skills in ${job.skills_tools?.slice(0, 3).join(', ') || 'modern web development'} would allow me to hit the ground running and add value from day one.

Thank you for your time and consideration.

Best regards,
Peter Developer`);
            setHasGenerated(true);
            setIsGenerating(false);
        }, 1500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* AI Tool Box */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-md text-indigo-400">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white">AI Tailoring</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            Generate a cover letter based on your profile and this job description.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <select className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-2 text-xs text-slate-300 appearance-none focus:outline-none focus:border-indigo-500 transition-all cursor-pointer">
                            <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                            <option value="gpt-4o">GPT-4o (High Quality)</option>
                        </select>
                        <Cpu size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-md text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Wand2 size={16} />
                        )}
                        {isGenerating ? "Analyzing..." : "Generate Personalized Letter"}
                    </button>
                </div>
            </div>

            {hasGenerated ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Draft Preview
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                title="Copy to clipboard"
                            >
                                {copying ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                            <button
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                title="Download as PDF"
                            >
                                <Download size={14} />
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 font-serif leading-relaxed h-[400px] overflow-y-auto focus:outline-none focus:border-indigo-500/50 transition-all resize-none custom-scrollbar"
                    />
                </div>
            ) : (
                <div className="text-center py-12 space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-slate-600">
                        <FileText size={24} />
                    </div>
                    <p className="text-sm text-slate-500">No cover letter generated yet.</p>
                </div>
            )}
        </div>
    );
}
