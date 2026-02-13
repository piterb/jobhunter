import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
// IMPORTANT: mockSupabase must be imported before app, but we need vi.mock to set up the mock factory
// So we use the factory inside vi.mock

// 1. Mock Supabase Logic Inline or Imported?
// To ensure reference consistency, let's use the exported mockDb
import { mockDb, MockQueryBuilder } from './utils/mockSupabase';

// 2. Mock Modules
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

const MOCK_USER_ID = 'test-user-123';
vi.mock('../middleware/auth', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.user = { id: MOCK_USER_ID, email: 'test@example.com' };
        next();
    }
}));

// 3. Import App
import app from '../app';

describe('Settings API', () => {

    beforeEach(() => {
        // Reset DB
        mockDb.profiles = []; // Clear array
    });

    const mockProfile = {
        id: MOCK_USER_ID,
        full_name: 'Test User',
        theme: 'dark',
        language: 'en',
        ghosting_threshold_days: 14,
        openai_api_key: 'sk-test-key-123',
        default_ai_model: 'gpt-4o'
    };

    describe('GET /settings', () => {
        it('should return user settings from profile', async () => {
            // Setup DB
            mockDb.profiles.push({ ...mockProfile }); // Push a copy

            const response = await request(app).get('/api/v1/settings');

            expect(response.status).toBe(200);
            expect(response.body.theme).toBe('dark');
            expect(response.body.ghosting_threshold_days).toBe(14);
        });

        it('should handle missing profile', async () => {
            const response = await request(app).get('/api/v1/settings');
            // Expect 500 because controller returns error on PGRST116
            expect(response.status).toBe(500);
            expect(response.body.error).toContain('Not found');
        });
    });

    describe('PUT /settings', () => {
        it('should update user settings', async () => {
            mockDb.profiles.push({ ...mockProfile });

            const updates = { theme: 'light', ghosting_threshold_days: 7 };
            const response = await request(app)
                .put('/api/v1/settings')
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.theme).toBe('light');
            expect(response.body.ghosting_threshold_days).toBe(7);

            // DB Check
            expect(mockDb.profiles[0].theme).toBe('light');
        });
    });

    describe('GET /settings/integrations', () => {
        it('should return integration status', async () => {
            mockDb.profiles.push({ ...mockProfile });

            const response = await request(app).get('/api/v1/settings/integrations');
            expect(response.status).toBe(200);
            expect(response.body.openai.enabled).toBe(true);
            expect(response.body.openai.default_model).toBe('gpt-4o');
        });

        it('should show disabled if no key present', async () => {
            mockDb.profiles.push({ ...mockProfile, openai_api_key: null });

            const response = await request(app).get('/api/v1/settings/integrations');
            expect(response.status).toBe(200);
            expect(response.body.openai.enabled).toBe(false);
        });
    });

    describe('PUT /settings/integrations', () => {
        it('should update integration settings (api key)', async () => {
            mockDb.profiles.push({ ...mockProfile, openai_api_key: null });

            const payload = {
                provider: 'openai',
                api_key: 'sk-new-key',
                default_model: 'gpt-4o-mini'
            };

            const response = await request(app)
                .put('/api/v1/settings/integrations')
                .send(payload);

            expect(response.status).toBe(200);

            // Check DB
            expect(mockDb.profiles[0].openai_api_key).toBe('sk-new-key');
            expect(mockDb.profiles[0].default_ai_model).toBe('gpt-4o-mini');
        });
    });

});
