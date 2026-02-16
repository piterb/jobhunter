import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AuthRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> extends Request<P, ResBody, ReqBody, ReqQuery> {
    user?: {
        id: string;
        email?: string;
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Special case for local development / testing
        if (process.env.NODE_ENV === 'development') {
            // For local dev, we can use a hardcoded token or a mock JWT
            // In a real migration, this would be replaced by Auth0 JWT validation
            const appName = process.env.APP_NAME || 'jobhunter';

            // Simulating a successful user fetch
            // In local dev, we trust the token for now or use a fixed test user
            req.user = {
                id: 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', // Fixed Test User ID
                email: 'dev@jobhunter.local',
                app_metadata: { role: 'authenticated', app_id: appName },
                user_metadata: { full_name: 'Dev User' }
            };
            return next();
        }

        // 2. Production Auth0 Validation (TODO in Phase 2)
        // This is where express-oauth2-jwt-bearer would go

        return res.status(501).json({ error: 'Production authentication not yet implemented' });
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
