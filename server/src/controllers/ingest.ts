import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ScraperService } from '../services/scraper';
import { OpenAIService } from '../services/openai';
import { createSupabaseUserClient } from '../config/supabase';

const scraperService = new ScraperService();
const openAIService = new OpenAIService();

export const ingestJob = async (req: AuthRequest, res: Response) => {
    try {
        const { url, model } = req.body;
        const user = req.user;
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!user || !token) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const supabase = createSupabaseUserClient(token);

        // 1. Fetch user's OpenAI API key from DB
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('openai_api_key')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.openai_api_key) {
            return res.status(400).json({
                error: 'OpenAI API key not found. Please add it in your settings (BYOK).'
            });
        }

        const apiKey = profile.openai_api_key;

        console.log(`Ingesting URL: ${url} using model: ${model || 'default'} for user: ${user.id}`);

        // 1. Scrape content
        const rawText = await scraperService.scrape(url);
        console.log(`Scraped ${rawText.length} characters.`);

        // 2. Parse with AI
        let aiResponse;
        try {
            aiResponse = await openAIService.parseJobDescription(rawText, model, apiKey);
            console.log('AI parsing complete.');

            // Log successful AI usage
            await supabase.from('ai_usage_logs').insert({
                user_id: user.id,
                feature: 'Job_Parsing',
                model: model || 'gpt-4o-mini',
                prompt_summary: `Parsing job description from ${url}`,
                tokens_input: aiResponse.usage?.prompt_tokens,
                tokens_output: aiResponse.usage?.completion_tokens,
                latency_ms: aiResponse.latency,
                status: 'Success',
                request_json: aiResponse.fullRequest,
                response_json: aiResponse.rawResponse
            });

        } catch (aiError: any) {
            // Log failed AI usage
            await supabase.from('ai_usage_logs').insert({
                user_id: user.id,
                feature: 'Job_Parsing',
                model: model || 'gpt-4o-mini',
                prompt_summary: `Failed to parse job description from ${url}`,
                status: 'Failure',
                request_json: { url, model },
                response_json: { error: aiError.message }
            });
            throw aiError;
        }

        // 3. Return parsed data for review
        res.json({
            ...aiResponse.data,
            url
        });

    } catch (error: any) {
        console.error('Ingest error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to ingest job posting' });
    }
};
