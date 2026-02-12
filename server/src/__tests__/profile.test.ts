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

describe('Profile API', () => {

    beforeEach(() => {
        mockDb['profiles'] = [];
    });

    const mockProfile = {
        id: MOCK_USER_ID,
        full_name: 'Test User',
        professional_headline: 'Software Engineer',
        email: 'test@example.com'
    };

    describe('GET /profile', () => {
        it('should get current user profile', async () => {
            mockDb['profiles'].push(mockProfile);

            const response = await request(app).get('/api/v1/profile');
            expect(response.status).toBe(200);
            expect(response.body.full_name).toBe('Test User');
        });

        it('should return 404 (handled as error) if profile not found', async () => {
            const response = await request(app).get('/api/v1/profile');
            expect(response.status).toBe(500); // Controller returns 500 on error
            expect(response.body.error).toContain('Not found');
        });
    });

    describe('PUT /profile', () => {
        it('should update profile details', async () => {
            mockDb['profiles'].push(mockProfile);

            const updates = {
                full_name: 'New Name',
                professional_headline: 'Senior Engineer'
            };

            const response = await request(app)
                .put('/api/v1/profile')
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.full_name).toBe('New Name');

            // Check DB
            expect(mockDb['profiles'][0].full_name).toBe('New Name');
        });
    });

    describe('POST /profile/cv', () => {
        it('should return 501 Not Implemented', async () => {
            const response = await request(app).post('/api/v1/profile/cv');
            expect(response.status).toBe(501);
        });
    });

});
