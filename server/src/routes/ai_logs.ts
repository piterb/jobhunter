import { Router, Response } from 'express';
import sql from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateAIUsageLogSchema, CreateAIUsageLogRequest, GetAILogsQuerySchema, PaginatedAILogs } from 'shared';

const router = Router();

// GET /ai-logs - Get AI usage logs for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Validate query parameters
    const queryResult = GetAILogsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        return res.status(400).json({ error: queryResult.error.message });
    }

    const { page, limit, feature, status } = queryResult.data;

    // Default pagination values
    const pageNum = page || 1;
    const limitNum = limit || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
        const featureFilter = feature ? sql`AND feature = ${feature}` : sql``;
        const statusFilter = status ? sql`AND status = ${status}` : sql``;

        // 1. Get total count
        const [countResult] = await sql`
            SELECT count(*) 
            FROM ai_usage_logs 
            WHERE user_id = ${userId}
            ${featureFilter}
            ${statusFilter}
        `;
        const totalCount = parseInt(countResult.count);

        // 2. Get paginated data
        const data = await sql`
            SELECT * 
            FROM ai_usage_logs 
            WHERE user_id = ${userId}
            ${featureFilter}
            ${statusFilter}
            ORDER BY created_at DESC
            LIMIT ${limitNum} 
            OFFSET ${offset}
        `;

        // 3. Calculate stats
        const [stats] = await sql`
            SELECT 
                SUM(COALESCE(tokens_input, 0) + COALESCE(tokens_output, 0)) as total_tokens,
                AVG(latency_ms) as avg_latency
            FROM ai_usage_logs 
            WHERE user_id = ${userId}
        `;

        const response: PaginatedAILogs = {
            data: data as unknown as PaginatedAILogs['data'],
            count: totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages: totalCount ? Math.ceil(totalCount / limitNum) : 0,
            totalTokens: parseInt(stats.total_tokens || '0'),
            avgLatency: Math.round(parseFloat(stats.avg_latency || '0'))
        };

        return res.json(response);
    } catch (error) {
        console.error('Error fetching AI logs:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /ai-logs - Create a new AI usage log
router.post('/', validate(CreateAIUsageLogSchema), async (req: AuthRequest<{}, {}, CreateAIUsageLogRequest>, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const logData = {
            ...req.body,
            user_id: userId,
        };

        const [log] = await sql`
            INSERT INTO ai_usage_logs ${sql(logData)}
            RETURNING *
        `;

        return res.status(201).json(log);
    } catch (error) {
        console.error('Error creating AI log:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
