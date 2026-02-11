import { Router } from 'express';
import { ingestJob } from '../controllers/ingest';


const router = Router();

// POST /ingest - takes { url: string }
router.post('/', ingestJob);

export default router;
