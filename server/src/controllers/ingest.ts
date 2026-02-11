import { Request, Response } from 'express';
import { ScraperService } from '../services/scraper';
import { OpenAIService } from '../services/openai';

const scraperService = new ScraperService();
const openAIService = new OpenAIService();

export const ingestJob = async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Ingesting URL: ${url}`);

        // 1. Scrape content
        const rawText = await scraperService.scrape(url);
        console.log(`Scraped ${rawText.length} characters.`);

        // 2. Parse with AI
        const parsedData = await openAIService.parseJobDescription(rawText);
        console.log('AI parsing complete.');

        // Return the result combined with the original URL
        // The client will then show this to the user for confirmation/editing
        res.json({
            ...parsedData,
            url,
            scraped_at: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Ingest error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to ingest job posting' });
    }
};
