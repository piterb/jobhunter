import { Router, Response } from 'express';
import sql from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { GetJobsQuerySchema, CreateJobSchema, UpdateJobSchema } from 'shared';
import type { CreateJobRequest, UpdateJobRequest, PaginatedJobs } from 'shared';

const router = Router();

// GET /jobs - List all jobs for the current user with pagination
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Validate query parameters
    const queryResult = GetJobsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        return res.status(400).json({ error: queryResult.error.message });
    }

    const { status, sort, order, page, limit, search } = queryResult.data;

    // Default pagination values
    const pageNum = page || 1;
    const limitNum = limit || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
        // Construct filters
        const statusFilter = status ? sql`AND status = ${status}` : sql``;
        const searchFilter = search ? sql`AND (title ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'} OR location ILIKE ${'%' + search + '%'} OR notes ILIKE ${'%' + search + '%'})` : sql``;

        // Sorting
        const sortColumn = sort || 'created_at';
        // Note: we need to be careful with column names to prevent SQL injection, 
        // but since we validate with Zod and it's an enum, it's safe.
        // postgres.js handles column names safely with sql.identifier if needed, 
        // but here it's easier to just use the validated string for simple columns.
        const sortOrder = order === 'asc' ? sql`ASC` : sql`DESC`;

        // 1. Get total count
        const [countResult] = await sql`
            SELECT count(*) 
            FROM jobs 
            WHERE user_id = ${userId}
            ${statusFilter}
            ${searchFilter}
        `;
        const totalCount = parseInt(countResult.count);

        // 2. Get paginated data
        const data = await sql`
            SELECT * 
            FROM jobs 
            WHERE user_id = ${userId}
            ${statusFilter}
            ${searchFilter}
            ORDER BY ${sql(sortColumn)} ${sortOrder}
            LIMIT ${limitNum} 
            OFFSET ${offset}
        `;

        const response: PaginatedJobs = {
            data: data as any[],
            count: totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages: totalCount ? Math.ceil(totalCount / limitNum) : 0
        };

        return res.json(response);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /jobs/:id - Get specific job
router.get('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [job] = await sql`
            SELECT * FROM jobs 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        return res.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /jobs - Create a new job
router.post('/', validate(CreateJobSchema), async (req: AuthRequest<{}, {}, CreateJobRequest>, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const jobData = {
            ...req.body,
            user_id: userId,
        };

        const [job] = await sql`
            INSERT INTO jobs ${sql(jobData)}
            RETURNING *
        `;

        return res.status(201).json(job);
    } catch (error) {
        console.error('Error creating job:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /jobs/:id - Update a job
router.put('/:id', validate(UpdateJobSchema), async (req: AuthRequest<{ id: string }, {}, UpdateJobRequest>, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [job] = await sql`
            UPDATE jobs 
            SET ${sql(updates as any)}
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        return res.json(job);
    } catch (error) {
        console.error('Error updating job:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /jobs/:id - Delete a job
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const result = await sql`
            DELETE FROM jobs 
            WHERE id = ${id} AND user_id = ${userId}
        `;

        if (result.count === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting job:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
