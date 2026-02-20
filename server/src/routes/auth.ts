import { Router, Response, Request } from 'express';

const router = Router();

// This route is only registered in development mode in app.ts
router.get('/dev-login', async (req: Request, res: Response) => {
    // Triple-lock: Extra check for development environment
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Dev login is only allowed in development mode' });
    }

    // In local development, we skip real IdP auth logic
    // and just return a token that our middleware handles.

    const devUserId = 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab';
    const devEmail = 'dev@jobhunter.local';

    console.log(`[Dev-Login] Successfully logged in as ${devEmail} (Mock)`);

    return res.json({
        user: {
            id: devUserId,
            email: devEmail,
        },
        access_token: 'mock-dev-token',
        refresh_token: 'mock-dev-refresh-token',
        expires_in: 3600,
        warning: 'This is a mock token for local development. It is bypasses real authentication.'
    });
});

export default router;
