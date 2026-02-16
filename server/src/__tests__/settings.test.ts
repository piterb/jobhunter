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

describe('Settings API', () => {
    beforeEach(() => {
        resetMockStore();
    });

    const mockProfile = {
        id: MOCK_USER_ID,
        user_id: MOCK_USER_ID,
        full_name: 'Test User',
        theme: 'dark',
        language: 'en',
        ghosting_threshold_days: 14,
        openai_api_key: 'sk-test-key-123',
        default_ai_model: 'gpt-4o'
    };

    describe('GET /settings', () => {
        it('should return user settings from profile', async () => {
            mockStore.profiles.push({ ...mockProfile });

            const response = await request(app).get('/api/v1/settings');

            expect(response.status).toBe(200);
            expect(response.body.theme).toBe('dark');
            expect(response.body.ghosting_threshold_days).toBe(14);
        });

        it('should handle missing profile', async () => {
            const response = await request(app).get('/api/v1/settings');
            expect(response.status).toBe(404);
            expect(response.body.error).toContain('Settings not found');
        });
    });

    describe('PUT /settings', () => {
        it('should update user settings', async () => {
            mockStore.profiles.push({ ...mockProfile });

            const updates = { theme: 'light', ghosting_threshold_days: 7 };
            const response = await request(app)
                .put('/api/v1/settings')
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.theme).toBe('light');
            expect(response.body.ghosting_threshold_days).toBe(7);
            expect(mockStore.profiles[0].theme).toBe('light');
        });
    });

    describe('GET /settings/integrations', () => {
        it('should return integration status', async () => {
            mockStore.profiles.push({ ...mockProfile });

            const response = await request(app).get('/api/v1/settings/integrations');
            expect(response.status).toBe(200);
            expect(response.body.openai.enabled).toBe(true);
            expect(response.body.openai.default_model).toBe('gpt-4o');
        });

        it('should show disabled if no key present', async () => {
            mockStore.profiles.push({ ...mockProfile, openai_api_key: null });

            const response = await request(app).get('/api/v1/settings/integrations');
            expect(response.status).toBe(200);
            expect(response.body.openai.enabled).toBe(false);
        });
    });

    describe('PUT /settings/integrations', () => {
        it('should update integration settings (api key)', async () => {
            mockStore.profiles.push({ ...mockProfile, openai_api_key: null });

            const payload = {
                provider: 'openai',
                api_key: 'sk-new-key',
                default_model: 'gpt-4o-mini'
            };

            const response = await request(app)
                .put('/api/v1/settings/integrations')
                .send(payload);

            expect(response.status).toBe(200);
            expect(mockStore.profiles[0].openai_api_key).toBe('sk-new-key');
            expect(mockStore.profiles[0].default_ai_model).toBe('gpt-4o-mini');
        });
    });
});
