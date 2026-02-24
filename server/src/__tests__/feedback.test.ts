import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import axios from 'axios';

const { mockSave, mockBucket } = vi.hoisted(() => {
    const save = vi.fn().mockResolvedValue(undefined);
    const makePublic = vi.fn().mockResolvedValue(undefined);
    const file = vi.fn(() => ({ save, makePublic }));
    const bucket = vi.fn(() => ({ file }));
    return {
        mockSave: save,
        mockBucket: bucket,
    };
});

vi.mock('../config/db', async () => {
    const mod = await import('./utils/db.js');
    return { default: mod.default };
});

vi.mock('../config/storage', () => ({
    storage: {
        bucket: mockBucket,
    },
    BUCKETS: {
        FEEDBACK: 'jobhunter-feedback-reports',
        DOCUMENTS: 'jobhunter-documents',
        AVATARS: 'jobhunter-avatars',
    }
}));

vi.mock('axios');
const mockedAxios = axios as any;

import app from '../app';

describe('Feedback API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.FEEDBACK_ENABLED = 'true';
        process.env.FEEDBACK_GITHUB_TOKEN = 'test-token';
        process.env.GITHUB_OWNER = 'test-owner';
        process.env.GITHUB_REPO = 'test-repo';
        process.env.NODE_ENV = 'test';
        process.env.GCS_ENDPOINT = 'http://localhost:4443';
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
        expect(response.body.reportUrl).toContain('https://storage.googleapis.com/jobhunter-feedback-reports/');
        expect(mockBucket).toHaveBeenCalledWith('jobhunter-feedback-reports');
        expect(mockSave).toHaveBeenCalled();

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
        expect(response.body.reportUrl).toContain('https://storage.googleapis.com/jobhunter-feedback-reports/');
        expect(mockSave).not.toHaveBeenCalled();
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
