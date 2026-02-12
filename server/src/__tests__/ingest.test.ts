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

// Mock Axios
vi.mock('axios', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: '<html>Data</html>' }))
    }
}));

// Mock logger
vi.mock('../utils/logger', () => ({
    logAIUsage: vi.fn(),
}));

// Mock services (top-level)
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
        mockDb['profiles'] = [];
        mockDb['jobs'] = [];
    });

    const mockProfile = {
        id: MOCK_USER_ID,
        openai_api_key: 'sk-test-key-123',
    };

    describe('POST /ingest', () => {

        it('should require a URL', async () => {
            const response = await request(app).post('/api/v1/ingest').send({});
            expect(response.status).toBe(400);
        });

        it('should successfully ingest a job from URL', async () => {
            mockDb['profiles'].push(mockProfile);

            const response = await request(app)
                .post('/api/v1/ingest')
                .set('Authorization', 'Bearer mock-token')
                .send({ url: 'https://example.com/careers/job1' });

            if (response.status !== 200) console.log('Ingest Error:', response.body);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Senior Developer');
            expect(response.body.company).toBe('Google');
        });

        it('should return 400 if user has no API Key', async () => {
            // No profile in DB
            const response = await request(app)
                .post('/api/v1/ingest')
                .set('Authorization', 'Bearer mock-token')
                .send({ url: 'https://example.com/careers/job1' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('OpenAI API key');
        });
    });

});
