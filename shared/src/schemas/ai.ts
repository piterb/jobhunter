import { z } from 'zod';
import { Database } from '../database.types';

export const AIFeatureSchema = z.enum(['Job_Parsing', 'Email_Analysis', 'Cover_Letter_Generation', 'Smart_Paste']);
export type AIFeature = z.infer<typeof AIFeatureSchema>;

export const AIStatusSchema = z.enum(['Success', 'Failure', 'Partial_Success']);
export type AIStatus = z.infer<typeof AIStatusSchema>;

export const AIUsageLogSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    feature: AIFeatureSchema,
    model: z.string(),
    prompt_summary: z.string().nullable().optional(),
    tokens_input: z.number().int().nullable().optional(),
    tokens_output: z.number().int().nullable().optional(),
    cost: z.number().nullable().optional(),
    latency_ms: z.number().int().nullable().optional(),
    status: AIStatusSchema,
    request_json: z.record(z.any()).nullable().optional(),
    response_json: z.record(z.any()).nullable().optional(),
    created_at: z.string(),
});

export const CreateAIUsageLogSchema = AIUsageLogSchema.omit({ id: true, user_id: true, created_at: true });
export type CreateAIUsageLogRequest = z.infer<typeof CreateAIUsageLogSchema>;

export type AIUsageLog = Database['jobhunter']['Tables']['ai_usage_logs']['Row'];

export const IngestRequestSchema = z.object({
    url: z.string().url(),
    model: z.string().optional(),
    dryRun: z.boolean().optional(),
});

export const AnalyzeJobRequestSchema = z.object({
    url: z.string().url().optional(),
    text: z.string().optional(),
}).refine(data => data.url || data.text, {
    message: "Either URL or text must be provided"
});

export const AnalyzeActivityRequestSchema = z.object({
    text: z.string().min(1, "Text is required"),
});

export const GenerateCoverLetterRequestSchema = z.object({
    jobId: z.string().uuid("Invalid job ID"),
    customInstructions: z.string().optional(),
    dryRun: z.boolean().optional(),
});

export type IngestRequest = z.infer<typeof IngestRequestSchema>;
export type AnalyzeJobRequest = z.infer<typeof AnalyzeJobRequestSchema>;
export type AnalyzeActivityRequest = z.infer<typeof AnalyzeActivityRequestSchema>;
export type GenerateCoverLetterRequest = z.infer<typeof GenerateCoverLetterRequestSchema>;

export const GetAILogsQuerySchema = z.object({
    page: z.string().optional().transform(v => v ? parseInt(v) : undefined),
    limit: z.string().optional().transform(v => v ? parseInt(v) : undefined),
    feature: AIFeatureSchema.optional(),
    status: AIStatusSchema.optional(),
});

export type GetAILogsQuery = z.infer<typeof GetAILogsQuerySchema>;

export type PaginatedAILogs = {
    data: AIUsageLog[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
    totalTokens: number;
    avgLatency: number;
};
