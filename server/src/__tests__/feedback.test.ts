import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import axios from 'axios';

// 1. Setup Hoisted Mocks
const { mockSupabase } = vi.hoisted(() => {
    const mockStorage = {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.html' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://supabase.com/test.html' } }),
        listBuckets: vi.fn().mockResolvedValue({ data: [{ name: 'jobhunter_feedback_reports' }], error: null }),
        createBucket: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    return {
        mockSupabase: {
            storage: mockStorage
        }
    };
});

vi.mock('../config/supabase', () => ({
    supabase: mockSupabase,
    supabaseAdmin: mockSupabase,
    createSupabaseUserClient: vi.fn(() => mockSupabase)
}));

vi.mock('axios');
const mockedAxios = axios as any;

// 2. Import App (AFTER mocks)
import app from '../app';

describe('Feedback API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.FEEDBACK_ENABLED = 'true';
        process.env.FEEDBACK_GITHUB_TOKEN = 'test-token';
        process.env.GITHUB_OWNER = 'test-owner';
        process.env.GITHUB_REPO = 'test-repo';
    });

    const validFeedback = {
        subject: 'Test Subject',
        description: 'Test Description',
        networkLogs: [],
        consoleLogs: [],
        metadata: {
            url: 'http://localhost:3000',
            browser: 'Chrome',
            os: 'Mac',
            viewport: { width: 1200, height: 800 },
            timestamp: new Date().toISOString()
        }
    };

    it('should successfully process feedback and create GitHub issue', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { number: 123 } });

        const response = await supertest(app)
            .post('/api/v1/feedback')
            .send(validFeedback);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.reportUrl).toBe('https://supabase.com/test.html');

        // Check storage calls
        expect(mockSupabase.storage.from).toHaveBeenCalledWith('jobhunter_feedback_reports');
        expect(mockSupabase.storage.upload).toHaveBeenCalled();

        // Check GitHub call
        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.stringContaining('api.github.com/repos/test-owner/test-repo/issues'),
            expect.objectContaining({
                title: expect.stringContaining('Test Subject'),
                labels: expect.arrayContaining(['feedback'])
            }),
            expect.any(Object)
        );
    });

    it('should respect dryRun and skip real calls', async () => {
        const response = await supertest(app)
            .post('/api/v1/feedback')
            .send({ ...validFeedback, dryRun: true });

        expect(response.status).toBe(201);
        expect(response.body.reportUrl).toContain('dummy-storage');

        // Storage and GitHub should NOT be called
        expect(mockSupabase.storage.upload).not.toHaveBeenCalled();
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should return 403 when feedback is disabled', async () => {
        process.env.FEEDBACK_ENABLED = 'false';

        const response = await supertest(app)
            .post('/api/v1/feedback')
            .send(validFeedback);

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('disabled');
    });

    it('should return 400 for missing required fields', async () => {
        const response = await supertest(app)
            .post('/api/v1/feedback')
            .send({ subject: 'Only Subject' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('required');
    });
});
