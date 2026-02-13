import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockDb, MockQueryBuilder } from './utils/mockSupabase';

// -------------------------------------------------------------------------
// MOCK DEPENDENCIES
// -------------------------------------------------------------------------

// Mock Supabase
vi.mock('../config/supabase', () => ({
    createSupabaseUserClient: vi.fn(() => ({
        from: (table: string) => new MockQueryBuilder(table),
    })),
    supabaseAdmin: {
        from: (table: string) => new MockQueryBuilder(table),
    },
    supabase: {
        from: (table: string) => new MockQueryBuilder(table),
    }
}));

// Mock Auth
const MOCK_USER_ID = 'test-user-123';
vi.mock('../middleware/auth', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.user = { id: MOCK_USER_ID, email: 'test@example.com' };
        next();
    }
}));

// Mock logger to avoid cluttering test output
vi.mock('../utils/logger', () => ({
    logAIUsage: vi.fn(),
}));

// Mock OpenAI
const mockCreateCompletion = vi.fn();

vi.mock('openai', () => {
    return {
        default: vi.fn(function () {
            return {
                chat: {
                    completions: {
                        create: mockCreateCompletion
                    }
                }
            };
        })
    };
});

// Import App
import app from '../app';

describe('AI Analyze API', () => {

    beforeEach(() => {
        mockDb['profiles'] = [];
        mockDb['ai_usage_logs'] = [];
        mockCreateCompletion.mockReset();
    });

    const mockProfile = {
        id: MOCK_USER_ID,
        openai_api_key: 'sk-test-key-123',
    };

    describe('POST /analyze/job', () => {
        it('should ensure API key is present', async () => {
            // Profile without key
            mockDb['profiles'].push({ ...mockProfile, openai_api_key: null });

            const response = await request(app)
                .post('/api/v1/analyze/job')
                .send({ url: 'https://example.com/job' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('OpenAI API key not found');
        });

        it('should call OpenAI and return parsed job data', async () => {
            mockDb['profiles'].push(mockProfile);

            const mockOpenAIResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            title: 'AI Engineer',
                            company: 'OpenAI',
                            salary_min: 150000
                        })
                    }
                }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
                model: 'gpt-4o-mini'
            };
            mockCreateCompletion.mockResolvedValue(mockOpenAIResponse);

            const response = await request(app)
                .post('/api/v1/analyze/job')
                .send({ url: 'https://example.com/job', text: 'Job description text' });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('AI Engineer');
            expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
        });

        it('should handle OpenAI errors gracefully', async () => {
            mockDb['profiles'].push(mockProfile);
            mockCreateCompletion.mockRejectedValue(new Error('OpenAI Error'));

            const response = await request(app)
                .post('/api/v1/analyze/job')
                .send({ text: 'Some job' });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('OpenAI Error');
        });
    });

    describe('POST /analyze/activity', () => {
        it('should analyze activity text', async () => {
            mockDb['profiles'].push(mockProfile);

            const mockOpenAIResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            type: 'email',
                            category: 'interview',
                            summary: 'Interview scheduled'
                        })
                    }
                }],
                usage: { prompt_tokens: 10, completion_tokens: 20 },
                model: 'gpt-4o-mini'
            };
            mockCreateCompletion.mockResolvedValue(mockOpenAIResponse);

            const response = await request(app)
                .post('/api/v1/analyze/activity')
                .send({ text: 'We would like to invite you to an interview tomorrow.' });

            expect(response.status).toBe(200);
            expect(response.body.type).toBe('email');
            expect(response.body.category).toBe('interview');
        });
    });

});
