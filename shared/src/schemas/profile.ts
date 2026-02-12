import { z } from 'zod';
import { Database } from '../database.types';

export const ProfileSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    full_name: z.string().nullable().optional(),
    avatar_url: z.string().url().nullable().optional().or(z.string().length(0)),
    professional_headline: z.string().nullable().optional(),
    onboarding_completed: z.boolean().default(false),
    theme: z.string().default('dark'),
    language: z.string().default('en'),
    openai_api_key: z.string().nullable().optional(),
    default_ai_model: z.string().default('gpt-4o-mini'),
    ghosting_threshold_days: z.number().int().default(30),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Profile = Database['jobhunter']['Tables']['profiles']['Row'];

export const UpdateProfileSchema = ProfileSchema.partial().omit({ id: true, email: true, created_at: true });
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
