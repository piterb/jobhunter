export type JobStatus = "draft" | "applied" | "interview" | "offer" | "rejected" | "ghosted";

export type ActivityType = "note" | "status_change" | "email" | "call" | "meeting" | "interview";

export interface Activity {
    id: string;
    job_id: string;
    user_id: string;
    event_type: ActivityType;
    category?: string;
    content: string;
    raw_content?: string;
    occurred_at: string;
    created_at: string;
}

export interface Job {
    id: string;
    user_id: string;
    title: string;
    company: string;
    status: JobStatus;
    location: string | null;
    salary_min: number | null;
    salary_max: number | null;
    url: string | null;
    skills_tools: string[] | null;
    experience_level: string | null;
    contact_person: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_linkedin: string | null;
    applied_at: string | null;
    last_activity: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    activities?: Activity[];
}
