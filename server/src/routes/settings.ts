import { Router, Response } from 'express';
import { createSupabaseUserClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UpdateProfileSchema, UpdateProfileRequest } from 'shared';

const router = Router();

const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// GET /settings - Get user settings (from profiles table)
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const supabase = getClient(req);

    const { data, error } = await supabase
        .from('profiles')
        .select('theme, language, ghosting_threshold_days, onboarding_completed, default_ai_model')
        .eq('id', userId)
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// PUT /settings - Update user settings
router.put('/', validate(UpdateProfileSchema), async (req: AuthRequest<{}, {}, UpdateProfileRequest>, res: Response) => {
    const userId = req.user?.id;
    const updates = req.body;
    const supabase = getClient(req);

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('theme, language, ghosting_threshold_days, onboarding_completed, default_ai_model')
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// GET /settings/integrations - Get integration status
router.get('/integrations', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const supabase = getClient(req);

    const { data, error } = await supabase
        .from('profiles')
        .select('openai_api_key, default_ai_model')
        .eq('id', userId)
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json({
        openai: {
            enabled: !!data.openai_api_key,
            default_model: data.default_ai_model || 'gpt-4o-mini',
            // last_used could be fetched from ai_usage_logs if needed
        }
    });
});

// PUT /settings/integrations - Update integration settings
router.put('/integrations', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { provider, api_key, enabled, default_model } = req.body;
    const supabase = getClient(req);

    if (provider !== 'openai') {
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    const updates: any = {};
    if (api_key !== undefined) updates.openai_api_key = api_key;
    if (default_model !== undefined) updates.default_ai_model = default_model;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json({ message: 'Integration settings updated' });
});

export default router;
