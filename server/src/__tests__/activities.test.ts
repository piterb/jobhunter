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

import app from '../app';

describe('Activities API', () => {
    beforeEach(() => {
        resetMockStore();
    });

    const mockJob = {
        id: 'job-123',
        title: 'Software Engineer',
        company: 'Tech Corp',
        user_id: MOCK_USER_ID,
        created_at: new Date().toISOString()
    };

    const mockActivity = {
        job_id: 'job-123',
        event_type: 'Note',
        content: 'Initial screening call',
        occurred_at: new Date().toISOString(),
        user_id: MOCK_USER_ID
    };

    describe('GET /jobs/:jobId/activities', () => {
        it('should return 404 if job does not exist', async () => {
            const response = await request(app).get('/api/v1/jobs/non-existent/activities');
            expect(response.status).toBe(404);
            expect(response.body.error).toMatch(/Job not found/);
        });

        it('should return empty list if job exists but has no activities', async () => {
            mockStore.jobs.push(mockJob);

            const response = await request(app).get(`/api/v1/jobs/${mockJob.id}/activities`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return list of activities for the job', async () => {
            mockStore.jobs.push(mockJob);
            mockStore.activities.push(
                { ...mockActivity, id: 'act-1' },
                { ...mockActivity, id: 'act-2', content: 'Follow-up email' }
            );

            const response = await request(app).get(`/api/v1/jobs/${mockJob.id}/activities`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].job_id).toBe(mockJob.id);
        });
    });

    describe('POST /jobs/:jobId/activities', () => {
        it('should create a new activity', async () => {
            mockStore.jobs.push(mockJob);

            const newActivity = {
                event_type: 'Manual',
                category: 'Interview',
                content: 'Technical interview with lead dev',
                occurred_at: new Date().toISOString()
            };

            const response = await request(app)
                .post(`/api/v1/jobs/${mockJob.id}/activities`)
                .send(newActivity);

            expect(response.status).toBe(201);
            expect(response.body.content).toBe(newActivity.content);
            expect(response.body.job_id).toBe(mockJob.id);
            expect(mockStore.activities).toHaveLength(1);
            expect(mockStore.activities[0].event_type).toBe('Manual');
        });

        it('should validate required fields', async () => {
            mockStore.jobs.push(mockJob);

            const invalidActivity = {
                event_type: 'Note',
            };

            const response = await request(app)
                .post(`/api/v1/jobs/${mockJob.id}/activities`)
                .send(invalidActivity);

            expect(response.status).toBe(400);
        });
    });
});
