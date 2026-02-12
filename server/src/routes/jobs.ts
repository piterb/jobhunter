import { Router, Response } from 'express';
import { createSupabaseUserClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to get authenticated client
const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// GET /jobs - List all jobs for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { status, sort, order } = req.query;
    const supabase = getClient(req);

    let query = supabase
        .from('jobs')
        .select('*');

    // If not admin (service role), filter by user_id
    // Note: RLS should handle this, but adding it explicitly is safer/cleaner if we want to rely on the where clause
    // However, if we trust RLS, we don't strictly need .eq('user_id', userId) if the policy enforces it.
    // For now, let's keep explicit filtering as it matches previous logic.
    if (userId) {
        query = query.eq('user_id', userId);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const sortColumn = (sort as string) || 'created_at';
    const sortOrder = (order as string) === 'asc' ? true : false;

    // Use order on the query builder chain correctly
    const { data, error } = await query.order(sortColumn, { ascending: sortOrder });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// GET /jobs/:id - Get specific job
router.get('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const supabase = getClient(req);

    const query = supabase
        .from('jobs')
        .select('*')
        .eq('id', id);

    if (userId) {
        query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Job not found' });
        }
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

import { CreateJobRequest } from 'shared';

// POST /jobs - Create a new job
router.post('/', async (req: AuthRequest<{}, {}, CreateJobRequest>, res: Response) => {
    const userId = req.user?.id;
    const supabase = getClient(req);

    const jobData = {
        ...req.body,
        // Ensure user_id is set if not provided (though RLS/db default might handle it, better explicit)
        user_id: userId,
    };

    const { data, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
});

// PUT /jobs/:id - Update a job
router.put('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body;
    const supabase = getClient(req);

    const query = supabase
        .from('jobs')
        .update(updates)
        .eq('id', id);

    if (userId) {
        query.eq('user_id', userId);
    }

    const { data, error } = await query
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// DELETE /jobs/:id - Delete a job
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const supabase = getClient(req);

    const query = supabase
        .from('jobs')
        .delete()
        .eq('id', id);

    if (userId) {
        query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(204).send();
});

export default router;
