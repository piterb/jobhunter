import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { GenerateCoverLetterRequestSchema, GenerateCoverLetterRequest } from 'shared';
import OpenAI from 'openai';
import { logAIUsage } from '../utils/logger';
import { createSupabaseUserClient } from '../config/supabase';

const router = Router();

// Helper to get OpenAI client
const getOpenAIClient = (apiKey?: string) => {
    if (!apiKey || apiKey.startsWith('sk-placeholder')) return null;
    return new OpenAI({ apiKey: apiKey });
};

const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// POST /generate/cover-letter
router.post('/cover-letter', validate(GenerateCoverLetterRequestSchema), async (req: AuthRequest<{}, {}, GenerateCoverLetterRequest>, res: Response) => {
    const { jobId, customInstructions, dryRun } = req.body;
    const userId = req.user!.id;
    const startTime = Date.now();
    const supabase = getClient(req);

    if (!jobId) {
        return res.status(400).json({ error: 'jobId is required' });
    }

    if (dryRun) {
        // Return mock response immediately
        return res.json({
            content: `[MOCK COVER LETTER]\n\nDear Hiring Manager,\n\nThis is a simulated cover letter for testing purposes. No AI models were invoked.\n\nSincerely,\n[Your Name]`,
            warning: 'This is a mock response. No external API was called.'
        });
    }

    // 1. Fetch Job, Profile, and Documents context
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('name, content_text, doc_type, is_primary')
        .eq('user_id', userId)
        .eq('doc_type', 'Resume')
        .order('is_primary', { ascending: false }) // Primary first
        .limit(1);

    if (jobError || !job) return res.status(404).json({ error: 'Job not found' });

    const openai = getOpenAIClient(profile?.openai_api_key);
    if (!openai) return res.status(503).json({ error: 'OpenAI not configured' });

    const resumeContent = documents?.[0]?.content_text || '';

    try {
        const prompt = `
      Write a professional and personalized cover letter for the following position.
      
      TARGET JOB:
      Title: ${job.title}
      Company: ${job.company}
      Location: ${job.location || 'N/A'}
      Job Description/Notes:
      """
      ${job.notes || ''}
      """
      
      CANDIDATE PROFILE:
      Name: ${profile?.full_name || 'N/A'}
      Headline: ${profile?.professional_headline || 'N/A'}
      
      CANDIDATE RESUME (Use this to highlight relevant matching skills and experience):
      """
      ${resumeContent}
      """
      
      CUSTOM INSTRUCTIONS:
      ${customInstructions || 'None'}
      
      GUIDELINES:
      - Addres the hiring manager directly if possible, or use a professional greeting.
      - Use the candidate's resume to specifically mention experience that matches the job requirements.
      - Keep it professional, concise (300-400 words), and engaging.
      - Do not invent facts not present in the resume or profile.
      - Adopt a tone that matches the company culture if inferable, otherwise professional and enthusiastic.
      
      Return the response in JSON format with a "content" field containing the markdown text of the cover letter.
    `;

        const requestPayload = {
            model: profile?.default_ai_model || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        };

        const response = await openai.chat.completions.create(requestPayload as any);

        const result = JSON.parse(response.choices[0].message.content || '{}');
        const latency = Date.now() - startTime;

        await logAIUsage({
            user_id: userId,
            feature: 'Cover_Letter_Generation',
            model: response.model,
            prompt_summary: `Generate cover letter for ${job.company} - ${job.title}`,
            tokens_input: response.usage?.prompt_tokens,
            tokens_output: response.usage?.completion_tokens,
            latency_ms: latency,
            status: 'Success',
            request_json: JSON.parse(JSON.stringify(requestPayload)),
            response_json: JSON.parse(JSON.stringify(response)),
        });

        return res.json(result);
    } catch (error: any) {
        const latency = Date.now() - startTime;
        await logAIUsage({
            user_id: userId,
            feature: 'Cover_Letter_Generation',
            model: profile?.default_ai_model || 'gpt-4o-mini',
            prompt_summary: `Generate cover letter for ${job?.company} - ${job?.title}`,
            latency_ms: latency,
            status: 'Failure',
            response_json: { error: error.message },
            request_json: { jobId, customInstructions, hasResume: !!resumeContent } // fallback
        });
        return res.status(500).json({ error: error.message });
    }
});

export default router;
