import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock the auth middleware to bypass real Supabase auth
vi.mock('../middleware/auth', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        // Using the ID from your seed.sql to satisfy foreign key constraints
        req.user = { id: 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', email: 'dev@example.com' };
        next();
    }
}));

describe('Jobs API', () => {
    const testJob = {
        title: 'Test Software Engineer',
        company: 'Test Corp',
        location: 'Remote',
        notes: 'A test job description',
        salary_min: 100000,
        salary_max: 120000,
        status: 'Applied', // Must match ENUM in DB (Capitalized)
        url: 'https://example.com/test-job' // Required field
    };

    let createdJobId: string;

    it('should create a new job', async () => {
        const response = await request(app)
            .post('/api/v1/jobs')
            .send(testJob);

        if (response.status !== 201) {
            console.error('Error body:', response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body.title).toBe(testJob.title);
        createdJobId = response.body.id;
    });

    it('should list jobs for the user', async () => {
        const response = await request(app).get('/api/v1/jobs');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.some((job: any) => job.id === createdJobId)).toBe(true);
    });

    it('should get a specific job', async () => {
        const response = await request(app).get(`/api/v1/jobs/${createdJobId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdJobId);
    });

    it('should update a job', async () => {
        const updatedTitle = 'Senior Test Engineer';
        const response = await request(app)
            .put(`/api/v1/jobs/${createdJobId}`)
            .send({ title: updatedTitle });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe(updatedTitle);
    });

    it('should delete a job', async () => {
        const response = await request(app).delete(`/api/v1/jobs/${createdJobId}`);
        expect(response.status).toBe(204);

        const verifyResponse = await request(app).get(`/api/v1/jobs/${createdJobId}`);
        expect(verifyResponse.status).toBe(404);
    });
});
