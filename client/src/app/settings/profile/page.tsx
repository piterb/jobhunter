"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
    User,
    Mail,
    Briefcase,
    Ghost,
    UploadCloud,
    FileText,
    Image as ImageIcon,
    FileCode,
    Eye,
    Trash2,
    Save,
    Loader2,
    CheckCircle2,
    XCircle,
    Loader,
    Download,
    Wand2,
    Check,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface Profile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    professional_headline: string | null;
    ghosting_threshold_days: number;
}

interface Document {
    id: string;
    name: string;
    doc_type: string;
    storage_path: string;
    is_primary: boolean;
    created_at: string;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false); // New state for file upload
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [previewAvatar, setPreviewAvatar] = useState<{ url: string, blob: Blob, seed: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchDocuments();
        }
    }, [user]);

    async function fetchProfile() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchDocuments() {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (err) {
            console.error("Error fetching documents:", err);
        }
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    professional_headline: profile.professional_headline,
                    ghosting_threshold_days: profile.ghosting_threshold_days,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            window.dispatchEvent(new Event('profile-updated'));
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDocument = async (id: string, storagePath: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([storagePath]);

            if (storageError) console.warn("Storage deletion error (continuing):", storageError);

            // 2. Delete from DB
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setDocuments(docs => docs.filter(d => d.id !== id));
            setMessage({ type: 'success', text: 'Document deleted successfully.' });
        } catch (err: any) {
            console.error("Error deleting document:", err);
            setMessage({ type: 'error', text: err.message || 'Failed to delete document.' });
        }
    };

    const handleDownloadDocument = async (storagePath: string, fileName: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .download(storagePath);

            if (error) throw error;

            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Error downloading document:", err);
            alert("Failed to download document: " + err.message);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // Validation
        const allowedExtensions = ['pdf', 'md', 'txt', 'jpg', 'jpeg', 'png', 'docx'];
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

        if (!allowedExtensions.includes(fileExt)) {
            setMessage({
                type: 'error',
                text: `Invalid file format. Supported: ${allowedExtensions.join(', ').toUpperCase()}`
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'File size must be less than 5MB.' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setUploading(true);
            setMessage(null);

            // 1. Upload to Storage
            // Sanitize filename to avoid issues
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
            const filePath = `${user?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Insert into DB
            const { data: docData, error: dbError } = await supabase
                .from('documents')
                .insert({
                    user_id: user?.id,
                    name: file.name,
                    storage_path: filePath,
                    doc_type: 'Resume', // Defaulting to Resume
                    is_primary: false
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Update local state
            setDocuments(prev => [docData, ...prev]);
            setMessage({ type: 'success', text: 'Document uploaded successfully!' });
        } catch (err: any) {
            console.error("Error uploading document:", err);
            setMessage({ type: 'error', text: err.message || 'Failed to upload document.' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleGenerateAvatar = async () => {
        try {
            setSaving(true);
            setMessage(null);

            // Using DiceBear for random avatars
            const styles = ['avataaars', 'bottts', 'pixel-art', 'lorelei', 'notionists'];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            const seed = Math.random().toString(36).substring(7);
            const avatarUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}`;

            // Fetch the avatar from DiceBear
            const response = await fetch(avatarUrl);
            const blob = await response.blob();

            // Set preview instead of uploading immediately
            if (previewAvatar) URL.revokeObjectURL(previewAvatar.url);
            setPreviewAvatar({
                url: URL.createObjectURL(blob),
                blob: blob,
                seed: seed
            });
        } catch (err: any) {
            console.error("Error generating avatar:", err);
            setMessage({ type: 'error', text: err.message || 'Failed to generate avatar.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGeneratedAvatar = async () => {
        if (!previewAvatar || !user) return;

        try {
            setSaving(true);
            setMessage(null);

            // 1. Upload to Storage (avatars bucket)
            const fileExt = previewAvatar.blob.type.split('/')[1] || 'png';
            const fileName = `avatar_${Date.now()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;
            const file = new File([previewAvatar.blob], fileName, { type: previewAvatar.blob.type });

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (updateError) throw updateError;

            setProfile(p => p ? { ...p, avatar_url: publicUrl } : null);
            window.dispatchEvent(new Event('profile-updated'));
            setMessage({ type: 'success', text: 'Avatar saved successfully!' });

            // Cleanup preview
            URL.revokeObjectURL(previewAvatar.url);
            setPreviewAvatar(null);
        } catch (err: any) {
            console.error("Error saving avatar:", err);
            setMessage({ type: 'error', text: err.message || 'Failed to save avatar.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDiscardGeneratedAvatar = () => {
        if (previewAvatar) {
            URL.revokeObjectURL(previewAvatar.url);
            setPreviewAvatar(null);
        }
    };

    const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // Validation
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

        if (!allowedExtensions.includes(fileExt)) {
            setMessage({
                type: 'error',
                text: `Invalid image format. Supported: ${allowedExtensions.join(', ').toUpperCase()}`
            });
            return;
        }

        if (file.size > 1 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Avatar size must be less than 1MB.' });
            return;
        }

        // Set preview instead of uploading immediately
        if (previewAvatar) URL.revokeObjectURL(previewAvatar.url);
        setPreviewAvatar({
            url: URL.createObjectURL(file),
            blob: file,
            seed: Date.now().toString()
        });

        // Clear input so the same file can be selected again
        if (avatarInputRef.current) avatarInputRef.current.value = '';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Page Header */}
                <div className="border-b border-slate-800 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Profile Settings</h1>
                        <p className="mt-1 text-sm text-slate-400">Manage your personal information and resume settings.</p>
                    </div>
                    {message && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-in zoom-in duration-300",
                            message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        )}>
                            {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {message.text}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-8">
                    {/* Basic Information Card */}
                    <section className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-medium text-white">Personal Information</h2>
                                <p className="text-sm text-slate-400">Basic details for your job applications.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="relative group/avatar">
                                    <div className={cn(
                                        "w-20 h-20 rounded-full bg-slate-800 border-2 flex items-center justify-center text-2xl font-bold transition-all overflow-hidden",
                                        previewAvatar ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-110" : "border-slate-700 text-slate-300 shadow-inner group-hover/avatar:border-indigo-500/50"
                                    )}>
                                        {previewAvatar ? (
                                            <img src={previewAvatar.url} alt="Preview" className="w-full h-full object-cover" />
                                        ) : profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || <User size={32} />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-indigo-500/0 group-hover/avatar:bg-indigo-500/10 transition-all pointer-events-none" />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap gap-2 items-center min-h-[40px]">
                                        {!previewAvatar ? (
                                            <>
                                                <input
                                                    type="file"
                                                    ref={avatarInputRef}
                                                    className="hidden"
                                                    onChange={handleAvatarSelect}
                                                    accept="image/*"
                                                />
                                                <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                                                    <button
                                                        type="button"
                                                        onClick={() => avatarInputRef.current?.click()}
                                                        disabled={saving}
                                                        className="px-4 py-2 text-sm font-medium border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                                        Upload Avatar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleGenerateAvatar}
                                                        disabled={saving}
                                                        className="px-4 py-2 text-sm font-medium border border-indigo-500/30 bg-indigo-500/10 rounded-lg text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/gen"
                                                    >
                                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} className="group-hover/gen:rotate-12 transition-transform" />}
                                                        Generate Avatar
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-left-2 duration-300">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveGeneratedAvatar}
                                                    disabled={saving}
                                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleDiscardGeneratedAvatar}
                                                    disabled={saving}
                                                    className="px-4 py-2 text-sm font-medium bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                                >
                                                    <X size={16} />
                                                    Discard
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateAvatar}
                                                    disabled={saving}
                                                    className="px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors hover:bg-indigo-500/5 rounded-lg"
                                                >
                                                    <Wand2 size={14} />
                                                    Try another
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {!previewAvatar && <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 1MB.</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="full-name" className="block text-sm font-medium text-slate-400">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                                            <User size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            id="full-name"
                                            value={profile?.full_name || ""}
                                            onChange={(e) => setProfile(p => p ? { ...p, full_name: e.target.value } : null)}
                                            className="block w-full rounded-lg border-slate-800 bg-slate-950/50 pl-10 pr-4 py-2 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm border"
                                            placeholder="e.g. Peter Developer"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-400">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            value={profile?.email || ""}
                                            disabled
                                            className="block w-full rounded-lg border-slate-800 bg-slate-900/30 pl-10 pr-4 py-2 text-slate-500 cursor-not-allowed text-sm border font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label htmlFor="headline" className="block text-sm font-medium text-slate-400">Professional Headline</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                                            <Briefcase size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            id="headline"
                                            value={profile?.professional_headline || ""}
                                            onChange={(e) => setProfile(p => p ? { ...p, professional_headline: e.target.value } : null)}
                                            className="block w-full rounded-lg border-slate-800 bg-slate-950/50 pl-10 pr-4 py-2 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm border"
                                            placeholder="e.g. Senior Frontend Engineer"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">Used as a fallback title for generated cover letters.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Job Application Tracking Card */}
                    <section className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors" />
                        <div className="mb-6">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                                <Ghost className="w-5 h-5 text-purple-400" />
                                Job Application Tracking
                            </h2>
                            <p className="text-sm text-slate-400">Configure how the system identifies inactive job applications.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-lg border border-slate-800/50">
                            <div className="space-y-1">
                                <label htmlFor="ghosting-threshold" className="block text-sm font-medium text-slate-300">Ghosting Threshold (Days)</label>
                                <p className="text-xs text-slate-500 max-w-md">Number of days without activity before an application is automatically flagged as "ghosted".</p>
                            </div>
                            <div className="w-24">
                                <input
                                    type="number"
                                    id="ghosting-threshold"
                                    value={profile?.ghosting_threshold_days || 14}
                                    onChange={(e) => setProfile(p => p ? { ...p, ghosting_threshold_days: parseInt(e.target.value) || 0 } : null)}
                                    min="1"
                                    max="90"
                                    className="block w-full rounded-lg border-slate-700 bg-slate-950 py-2 text-white text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm border"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Save Changes
                        </button>
                    </div>
                </form>

                {/* Documents & Attachments Card */}
                <section className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors" />
                    <div className="mb-6">
                        <h2 className="text-lg font-medium text-white">Documents & Attachments</h2>
                        <p className="text-sm text-slate-400">Manage your resume, cover letters, and other professional certificates.</p>
                    </div>

                    {/* Upload Zone */}
                    <div
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={cn(
                            "border-2 border-dashed border-slate-800 rounded-xl p-10 text-center transition-all cursor-pointer group/upload relative",
                            uploading ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-500/50 hover:bg-indigo-500/5"
                        )}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.md,.txt,.jpg,.jpeg,.png,.docx"
                        />

                        {uploading ? (
                            <div className="flex flex-col items-center justify-center">
                                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                                <p className="text-slate-400">Uploading...</p>
                            </div>
                        ) : (
                            <>
                                <div className="mx-auto h-12 w-12 text-slate-600 group-hover/upload:text-indigo-400 group-hover/upload:scale-110 transition-all mb-4">
                                    <UploadCloud className="w-full h-full" />
                                </div>
                                <h3 className="text-sm font-semibold text-white">Upload a file</h3>
                                <p className="mt-1 text-xs text-slate-500">Drag and drop or click to browse. PDF, MD, TXT, JPG, PNG up to 10MB.</p>
                            </>
                        )}
                    </div>

                    {/* File List */}
                    <div className="mt-8 space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Uploaded Files ({documents.length})</h4>
                        </div>

                        {documents.length === 0 ? (
                            <div className="text-center py-12 bg-slate-950/20 rounded-lg border border-slate-800/50">
                                <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="group/file flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900/50 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "p-2.5 rounded-lg border",
                                                doc.doc_type === 'Resume' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                    doc.doc_type === 'Cover_Letter' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                            )}>
                                                {doc.doc_type === 'Resume' ? <FileText size={20} /> :
                                                    doc.doc_type === 'Cover_Letter' ? <FileCode size={20} /> :
                                                        <ImageIcon size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white group-hover/file:text-indigo-400 transition-colors">{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter px-1.5 py-0.5 bg-slate-800 rounded">{doc.doc_type.replace('_', ' ')}</span>
                                                    <span className="text-[10px] text-slate-600 font-medium">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                    {doc.is_primary && (
                                                        <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-tighter px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">Primary</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDownloadDocument(doc.storage_path, doc.name)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id, doc.storage_path)}
                                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div >
    );
}
