import { Request, Response, NextFunction } from 'express';
import { authService } from '../auth/service';
import { AuthContext } from '../auth/types';
import { AuthError } from '../auth/errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AuthRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> extends Request<P, ResBody, ReqBody, ReqQuery> {
    user?: {
        id: string;
        email?: string;
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
        auth?: AuthContext;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authContext = await authService.authenticateRequest(req.headers.authorization);
        req.user = {
            id: authContext.userId,
            email: authContext.email,
            app_metadata: {
                role: 'authenticated',
                app_id: authContext.appId,
                app_env: authContext.appEnv,
                client_id: authContext.clientId,
                provider: authContext.provider,
                roles: authContext.roles
            },
            auth: authContext
        };
        return next();
    } catch (err) {
        if (err instanceof AuthError) {
            return res.status(err.status).json({ error: err.message, code: err.code });
        }
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
