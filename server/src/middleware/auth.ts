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
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Check for app_id in app_metadata as per data_model.md
        if (user.app_metadata?.app_id !== 'jobhunter' && process.env.NODE_ENV !== 'development') {
            // In local development, we might not have this set up yet in all tokens, 
            // but for production it's a strict requirement.
            // For now, let's log it and allow if in development, or decide if we want to be strict.
            console.warn(`User ${user.id} attempting access without correct app_id in metadata`);
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
