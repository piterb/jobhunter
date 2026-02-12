import { Router, Response, Request } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// This route is only registered in development mode in app.ts
router.get('/dev-login', async (req: Request, res: Response) => {
    // 1. Triple-lock: Extra check for development environment
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Dev login is only allowed in development mode' });
    }

    // 2. Extra check: Ensure we are hitting a local Supabase
    const supabaseUrl = process.env.SUPABASE_URL || '';
    if (!supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
        return res.status(403).json({ error: 'Dev login is only allowed for local Supabase instances' });
    }

    try {
        // 3. Find the user (same logic as seed script)
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

        if (userError || !users || users.length === 0) {
            return res.status(404).json({ error: 'No users found in Supabase. Please sign up in the app first.' });
        }

        // Prefer google user, otherwise first one
        let user = users.find(u => u.app_metadata?.provider === 'google');
        if (!user) user = users[0];

        // 4. Set a temporary password for the user and sign in
        const tempPassword = 'dev-password-123';
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: tempPassword }
        );

        if (updateError) {
            return res.status(500).json({ error: `Failed to set dev password: ${updateError.message}` });
        }

        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: user.email!,
            password: tempPassword,
        });

        if (signInError || !signInData.session) {
            return res.status(500).json({ error: signInError?.message || 'Failed to sign in after password reset' });
        }

        console.log(`[Dev-Login] Successfully logged in as ${user.email}`);

        return res.json({
            user: {
                id: user.id,
                email: user.email,
            },
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            expires_in: signInData.session.expires_in,
            warning: 'This token was generated via Dev-Login. The user password was reset to a default dev value.'
        });
    } catch (error: any) {
        console.error('[Dev-Login] Error:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
