import { Router } from 'express';
import { ingestJob } from '../controllers/ingest';
import { authMiddleware } from '../middleware/auth';


const router = Router();

// POST /ingest - takes { url: string }
router.post('/', authMiddleware, ingestJob);

export default router;
