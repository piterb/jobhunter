import { supabase } from '../config/supabase';

export interface AILogData {
    user_id: string;
    feature: 'job_analysis' | 'smart_paste' | 'cover_letter_gen' | 'chat';
    model: string;
    prompt_summary?: string;
    tokens_input?: number;
    tokens_output?: number;
    cost?: number;
    latency_ms?: number;
    status: 'success' | 'error';
    request_json?: any;
    response_json?: any;
}

export const logAIUsage = async (log: AILogData) => {
    try {
        const { error } = await supabase
            .schema('jobhunter')
            .from('ai_usage_logs')
            .insert([log]);

        if (error) {
            console.error('Failed to log AI usage:', error);
        }
    } catch (err) {
        console.error('Error logging AI usage:', err);
    }
};
