import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockStore, resetMockStore } from './utils/db';

// -------------------------------------------------------------------------
// 1. MOCK AUTH MIDDLEWARE
// -------------------------------------------------------------------------
const MOCK_USER_ID = 'test-user-123';
const MOCK_USER_EMAIL = 'test@example.com';

vi.mock('../middleware/auth', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.user = { id: MOCK_USER_ID, email: MOCK_USER_EMAIL };
        next();
    }
}));

// -------------------------------------------------------------------------
// 2. MOCK DB CLIENT
// -------------------------------------------------------------------------
vi.mock('../config/db', async () => {
    const mod = await import('./utils/db.js');
    return { default: mod.default };
});

// Import app AFTER mocks are set up
import app from '../app';

// -------------------------------------------------------------------------
// 3. THE TESTS
// -------------------------------------------------------------------------
describe('Jobs API', () => {

    beforeEach(() => {
        resetMockStore();
    });

    const validJob = {
        title: 'Senior Developer',
        company: 'Tech Corp',
        url: 'https://example.com/job/123',
        location: 'Remote',
        status: 'Applied',
        salary_min: 100000,
        salary_max: 150000,
        notes: 'Great opportunity',
    };

    describe('POST /api/v1/jobs', () => {
        it('should create a new job successfully', async () => {
            const response = await request(app)
                .post('/api/v1/jobs')
                .send(validJob);

            expect(response.status).toBe(201);
            expect(response.body.title).toBe(validJob.title);
            expect(response.body.id).toBeDefined();
            expect(response.body.user_id).toBe(MOCK_USER_ID);

            // Verify it's in our mock DB
            expect(mockStore.jobs).toHaveLength(1);
            expect(mockStore.jobs[0].title).toBe(validJob.title);
        });

        it('should validate required fields', async () => {
            const invalidJob = { title: 'No URL' }; // Missing url

            const response = await request(app)
                .post('/api/v1/jobs')
                .send(invalidJob);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/jobs', () => {
        it('should list all jobs for the current user', async () => {
            mockStore.jobs = [
                { ...validJob, id: 'job-1', title: 'Job A', user_id: MOCK_USER_ID },
                { ...validJob, id: 'job-2', title: 'Job B', user_id: MOCK_USER_ID },
                { ...validJob, id: 'job-3', title: 'Other User Job', user_id: 'other-user' }
            ];

            const response = await request(app).get('/api/v1/jobs');

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.count).toBe(2);
        });
    });

    describe('GET /api/v1/jobs/:id', () => {
        it('should retrieve a single job', async () => {
            mockStore.jobs.push({ ...validJob, id: 'job-123', user_id: MOCK_USER_ID });

            const response = await request(app).get('/api/v1/jobs/job-123');
            expect(response.status).toBe(200);
            expect(response.body.id).toBe('job-123');
        });

        it('should return 404 if job does not exist', async () => {
            const response = await request(app).get('/api/v1/jobs/non-existent-id');
            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/v1/jobs/:id', () => {
        it('should update a job', async () => {
            mockStore.jobs.push({ ...validJob, id: 'job-123', user_id: MOCK_USER_ID });

            const updates = { title: 'Updated Title' };
            const response = await request(app)
                .put('/api/v1/jobs/job-123')
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Updated Title');
            expect(mockStore.jobs[0].title).toBe('Updated Title');
        });
    });

    describe('DELETE /api/v1/jobs/:id', () => {
        it('should delete a job and return 204', async () => {
            mockStore.jobs.push({ ...validJob, id: 'job-123', user_id: MOCK_USER_ID });

            const response = await request(app).delete('/api/v1/jobs/job-123');
            expect(response.status).toBe(204);
            expect(mockStore.jobs).toHaveLength(0);
        });
    });
});
