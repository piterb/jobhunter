import { Router, Response } from 'express';
import { createSupabaseUserClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateAIUsageLogSchema, CreateAIUsageLogRequest } from 'shared';

const router = Router();

const getClient = (req: AuthRequest) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return createSupabaseUserClient(token);
};

// GET /ai-logs - Get AI usage logs for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { limit = 50, offset = 0 } = req.query;
    const supabase = getClient(req);

    const { data, error, count } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json({
        data,
        pagination: {
            total: count,
            limit: Number(limit),
            offset: Number(offset)
        }
    });
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
