import { Router, Response } from 'express';
import { createSupabaseUserClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateActivitySchema } from 'shared';

const router = Router();

const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// GET /jobs/:id/activities - List all activities for a specific job
router.get('/:jobId/activities', async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const userId = req.user?.id;
    const supabase = getClient(req);

    // First, verify the job belongs to the user
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .eq('user_id', userId)
        .single();

    if (jobError || !job) {
        return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('job_id', jobId)
        .order('occurred_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

// POST /jobs/:id/activities - Create a new activity for a job
router.post('/:jobId/activities', validate(CreateActivitySchema), async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const userId = req.user?.id;
    const activityData = {
        ...req.body,
        job_id: jobId,
        user_id: userId,
    };
    const supabase = getClient(req);

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .eq('user_id', userId)
        .single();

    if (jobError || !job) {
        return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const { data, error } = await supabase
        .from('activities')
        .insert([activityData])
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Update last_activity on job
    await supabase
        .from('jobs')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', jobId);

    return res.status(201).json(data);
});

export default router;
