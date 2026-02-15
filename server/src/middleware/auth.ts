import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

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
        // Special case for service role key (for testing/admin access)
        if (token === process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const appName = process.env.APP_NAME || 'jobhunter';
            req.user = {
                id: 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', // Admin/Test User ID
                email: 'admin@jobhunter.local',
                app_metadata: { role: 'service_role', app_id: appName },
                user_metadata: { full_name: 'System Admin' }
            };
            return next();
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const appName = process.env.APP_NAME || 'jobhunter';

        // Check for app_id in app_metadata as per data_model.md
        if (user.app_metadata?.app_id !== appName && process.env.NODE_ENV !== 'development') {
            console.warn(`User ${user.id} attempting access without correct app_id in metadata`);
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
