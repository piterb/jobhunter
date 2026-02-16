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

describe('AI Usage Logs API', () => {
    beforeEach(() => {
        resetMockStore();
    });

    const mockLog = {
        id: 'log-1',
        user_id: MOCK_USER_ID,
        feature: 'parse_job',
        status: 'success',
        tokens_input: 100,
        tokens_output: 50,
        latency_ms: 120,
        created_at: new Date().toISOString()
    };

    describe('GET /ai-logs', () => {
        it('should list logs for the user with pagination', async () => {
            mockStore.ai_usage_logs.push(
                { ...mockLog, id: '1' },
                { ...mockLog, id: '2' },
                { ...mockLog, id: '3' }
            );

            const response = await request(app).get('/api/v1/ai-logs?limit=2&page=1');

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.count).toBe(3);
            expect(response.body.limit).toBe(2);
        });
    });

    describe('POST /ai-logs', () => {
        it('should create a log entry', async () => {
            const newLog = {
                feature: 'Cover_Letter_Generation',
                model: 'gpt-4',
                tokens_input: 500,
                tokens_output: 200,
                latency_ms: 2500,
                status: 'Success'
            };

            const response = await request(app)
                .post('/api/v1/ai-logs')
                .send(newLog);

            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            expect(response.body.feature).toBe('Cover_Letter_Generation');
            expect(mockStore.ai_usage_logs).toHaveLength(1);
        });
    });
});
