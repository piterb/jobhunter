export type JobStatus = 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Ghosted';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
export type ActivityEventType = 'Manual' | 'Email' | 'Call' | 'Status_Change' | 'Note';
export type ActivityCategory = 'Interview' | 'Offer' | 'Rejection' | 'Question' | 'Follow-up' | 'General';
export type DocumentType = 'Resume' | 'Cover_Letter' | 'Portfolio' | 'Other';
export type AIFeature = 'Job_Parsing' | 'Email_Analysis' | 'Cover_Letter_Generation' | 'Smart_Paste';
export type AIStatus = 'Success' | 'Failure' | 'Partial_Success';

export interface Profile {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    professional_headline?: string | null;
    onboarding_completed: boolean;
    theme: string;
    language: string;
    openai_api_key?: string | null;
    default_ai_model: string;
    ghosting_threshold_days: number;
    created_at: string;
    updated_at: string;
}

export interface Job {
    id: string;
    user_id: string;
    title: string;
    company: string;
    status: JobStatus;
    employment_type: EmploymentType;
    salary_min?: number | null;
    salary_max?: number | null;
    location?: string | null;
    skills_tools?: string[] | null;
    url: string;
    date_posted?: string | null;
    experience_level?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    contact_linkedin?: string | null;
    applied_at?: string | null;
    last_activity: string;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    activities?: Activity[];
}

export interface Activity {
    id: string;
    job_id: string;
    user_id: string;
    event_type: ActivityEventType;
    category?: ActivityCategory | null;
    content: string;
    raw_content?: string | null;
    metadata?: Record<string, any> | null;
    checksum?: string | null;
    occurred_at: string;
    created_at: string;
}

export interface Document {
    id: string;
    user_id: string;
    doc_type: DocumentType;
    name: string;
    storage_path: string;
    content_text?: string | null;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

export interface AIUsageLog {
    id: string;
    user_id: string;
    feature: AIFeature;
    model: string;
    prompt_summary?: string | null;
    tokens_input?: number | null;
    tokens_output?: number | null;
    cost?: number | null;
    latency_ms?: number | null;
    status: AIStatus;
    request_json?: Record<string, any> | null;
    response_json?: Record<string, any> | null;
    created_at: string;
}

export interface CreateJobRequest {
    title: string;
    company: string;
    url: string;
    status: JobStatus; // Required or optional? DB has default. Let's make it optional in request? No, usually required or default. But defined in Spec?
    // User might not pick status, so optional.
    employment_type?: EmploymentType;
    salary_min?: number;
    salary_max?: number;
    location?: string;
    skills_tools?: string[];
    notes?: string;
    date_posted?: string;
    experience_level?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_linkedin?: string;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> { }

export interface IngestRequest {
    url: string;
    model?: string;
}
