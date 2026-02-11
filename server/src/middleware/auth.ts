import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
        app_metadata?: any;
        user_metadata?: any;
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
            req.user = {
                id: 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab', // Admin/Test User ID
                email: 'admin@jobhunter.local',
                app_metadata: { role: 'service_role', app_id: 'jobhunter' },
                user_metadata: { full_name: 'System Admin' }
            };
            return next();
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Check for app_id in app_metadata as per data_model.md
        if (user.app_metadata?.app_id !== 'jobhunter' && process.env.NODE_ENV !== 'development') {
            console.warn(`User ${user.id} attempting access without correct app_id in metadata`);
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
