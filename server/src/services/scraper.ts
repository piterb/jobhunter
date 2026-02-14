import axios from 'axios';
import { load } from 'cheerio';

export class ScraperService {
    /**
     * Fetches and extracts text content from a given URL.
     * returning clean text suitable for LLM processing.
     */
    async scrape(url: string): Promise<string> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                timeout: 10000 // 10 seconds timeout
            });

            const html = response.data;
            const $ = load(html);

            // Remove unwanted elements
            $('script').remove();
            $('style').remove();
            $('noscript').remove();
            $('iframe').remove();
            $('nav').remove();
            $('footer').remove();
            $('header').remove();

            // Extract text
            const text = $('body').text().replace(/\s+/g, ' ').trim();

            if (!text || text.length < 50) {
                throw new Error('Could not extract meaningful content from the URL.');
            }

            return text.substring(0, 15000); // Limit to 15k characters for LLM context window
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Scraping error:', errorMessage);
            throw new Error(`Failed to scrape URL: ${errorMessage}`);
        }
    }
}
