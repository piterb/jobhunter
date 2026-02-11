import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /auth/login
 * Simple login endpoint for testing
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        res.json({
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token,
            user: data.user,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
