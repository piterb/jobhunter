import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';
import { logAIUsage } from '../utils/logger';
import { createSupabaseUserClient } from '../config/supabase';

const router = Router();

// Helper to get OpenAI client
const getOpenAIClient = (apiKey?: string) => {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key || key.startsWith('sk-placeholder')) return null;
    return new OpenAI({ apiKey: key });
};

const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// POST /generate/cover-letter
router.post('/cover-letter', async (req: AuthRequest, res: Response) => {
    const { jobId, customInstructions } = req.body;
    const userId = req.user?.id!;
    const startTime = Date.now();
    const supabase = getClient(req);

    if (!jobId) {
        return res.status(400).json({ error: 'jobId is required' });
    }

    // 1. Fetch Job and Profile context
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        // .eq('user_id', userId) // RLS handles this, but good to keep in mind
        .single();

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (jobError || !job) return res.status(404).json({ error: 'Job not found' });

    const openai = getOpenAIClient(profile?.openai_api_key);
    if (!openai) return res.status(503).json({ error: 'OpenAI not configured' });

    try {
        const prompt = `
      Write a professional cover letter for the following position:
      Job: ${job.title} at ${job.company}
      Location: ${job.location || 'N/A'}
      Description: ${job.notes || ''}
      
      User Profile:
      Name: ${profile?.full_name || 'N/A'}
      Headline: ${profile?.professional_headline || 'N/A'}
      
      Custom Instructions: ${customInstructions || 'None'}
      
      Return the response in JSON format with a "content" field containing the markdown text of the cover letter.
    `;

        const response = await openai.chat.completions.create({
            model: profile?.default_ai_model || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        const latency = Date.now() - startTime;

        await logAIUsage({
            user_id: userId,
            feature: 'cover_letter_gen',
            model: response.model,
            tokens_input: response.usage?.prompt_tokens,
            tokens_output: response.usage?.completion_tokens,
            latency_ms: latency,
            status: 'success',
            request_json: { jobId, customInstructions },
            response_json: { content_length: result.content?.length },
        });

        return res.json(result);
    } catch (error: any) {
        const latency = Date.now() - startTime;
        await logAIUsage({
            user_id: userId,
            feature: 'cover_letter_gen',
            model: 'gpt-4o-mini',
            latency_ms: latency,
            status: 'error',
            response_json: { error: error.message },
        });
        return res.status(500).json({ error: error.message });
    }
});

export default router;
