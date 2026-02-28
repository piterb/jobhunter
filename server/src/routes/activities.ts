import { Router, Response } from 'express';
import sql from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateActivitySchema } from 'shared';

const router = Router();

// GET /jobs/:jobId/activities - List all activities for a specific job
router.get('/:jobId/activities', async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // First, verify the job belongs to the user
        const [job] = await sql`
            SELECT id FROM jobs 
            WHERE id = ${jobId} AND user_id = ${userId}
        `;

        if (!job) {
            return res.status(404).json({ error: 'Job not found or unauthorized' });
        }

        const activities = await sql`
            SELECT * FROM activities 
            WHERE job_id = ${jobId} 
            ORDER BY occurred_at DESC
        `;

        return res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /jobs/:jobId/activities - Create a new activity for a job
router.post('/:jobId/activities', validate(CreateActivitySchema), async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Verify the job belongs to the user
        const [job] = await sql`
            SELECT id FROM jobs 
            WHERE id = ${jobId} AND user_id = ${userId}
        `;

        if (!job) {
            return res.status(404).json({ error: 'Job not found or unauthorized' });
        }

        const activityData = {
            ...req.body,
            job_id: jobId,
            user_id: userId,
        };

        // Use a transaction for activity insertion and job update
        const [activity] = await sql.begin(async (tx) => {
            const runner = tx as unknown as typeof sql;

            const [newActivity] = await runner`
                INSERT INTO activities ${runner(activityData)}
                RETURNING *
            `;

            await runner`
                UPDATE jobs 
                SET last_activity = NOW() 
                WHERE id = ${jobId}
            `;

            return [newActivity];
        });

        return res.status(201).json(activity);
    } catch (error) {
        console.error('Error creating activity:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
