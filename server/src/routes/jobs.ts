import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /jobs - List all jobs for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { status, sort, order } = req.query;

    let query = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId);

    if (status) {
        query = query.eq('status', status);
    }

    const sortColumn = (sort as string) || 'created_at';
    const sortOrder = (order as string) === 'asc' ? true : false;

    query = query.order(sortColumn, { ascending: sortOrder });

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// GET /jobs/:id - Get specific job
router.get('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Job not found' });
        }
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// POST /jobs - Create a new job
router.post('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const jobData = {
        ...req.body,
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

    const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
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

    const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(204).send();
});

export default router;
