import { z } from 'zod';
import { Database } from '../database.types';

// Enums from Database
export const JobStatusSchema = z.enum(['Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted']);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const EmploymentTypeSchema = z.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']);
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

export const CreateJobSchema = z.object({
    title: z.string().min(1, "Title is required"),
    company: z.string().min(1, "Company name is required"),
    url: z.string().url("Invalid URL").or(z.string().length(0)),
    status: JobStatusSchema.default('Saved'),
    employment_type: EmploymentTypeSchema.default('Full-time'),
    salary_min: z.number().nullable().optional(),
    salary_max: z.number().nullable().optional(),
    location: z.string().nullable().optional(),
    skills_tools: z.array(z.string()).default([]),
    notes: z.string().nullable().optional(),
    date_posted: z.string().nullable().optional(),
    experience_level: z.string().nullable().optional(),
    contact_person: z.string().nullable().optional(),
    contact_email: z.string().email().or(z.string().length(0)).nullable().optional(),
    contact_phone: z.string().nullable().optional(),
    contact_linkedin: z.string().url().or(z.string().length(0)).nullable().optional(),
});

export type CreateJobRequest = z.infer<typeof CreateJobSchema>;

export const UpdateJobSchema = CreateJobSchema.partial();
export type UpdateJobRequest = z.infer<typeof UpdateJobSchema>;

// The full Job object as it comes from the DB
export type Job = Database['jobhunter']['Tables']['jobs']['Row'] & {
    activities?: Activity[];
};

export const GetJobsQuerySchema = z.object({
    status: JobStatusSchema.optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z.string().optional().transform(v => v ? parseInt(v) : undefined),
    limit: z.string().optional().transform(v => v ? parseInt(v) : undefined),
    search: z.string().optional(),
});

export type GetJobsQuery = z.infer<typeof GetJobsQuerySchema>;

export type PaginatedJobs = {
    data: Job[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
};

// Activity Schemas
export const ActivityEventTypeSchema = z.enum(['Manual', 'Email', 'Call', 'Status_Change', 'Note']);
export type ActivityEventType = z.infer<typeof ActivityEventTypeSchema>;

export const ActivityCategorySchema = z.enum(['Interview', 'Offer', 'Rejection', 'Question', 'Follow-up', 'General']);
export type ActivityCategory = z.infer<typeof ActivityCategorySchema>;

export const CreateActivitySchema = z.object({
    event_type: ActivityEventTypeSchema,
    category: ActivityCategorySchema.optional().nullable(),
    content: z.string().min(1, "Content is required"),
    occurred_at: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional().nullable(),
});

export type Activity = Database['jobhunter']['Tables']['activities']['Row'];
