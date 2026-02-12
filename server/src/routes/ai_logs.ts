import { Router, Response } from 'express';
import { createSupabaseUserClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateAIUsageLogSchema, CreateAIUsageLogRequest, GetAILogsQuerySchema, PaginatedAILogs } from 'shared';

const router = Router();

const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// GET /ai-logs - Get AI usage logs for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const supabase = getClient(req);

    // Validate query parameters
    const queryResult = GetAILogsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        return res.status(400).json({ error: queryResult.error.message });
    }

    const { page, limit, feature, status } = queryResult.data;

    // Default pagination values
    const pageNum = page || 1;
    const limitNum = limit || 10;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (feature) {
        query = query.eq('feature', feature);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Calculate global stats for this user
    const { data: statsData, error: statsError } = await supabase
        .from('ai_usage_logs')
        .select('tokens_input, tokens_output, latency_ms')
        .eq('user_id', userId);

    let totalTokens = 0;
    let totalLatency = 0;
    let avgLatency = 0;

    if (!statsError && statsData) {
        statsData.forEach(log => {
            totalTokens += (log.tokens_input || 0) + (log.tokens_output || 0);
            totalLatency += log.latency_ms || 0;
        });
        avgLatency = statsData.length > 0 ? Math.round(totalLatency / statsData.length) : 0;
    }

    const response: PaginatedAILogs = {
        data: data || [],
        count: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: count ? Math.ceil(count / limitNum) : 0,
        totalTokens,
        avgLatency
    };

    return res.json(response);
});

// POST /ai-logs - Create a new AI usage log (usually called by other backend services, but exposed for FE if needed)
router.post('/', validate(CreateAIUsageLogSchema), async (req: AuthRequest<{}, {}, CreateAIUsageLogRequest>, res: Response) => {
    const userId = req.user?.id;
    const logData = {
        ...req.body,
        user_id: userId,
    };
    const supabase = getClient(req);

    const { data, error } = await supabase
        .from('ai_usage_logs')
        .insert([logData])
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
});

export default router;
