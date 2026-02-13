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

// Import App
import app from '../app';

describe('Activities API', () => {

    beforeEach(() => {
        mockDb['jobs'] = [];
        mockDb['activities'] = [];
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
            mockDb['jobs'].push(mockJob);

            const response = await request(app).get(`/api/v1/jobs/${mockJob.id}/activities`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return list of activities for the job', async () => {
            mockDb['jobs'].push(mockJob);
            mockDb['activities'].push(
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
            mockDb['jobs'].push(mockJob);

            const newActivity = {
                event_type: 'Manual',
                category: 'Interview',
                content: 'Technical interview with lead dev',
                occurred_at: new Date().toISOString()
            };

            const response = await request(app)
                .post(`/api/v1/jobs/${mockJob.id}/activities`)
                .send(newActivity);

            if (response.status !== 201) console.log(response.body);

            expect(response.status).toBe(201);
            expect(response.body.content).toBe(newActivity.content);
            expect(response.body.job_id).toBe(mockJob.id);

            // Check DB
            expect(mockDb['activities']).toHaveLength(1);
            expect(mockDb['activities'][0].event_type).toBe('Manual');
        });

        it('should validate required fields', async () => {
            mockDb['jobs'].push(mockJob);

            const invalidActivity = {
                event_type: 'Note',
                // missing content
            };

            const response = await request(app)
                .post(`/api/v1/jobs/${mockJob.id}/activities`)
                .send(invalidActivity);

            expect(response.status).toBe(400);
        });
    });
});
