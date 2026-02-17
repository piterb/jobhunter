import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { authService } from '../auth/service';
import * as identityModule from '../auth/identity';
import { AuthContext } from '../auth/types';
import { AuthError } from '../auth/errors';

type MockResponse = {
    statusCode: number;
    body: unknown;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
};

function createMockResponse(): MockResponse {
    const response = {
        statusCode: 200,
        body: undefined,
        status: vi.fn(function (this: MockResponse, code: number) {
            this.statusCode = code;
            return this;
        }),
        json: vi.fn(function (this: MockResponse, body: unknown) {
            this.body = body;
            return this;
        }),
    };
    return response;
}

function createBaseContext(): AuthContext {
    return {
        provider: 'auth0',
        userId: 'auth0-user-id',
        subject: 'google-oauth2|123',
        email: 'tester@example.com',
        issuer: 'https://tenant.example.auth0.com/',
        audience: ['https://api.jobhunter.local'],
        clientId: 'client-a',
        appId: 'jobhunter',
        appEnv: 'local',
        roles: ['authenticated'],
        scopes: ['openid', 'profile', 'email'],
        rawClaims: {}
    };
}

describe('auth middleware', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('attaches resolved internal identity and calls next on success', async () => {
        const req = {
            headers: { authorization: 'Bearer valid-token' }
        } as AuthRequest;
        const res = createMockResponse();
        const next = vi.fn();
        const context = createBaseContext();

        vi.spyOn(authService, 'authenticateRequest').mockResolvedValue(context);
        vi.spyOn(identityModule, 'resolveProfileIdentity').mockResolvedValue({
            id: '11111111-2222-4333-8444-555555555555',
            email: 'tester@example.com',
            auth_subject: 'google-oauth2|123'
        });

        await authMiddleware(req, res as never, next);

        expect(next).toHaveBeenCalledOnce();
        expect(req.user?.id).toBe('11111111-2222-4333-8444-555555555555');
        expect(req.user?.auth?.internalUserId).toBe('11111111-2222-4333-8444-555555555555');
        expect(req.user?.app_metadata?.auth_subject).toBe('google-oauth2|123');
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 for missing/invalid token errors from auth service', async () => {
        const req = {
            headers: {}
        } as AuthRequest;
        const res = createMockResponse();
        const next = vi.fn();

        vi.spyOn(authService, 'authenticateRequest').mockRejectedValue(
            new AuthError(401, 'missing_token', 'Unauthorized: Missing or invalid token')
        );

        await authMiddleware(req, res as never, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            error: 'Unauthorized: Missing or invalid token',
            code: 'missing_token'
        });
    });

    it('returns 403 for client isolation failures', async () => {
        const req = {
            headers: { authorization: 'Bearer token' }
        } as AuthRequest;
        const res = createMockResponse();
        const next = vi.fn();

        vi.spyOn(authService, 'authenticateRequest').mockRejectedValue(
            new AuthError(403, 'forbidden_client', 'Token client is not allowed for this deployment')
        );

        await authMiddleware(req, res as never, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
        expect(res.body).toEqual({
            error: 'Token client is not allowed for this deployment',
            code: 'forbidden_client'
        });
    });

    it('returns 500 with identity resolution error code when profile resolution fails', async () => {
        const req = {
            headers: { authorization: 'Bearer valid-token' }
        } as AuthRequest;
        const res = createMockResponse();
        const next = vi.fn();
        const context = createBaseContext();

        vi.spyOn(authService, 'authenticateRequest').mockResolvedValue(context);
        vi.spyOn(identityModule, 'resolveProfileIdentity').mockRejectedValue(
            new AuthError(500, 'identity_resolution_failed', 'Could not resolve internal profile identity')
        );

        await authMiddleware(req, res as never, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            error: 'Could not resolve internal profile identity',
            code: 'identity_resolution_failed'
        });
    });

    it('returns generic 500 response for unexpected errors', async () => {
        const req = {
            headers: { authorization: 'Bearer valid-token' }
        } as AuthRequest;
        const res = createMockResponse();
        const next = vi.fn();

        vi.spyOn(authService, 'authenticateRequest').mockRejectedValue(new Error('boom'));

        await authMiddleware(req, res as never, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Internal server error during authentication' });
    });
});
