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

describe('Profile API', () => {
    beforeEach(() => {
        resetMockStore();
    });

    const mockProfile = {
        id: MOCK_USER_ID,
        user_id: MOCK_USER_ID,
        full_name: 'Test User',
        professional_headline: 'Software Engineer',
        email: 'test@example.com'
    };

    describe('GET /profile', () => {
        it('should get current user profile', async () => {
            mockStore.profiles.push(mockProfile);

            const response = await request(app).get('/api/v1/profile');
            expect(response.status).toBe(200);
            expect(response.body.full_name).toBe('Test User');
        });

        it('should return 404 if profile not found', async () => {
            const response = await request(app).get('/api/v1/profile');
            expect(response.status).toBe(404);
            expect(response.body.error).toContain('Profile not found');
        });
    });

    describe('PUT /profile', () => {
        it('should update profile details', async () => {
            mockStore.profiles.push(mockProfile);

            const updates = {
                full_name: 'New Name',
                professional_headline: 'Senior Engineer'
            };

            const response = await request(app)
                .put('/api/v1/profile')
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.full_name).toBe('New Name');
            expect(mockStore.profiles[0].full_name).toBe('New Name');
        });
    });
});
