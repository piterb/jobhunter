import { Router, Response } from 'express';
import { createSupabaseUserClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { GetJobsQuerySchema, CreateJobSchema, UpdateJobSchema } from 'shared';
import type { CreateJobRequest, UpdateJobRequest, PaginatedJobs } from 'shared';

const router = Router();

// Helper to get authenticated client
const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// GET /jobs - List all jobs for the current user with pagination
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const supabase = getClient(req);

    // Validate query parameters
    const queryResult = GetJobsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        return res.status(400).json({ error: queryResult.error.message });
    }

    const { status, sort, order, page, limit, search } = queryResult.data;

    // Default pagination values
    const pageNum = page || 1;
    const limitNum = limit || 10;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    if (status) {
        query = query.eq('status', status);
    }

    if (search) {
        const searchTerm = `%${search}%`;
        query = query.or(`title.ilike.${searchTerm},company.ilike.${searchTerm},location.ilike.${searchTerm},notes.ilike.${searchTerm}`);
    }

    const sortColumn = sort || 'created_at';
    const sortOrder = order === 'asc' ? true : false;

    const { data, count, error } = await query
        .order(sortColumn, { ascending: sortOrder })
        .range(from, to);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const response: PaginatedJobs = {
        data: data || [],
        count: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: count ? Math.ceil(count / limitNum) : 0
    };

    return res.json(response);
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



// POST /jobs - Create a new job
router.post('/', validate(CreateJobSchema), async (req: AuthRequest<{}, {}, CreateJobRequest>, res: Response) => {
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
router.put('/:id', validate(UpdateJobSchema), async (req: AuthRequest<{ id: string }, {}, UpdateJobRequest>, res: Response) => {
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
