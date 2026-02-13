import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock Supabase to avoid loading config or connecting
vi.mock('../config/supabase', () => ({
    createSupabaseUserClient: vi.fn(),
    supabaseAdmin: {},
    supabase: {}
}));

// Mock Auth Middleware just in case, though health check is public
vi.mock('../middleware/auth', () => ({
    authMiddleware: (req: any, res: any, next: any) => next()
}));

// Import app AFTER mocks
import app from '../app';

describe('Health API', () => {
    it('should return 200 OK for /api/v1/health', async () => {
        const response = await request(app).get('/api/v1/health');
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ status: 'ok' });
    });

    it('should return 200 OK for root path', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('JobHunter API is running!');
    });
});
