import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AnalyzeJobRequestSchema, AnalyzeActivityRequestSchema, AnalyzeJobRequest, AnalyzeActivityRequest } from 'shared';
import OpenAI from 'openai';
import { logAIUsage } from '../utils/logger';
import { supabase } from '../config/supabase';

const router = Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

const getOpenAIClient = (apiKey?: string) => {
    if (!apiKey || apiKey.startsWith('sk-placeholder')) return null;
    return new OpenAI({ apiKey });
};

// POST /analyze/job - Smart Ingest
router.post('/job', validate(AnalyzeJobRequestSchema), async (req: AuthRequest<{}, {}, AnalyzeJobRequest>, res: Response) => {
    const { url, text } = req.body;
    const userId = req.user?.id!;
    const startTime = Date.now();

    if (!url && !text) {
        return res.status(400).json({ error: 'URL or text is required' });
    }

    // Fetch user profile for API key
    const { data: profile } = await supabase
        .from('profiles')
        .select('openai_api_key')
        .eq('id', userId)
        .single();

    const openai = getOpenAIClient(profile?.openai_api_key);
    if (!openai) {
        return res.status(400).json({ error: 'OpenAI API key not found in your profile (BYOK).' });
    }

    try {
        const prompt = `
      Analyze the following job posting (from URL or text) and extract information in JSON format.
      Fields: title, company, skills (array), salary_min (number), salary_max (number), location, description (markdown).
      Content: ${text || url}
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        const latency = Date.now() - startTime;

        // Log the success
        await logAIUsage({
            user_id: userId,
            feature: 'Job_Parsing',
            model: response.model,
            tokens_input: response.usage?.prompt_tokens,
            tokens_output: response.usage?.completion_tokens,
            latency_ms: latency,
            status: 'Success',
            request_json: { url, text_length: text?.length },
            response_json: result,
        });

        return res.json(result);
    } catch (error: any) {
        const latency = Date.now() - startTime;
        await logAIUsage({
            user_id: userId,
            feature: 'Job_Parsing',
            model: 'gpt-4o-mini',
            latency_ms: latency,
            status: 'Failure',
            response_json: { error: error.message },
        });
        return res.status(500).json({ error: error.message });
    }
});

// POST /analyze/activity - Smart Paste
router.post('/activity', validate(AnalyzeActivityRequestSchema), async (req: AuthRequest<{}, {}, AnalyzeActivityRequest>, res: Response) => {
    const { text } = req.body;
    const userId = req.user?.id!;
    const startTime = Date.now();

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    // Fetch user profile for API key
    const { data: profile } = await supabase
        .from('profiles')
        .select('openai_api_key')
        .eq('id', userId)
        .single();

    const openai = getOpenAIClient(profile?.openai_api_key);
    if (!openai) {
        return res.status(400).json({ error: 'OpenAI API key not found in your profile (BYOK).' });
    }

    try {
        const prompt = `
      Analyze this text (email or note) related to a job application. 
      Identify: type (note, email, call, meeting), category (interview, offer, rejection, question, info), summary, and any mentioned date.
      Return as JSON.
      Text: ${text}
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        const latency = Date.now() - startTime;

        await logAIUsage({
            user_id: userId,
            feature: 'Smart_Paste',
            model: response.model,
            tokens_input: response.usage?.prompt_tokens,
            tokens_output: response.usage?.completion_tokens,
            latency_ms: latency,
            status: 'Success',
            request_json: { text_length: text.length },
            response_json: result,
        });

        return res.json(result);
    } catch (error: any) {
        const latency = Date.now() - startTime;
        await logAIUsage({
            user_id: userId,
            feature: 'Smart_Paste',
            model: 'gpt-4o-mini',
            latency_ms: latency,
            status: 'Failure',
            response_json: { error: error.message },
        });
        return res.status(500).json({ error: error.message });
    }
});

export default router;
