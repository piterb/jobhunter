import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockStore, resetMockStore } from './utils/db';

const MOCK_USER_ID = 'test-user-123';

vi.mock('../config/db', async () => {
    const mod = await import('./utils/db.js');
    return { default: mod.default };
});

vi.mock('../middleware/auth', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.user = { id: MOCK_USER_ID, email: 'test@example.com' };
        next();
    }
}));

vi.mock('../utils/logger', () => ({
    logAIUsage: vi.fn(),
}));

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

import app from '../app';

describe('Generate API (Cover Letters)', () => {
    beforeEach(() => {
        resetMockStore();
        mockCreateCompletion.mockReset();
    });

    const mockProfile = {
        id: MOCK_USER_ID,
        user_id: MOCK_USER_ID,
        full_name: 'Test User',
        openai_api_key: 'sk-test-key-123',
    };

    const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: MOCK_USER_ID,
        title: 'Senior Developer',
        company: 'Google',
        description: 'Great job opportunity'
    };

    describe('POST /generate/cover-letter', () => {
        it('should require a jobId', async () => {
            const response = await request(app).post('/api/v1/generate/cover-letter').send({});
            expect(response.status).toBe(400);
        });

        it('should return mock response for dry run without calling OpenAI', async () => {
            const response = await request(app)
                .post('/api/v1/generate/cover-letter')
                .send({ jobId: mockJob.id, dryRun: true });

            expect(response.status).toBe(200);
            expect(response.body.content).toContain('[MOCK COVER LETTER]');
            expect(mockCreateCompletion).not.toHaveBeenCalled();
        });

        it('should generate a cover letter successfully', async () => {
            mockStore.profiles.push(mockProfile);
            mockStore.jobs.push(mockJob);

            mockCreateCompletion.mockResolvedValue({
                choices: [{ message: { content: JSON.stringify({ content: 'Dear Hiring Manager...' }) } }],
                usage: { prompt_tokens: 100, completion_tokens: 50 },
                model: 'gpt-4o-mini'
            });

            const response = await request(app)
                .post('/api/v1/generate/cover-letter')
                .send({ jobId: mockJob.id });

            expect(response.status).toBe(200);
            expect(response.body.content).toBe('Dear Hiring Manager...');
            expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
        });

        it('should return 404 if job not found', async () => {
            mockStore.profiles.push(mockProfile);
            const missingId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .post('/api/v1/generate/cover-letter')
                .send({ jobId: missingId });

            expect(response.status).toBe(404);
        });
    });
});
