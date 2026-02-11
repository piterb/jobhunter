import { Router, Response } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

export default router;
