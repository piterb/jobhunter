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

vi.mock('axios', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: '<html>Data</html>' }))
    }
}));

vi.mock('../utils/logger', () => ({
    logAIUsage: vi.fn(),
}));

vi.mock('../services/scraper', () => {
    return {
        ScraperService: vi.fn().mockImplementation(function () {
            return {
                scrape: vi.fn().mockResolvedValue('<html>Job Content</html>')
            };
        })
    };
});

vi.mock('../services/openai', () => {
    return {
        OpenAIService: vi.fn().mockImplementation(function () {
            return {
                parseJobDescription: vi.fn().mockResolvedValue({
                    data: {
                        title: 'Senior Developer',
                        company: 'Google',
                    },
                    usage: {},
                    latency: 100
                })
            };
        })
    };
});

import app from '../app';

describe('Job Ingest API', () => {
    beforeEach(() => {
        resetMockStore();
    });

    const mockProfile = {
        id: MOCK_USER_ID,
        user_id: MOCK_USER_ID,
        openai_api_key: 'sk-test-key-123',
    };

    describe('POST /ingest', () => {
        it('should require a URL', async () => {
            const response = await request(app).post('/api/v1/ingest').send({});
            expect(response.status).toBe(400);
        });

        it('should successfully ingest a job from URL', async () => {
            mockStore.profiles.push(mockProfile);

            const response = await request(app)
                .post('/api/v1/ingest')
                .set('Authorization', 'Bearer mock-token')
                .send({ url: 'https://example.com/careers/job1' });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Senior Developer');
            expect(response.body.company).toBe('Google');
        });

        it('should return 400 if user has no API Key', async () => {
            const response = await request(app)
                .post('/api/v1/ingest')
                .set('Authorization', 'Bearer mock-token')
                .send({ url: 'https://example.com/careers/job1' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('OpenAI API key');
        });
    });
});
