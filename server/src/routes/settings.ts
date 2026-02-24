import { Router, Response } from 'express';
import sql from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UpdateProfileSchema, UpdateProfileRequest } from 'shared';

const router = Router();

// GET /settings - Get user settings (from profiles table)
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [settings] = await sql`
            SELECT theme, language, ghosting_threshold_days, onboarding_completed, default_ai_model 
            FROM profiles 
            WHERE id = ${userId}
        `;

        if (!settings) {
            return res.status(404).json({ error: 'Settings not found' });
        }

        return res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /settings - Update user settings
router.put('/', validate(UpdateProfileSchema), async (req: AuthRequest<{}, {}, UpdateProfileRequest>, res: Response) => {
    const userId = req.user?.id;
    const updates = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [settings] = await sql`
            UPDATE profiles 
            SET ${sql(updates as any)}
            WHERE id = ${userId}
            RETURNING theme, language, ghosting_threshold_days, onboarding_completed, default_ai_model
        `;

        if (!settings) {
            return res.status(404).json({ error: 'Settings not found' });
        }

        return res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /settings/integrations - Get integration status
router.get('/integrations', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [data] = await sql`
            SELECT openai_api_key, default_ai_model 
            FROM profiles 
            WHERE id = ${userId}
        `;

        if (!data) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.json({
            openai: {
                enabled: !!data.openai_api_key,
                default_model: data.default_ai_model || 'gpt-4o-mini',
            }
        });
    } catch (error) {
        console.error('Error fetching integrations:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /settings/integrations - Update integration settings
router.put('/integrations', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { provider, api_key, enabled: _enabled, default_model } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (provider !== 'openai') {
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    const updates: Record<string, any> = {};
    if (api_key !== undefined) updates.openai_api_key = api_key;
    if (default_model !== undefined) updates.default_ai_model = default_model;

    try {
        const [result] = await sql`
            UPDATE profiles 
            SET ${sql(updates)}
            WHERE id = ${userId}
            RETURNING id
        `;

        if (!result) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.json({ message: 'Integration settings updated' });
    } catch (error) {
        console.error('Error updating integration settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
