import sql from '../config/db';

export interface AILogData {
    user_id: string;
    feature: 'Job_Parsing' | 'Email_Analysis' | 'Cover_Letter_Generation' | 'Smart_Paste';
    model: string;
    prompt_summary?: string;
    tokens_input?: number;
    tokens_output?: number;
    cost?: number;
    latency_ms?: number;
    status: 'Success' | 'Failure' | 'Partial_Success';
    request_json?: unknown;
    response_json?: unknown;
}

export const logAIUsage = async (log: AILogData) => {
    try {
        await sql`
            INSERT INTO ai_usage_logs ${sql(log)}
        `;
    } catch (err) {
        console.error('Error logging AI usage:', err);
    }
};
