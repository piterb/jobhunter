
import { OpenAIService } from './server/src/services/openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './server/.env') });

async function testOpenAI() {
    const service = new OpenAIService();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'sk-placeholder-replace-me') {
        console.log('Skipping real API call - no API key found.');
        return;
    }

    console.log('Testing OpenAIService with real API...');
    try {
        const result = await service.parseJobDescription(
            "Looking for a Senior Software Engineer for a B2B contract position in Brno. Salary up to 150000 CZK.",
            "gpt-4o-mini",
            apiKey
        );
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('Test failed:', error.message);
    }
}

testOpenAI();
