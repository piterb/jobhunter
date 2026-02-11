import { Router, Response } from 'express';
import { createSupabaseUserClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// GET /profile - Get user profile
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const supabase = getClient(req);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// PUT /profile - Update user profile
router.put('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const updates = req.body;
    const supabase = getClient(req);

    // List of fields allowed to be updated in the profile
    const allowedFields = [
        'email',
        'first_name',
        'last_name',
        'full_name',
        'avatar_url',
        'professional_headline',
        'onboarding_completed'
    ];

    const filteredUpdates: any = {};
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            filteredUpdates[field] = updates[field];
        }
    }

    // Only update if there are fields provided
    if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(filteredUpdates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// POST /profile/cv - Upload CV
router.post('/cv', async (req: AuthRequest, res: Response) => {
    // This would require multer or similar to handle multipart/form-data
    // and then uploading to Supabase Storage
    return res.status(501).json({ error: 'CV upload not yet implemented' });
});

export default router;
