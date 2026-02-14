import { Router } from 'express';
import { FeedbackService, FeedbackData } from '../services/feedback-service';

const router = Router();

router.post('/', async (req, res) => {
    if (process.env.FEEDBACK_ENABLED === 'false') {
        return res.status(403).json({ error: 'Feedback feature is currently disabled' });
    }

    try {
        const data: FeedbackData = req.body;

        if (!data.subject || !data.description) {
            return res.status(400).json({ error: 'Subject and description are required' });
        }

        const reportUrl = await FeedbackService.generateAndUploadReport(data);

        res.status(201).json({
            success: true,
            reportUrl
        });
    } catch (error: any) {
        console.error('Feedback route error:', error);
        res.status(500).json({ error: error.message || 'Failed to process feedback' });
    }
});

export default router;
