import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';

// Import routes
import healthRoutes from './routes/health';
import jobsRoutes from './routes/jobs';
import activitiesRoutes from './routes/activities';
import settingsRoutes from './routes/settings';
import analyzeRoutes from './routes/analyze';
import profileRoutes from './routes/profile';
import aiLogsRoutes from './routes/ai_logs';
import generateRoutes from './routes/generate';
import ingestRoutes from './routes/ingest';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/v1/health', healthRoutes);

// Protected routes
app.use('/api/v1/jobs', authMiddleware, jobsRoutes);
app.use('/api/v1/jobs', authMiddleware, activitiesRoutes); // Activities use /jobs/:id/activities
app.use('/api/v1/settings', authMiddleware, settingsRoutes);
app.use('/api/v1/analyze', authMiddleware, analyzeRoutes);
app.use('/api/v1/profile', authMiddleware, profileRoutes);
app.use('/api/v1/ai-logs', authMiddleware, aiLogsRoutes);
app.use('/api/v1/generate', authMiddleware, generateRoutes);
app.use('/api/v1/ingest', authMiddleware, ingestRoutes);

app.get('/', (req, res) => {
    res.send('JobHunter API is running!');
});

export default app;
