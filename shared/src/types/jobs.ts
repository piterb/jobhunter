export type JobStatus = 'Draft' | 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Ghosted';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Other';

export interface Job {
    id: string;
    title: string;
    company: string;
    status: JobStatus;
    employment_type: EmploymentType;
    salary_min?: number;
    salary_max?: number;
    location?: string;
    skills_tools?: string[];
    url: string;
    applied_at?: string; // ISO Date
    last_activity: string; // ISO Date
    notes?: string;
}

export interface Activity {
    id: string;
    job_id: string;
    event_type: 'Manual' | 'Email' | 'Call' | 'Status_Change';
    category?: 'Interview' | 'Offer' | 'Rejection' | 'Question';
    content: string;
    checksum: string;
    created_at: string; // ISO Date
}

export interface IngestRequest {
    url: string;
    model?: string;
}

export interface IngestResponse extends Omit<Job, 'id' | 'status' | 'last_activity'> {
    scraped_at: string;
}
