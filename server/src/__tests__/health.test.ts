import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Health API', () => {
    it('should return 200 OK for /api/v1/health', async () => {
        const response = await request(app).get('/api/v1/health');
        expect(response.status).toBe(200);
        // Adjust this match based on what your health route actually returns
        // expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return 200 OK for root path', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('JobHunter API is running!');
    });
});
