import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';
import { logAIUsage } from '../utils/logger';

const router = Router();

const getOpenAIClient = (apiKey?: string) => {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key || key.startsWith('sk-placeholder')) return null;
    return new OpenAI({ apiKey: key });
};

// POST /analyze/job - Smart Ingest
router.post('/job', async (req: AuthRequest, res: Response) => {
    const { url, text } = req.body;
    const userId = req.user?.id!;
    const startTime = Date.now();

    if (!url && !text) {
        return res.status(400).json({ error: 'URL or text is required' });
    }

    const openai = getOpenAIClient();
    if (!openai) {
        return res.status(503).json({ error: 'OpenAI service not configured on server' });
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
            feature: 'job_analysis',
            model: response.model,
            tokens_input: response.usage?.prompt_tokens,
            tokens_output: response.usage?.completion_tokens,
            latency_ms: latency,
            status: 'success',
            request_json: { url, text_length: text?.length },
            response_json: result,
        });

        return res.json(result);
    } catch (error: any) {
        const latency = Date.now() - startTime;
        await logAIUsage({
            user_id: userId,
            feature: 'job_analysis',
            model: 'gpt-4o-mini',
            latency_ms: latency,
            status: 'error',
            response_json: { error: error.message },
        });
        return res.status(500).json({ error: error.message });
    }
});

// POST /analyze/activity - Smart Paste
router.post('/activity', async (req: AuthRequest, res: Response) => {
    const { text } = req.body;
    const userId = req.user?.id!;
    const startTime = Date.now();

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const openai = getOpenAIClient();
    if (!openai) {
        return res.status(503).json({ error: 'OpenAI service not configured on server' });
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
            feature: 'smart_paste',
            model: response.model,
            tokens_input: response.usage?.prompt_tokens,
            tokens_output: response.usage?.completion_tokens,
            latency_ms: latency,
            status: 'success',
            request_json: { text_length: text.length },
            response_json: result,
        });

        return res.json(result);
    } catch (error: any) {
        const latency = Date.now() - startTime;
        await logAIUsage({
            user_id: userId,
            feature: 'smart_paste',
            model: 'gpt-4o-mini',
            latency_ms: latency,
            status: 'error',
            response_json: { error: error.message },
        });
        return res.status(500).json({ error: error.message });
    }
});

export default router;
