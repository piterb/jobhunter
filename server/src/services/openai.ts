import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedJob {
    title: string;
    company: string;
    salary_min: number | null;
    salary_max: number | null;
    location: string | null;
    employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Other';
    skills_tools: string[]; // array of strings
    description_summary: string;
}

export class OpenAIService {
    async parseJobDescription(text: string): Promise<ParsedJob> {
        const prompt = `
      You are an expert HR assistant. Extract structured data from the following job description text.
      Return strictly a JSON object matching this schema:
      {
        "title": "Job Title",
        "company": "Company Name",
        "salary_min": number | null,
        "salary_max": number | null,
        "location": "City, Country"Or "Remote",
        "employment_type": "Full-time" | "Part-time" | "Contract" | "Internship" | "Other",
        "skills_tools": ["skill1", "skill2", ...],
        "description_summary": "A concise summary of the role in markdown format."
      }
      If salary is a range, use min and max. If single value, use min=max. If not specified, use null.
      For location, prefer City. If remote, put "Remote".
      For employment_type, infer from text. Default to "Full-time" if unclear but seems standard.
      Limit skills_tools to top 10 most relevant technical skills.
      
      Job Description Text:
      """
      ${text}
      """
    `;

        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'gpt-4o-mini', // or 'gpt-3.5-turbo' for cost efficiency, 'gpt-4' for better accuracy
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });

            const content = completion.choices[0].message.content;
            if (!content) {
                throw new Error('OpenAI returned empty content');
            }

            const parsed = JSON.parse(content) as ParsedJob;
            return parsed;

        } catch (error: any) {
            console.error('OpenAI parsing error:', error.message);
            throw new Error(`Failed to parse job description: ${error.message}`);
        }
    }
}
