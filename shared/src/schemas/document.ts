import { z } from 'zod';
import { Database } from '../database.types';

export const DocumentTypeSchema = z.enum(['Resume', 'Cover_Letter', 'Portfolio', 'Other']);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    doc_type: DocumentTypeSchema,
    name: z.string().min(1),
    storage_path: z.string().min(1),
    content_text: z.string().nullable().optional(),
    is_primary: z.boolean().default(false),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Document = Database['jobhunter']['Tables']['documents']['Row'];

export const CreateDocumentSchema = DocumentSchema.omit({ id: true, user_id: true, created_at: true, updated_at: true });
export type CreateDocumentRequest = z.infer<typeof CreateDocumentSchema>;
