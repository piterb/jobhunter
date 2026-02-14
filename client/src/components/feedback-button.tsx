'use client';

import React, { useState } from 'react';
import { toJpeg } from 'html-to-image';
import { MessageSquare, X, Send, Loader2, Camera, Trash2 } from 'lucide-react';
import { feedbackLogger } from '@/lib/feedback-logger';
import { useAuth } from '@/lib/auth-context';

export function FeedbackButton() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const takeScreenshot = async () => {
        // Hide the feedback button and modal to not include them in the screenshot
        const elementsToHide = document.querySelectorAll('.feedback-ignore');
        elementsToHide.forEach((el: any) => el.style.opacity = '0');

        try {
            const dataUrl = await toJpeg(document.body, {
                quality: 0.6,
                pixelRatio: 0.75,
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
                backgroundColor: '#0f172a', // Matches app bg
                style: {
                    // Ensure the capture starts from top
                    transform: 'none',
                    left: '0',
                    top: '0'
                },
                filter: (node: HTMLElement) => {
                    return !node.classList?.contains('feedback-ignore');
                }
            });

            setPreviewImage(dataUrl);
        } catch (err) {
            console.error('Failed to take screenshot', err);
        } finally {
            elementsToHide.forEach((el: any) => el.style.opacity = '1');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        const logs = feedbackLogger.getLogs();
        const metadata = {
            url: window.location.href,
            userEmail: user?.email,
            browser: navigator.userAgent,
            os: navigator.platform,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: new Date().toISOString()
        };

        try {
            // Fix: NEXT_PUBLIC_API_URL already contains /api/v1
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const response = await fetch(`${baseUrl}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    description,
                    screenshot: previewImage,
                    networkLogs: logs.networkLogs,
                    consoleLogs: logs.consoleLogs,
                    metadata
                })
            });

            if (!response.ok) throw new Error('Failed to send feedback');

            setShowSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setShowSuccess(false);
                setSubject('');
                setDescription('');
                setPreviewImage(null);
            }, 3000);
        } catch (err) {
            alert('Failed to send feedback. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="feedback-ignore fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <div className="mb-2 w-96 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/50 px-4 py-3">
                        <h3 className="flex items-center gap-2 font-semibold text-white">
                            <MessageSquare size={18} className="text-sky-400" />
                            Send Feedback
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {showSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 px-6 text-center animate-in zoom-in-95 duration-300">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                                <Send size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-white">Report Sent!</h4>
                            <p className="mt-1 text-sm text-slate-400">Thank you for your feedback. We'll check it out soon.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Subject</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                                    placeholder="Briefly, what's wrong?"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all resize-none"
                                    placeholder="Tell us more about the issue..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Visual Snapshot</label>
                                    {!previewImage && (
                                        <button
                                            type="button"
                                            onClick={takeScreenshot}
                                            className="flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                                        >
                                            <Camera size={14} />
                                            Capture Screen
                                        </button>
                                    )}
                                </div>

                                {previewImage ? (
                                    <div className="relative group overflow-hidden rounded-lg border border-slate-700">
                                        <img src={previewImage} alt="Preview" className="w-full object-cover max-h-40" />
                                        <div className="absolute top-2 right-2">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewImage(null)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-400 backdrop-blur-sm hover:bg-red-500 hover:text-white transition-all shadow-lg border border-slate-700"
                                                title="Remove screenshot"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/50 text-slate-500">
                                        <Camera size={24} className="mb-2 opacity-50" />
                                        <span className="text-xs">Optional screenshot</span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSending}
                                className="group relative w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isSending ? (
                                    <Loader2 size={18} className="animate-spin text-white/70" />
                                ) : (
                                    <>
                                        Send Report
                                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-900/40 hover:bg-sky-500 hover:scale-110 active:scale-95 transition-all duration-300 ${isOpen ? 'rotate-90 bg-slate-700 hover:bg-slate-600' : ''}`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
}
