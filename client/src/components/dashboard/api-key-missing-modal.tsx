"use client";

import { Modal } from "@/components/ui/modal";
import { Key, ExternalLink, AlertCircle, Sparkles, Settings } from "lucide-react";
import Link from "next/link";

interface ApiKeyMissingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ApiKeyMissingModal({ isOpen, onClose }: ApiKeyMissingModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="OpenAI API Key Required"
            className="max-w-md"
        >
            <div className="space-y-6 py-2">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 ring-1 ring-indigo-500/20">
                        <Key size={32} />
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white">Missing API Key</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        To use the smart ingest feature, you need to provide your own
                        <span className="text-indigo-400 font-medium"> OpenAI API Key</span>.
                    </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-amber-500 font-bold shrink-0">
                            <AlertCircle size={16} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Why is this needed?</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Our AI features use OpenAI's powerful models to parse job descriptions.
                                This is a "Bring Your Own Key" (BYOK) application, meaning you only pay
                                for what you use directly to the AI provider.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Link
                        href="/settings/api-keys"
                        onClick={onClose}
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                        <Settings size={18} />
                        Go to Settings
                    </Link>

                    <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <ExternalLink size={18} />
                        Get OpenAI Key
                    </a>
                </div>

                <p className="text-[10px] text-center text-slate-500 italic">
                    <Sparkles size={10} className="inline mr-1" />
                    You'll need a paid OpenAI account with a small balance to use AI features.
                </p>
            </div>
        </Modal>
    );
}
