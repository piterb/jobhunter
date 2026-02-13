import { supabaseAdminJobhunter } from '../config/supabase';

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
    request_json?: any;
    response_json?: any;
}

export const logAIUsage = async (log: AILogData) => {
    try {
        const { error } = await supabaseAdminJobhunter
            .from('ai_usage_logs')
            .insert([log]);

        if (error) {
            console.error('Failed to log AI usage:', error);
        }
    } catch (err) {
        console.error('Error logging AI usage:', err);
    }
};
