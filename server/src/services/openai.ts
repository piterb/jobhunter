import OpenAI from 'openai';

export interface ParsedJob {
    title: string;
    company: string;
    salary_min: number | null;
    salary_max: number | null;
    location: string | null;
    employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'B2B';
    skills_tools: string[]; // array of strings
    description_summary: string;
}

export class OpenAIService {
    private getClient(apiKey?: string) {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key || key === 'sk-placeholder-replace-me') {
            throw new Error('OpenAI API key is missing. Please set it in your profile.');
        }
        return new OpenAI({
            apiKey: key,
        });
    }

    async parseJobDescription(text: string, model: string = 'gpt-4o-mini', apiKey?: string): Promise<ParsedJob> {
        const client = this.getClient(apiKey);
        const prompt = `
      You are an expert HR assistant. Extract structured data from the following job description text.
      Return strictly a JSON object matching this schema:
      {
        "title": "Job Title",
        "company": "Company Name",
        "salary_min": number | null,
        "salary_max": number | null,
        "location": "City, Country" or "Remote",
        "employment_type": "Full-time" | "Part-time" | "Contract" | "Internship" | "B2B",
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
            const completion = await client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: model,
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
