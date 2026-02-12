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
        const parsedData = await openAIService.parseJobDescription(rawText, model, apiKey);
        console.log('AI parsing complete.');

        // 3. Save to Database (Automatic for now to speed up integration)
        const { data: savedJob, error: saveError } = await supabase
            .from('jobs')
            .insert({
                user_id: user.id,
                title: parsedData.title,
                company: parsedData.company,
                salary_min: parsedData.salary_min,
                salary_max: parsedData.salary_max,
                location: parsedData.location,
                employment_type: parsedData.employment_type.toLowerCase().replace('-', '_'), // Align with DB enum if needed
                skills_tools: parsedData.skills_tools,
                notes: parsedData.description_summary,
                url: url,
                status: 'applied', // Default status for ingested jobs
                applied_at: new Date().toISOString()
            })
            .select()
            .single();

        if (saveError) {
            console.error('DB Save error:', saveError);
            // Even if DB save fails, we return the parsed data so client could try manual save
            return res.json({
                ...parsedData,
                url,
                warning: 'Failed to auto-save to database: ' + saveError.message
            });
        }

        console.log('Job saved to DB with ID:', savedJob.id);

        res.json(savedJob);

    } catch (error: any) {
        console.error('Ingest error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to ingest job posting' });
    }
};
