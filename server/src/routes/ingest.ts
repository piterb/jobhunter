import { Router } from 'express';
import { ingestJob } from '../controllers/ingest';
import { authMiddleware } from '../middleware/auth';


import { validate } from '../middleware/validate';
import { IngestRequestSchema } from 'shared';

const router = Router();

// POST /ingest - takes { url: string }
router.post('/', authMiddleware, validate(IngestRequestSchema), ingestJob);

export default router;
