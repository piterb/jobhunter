import { Router } from 'express';
import { FeedbackService, FeedbackData } from '../services/feedback-service';

const router = Router();

router.post('/', async (req, res) => {
    if (process.env.FEEDBACK_ENABLED === 'false') {
        return res.status(403).json({ error: 'Feedback feature is currently disabled' });
    }

    try {
        const data: FeedbackData = req.body;

        if (data.dryRun) {
            console.log(`[Feedback] DRY RUN request received for subject: ${data.subject}`);
        }

        if (!data.subject || !data.description) {
            return res.status(400).json({ error: 'Subject and description are required' });
        }

        const reportUrl = await FeedbackService.generateAndUploadReport(data);

        res.status(201).json({
            success: true,
            reportUrl
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Feedback route error:', error);
        res.status(500).json({ error: errorMessage || 'Failed to process feedback' });
    }
});

export default router;
