import app from './app';
import { ensureBuckets } from './config/storage';

const port = process.env.PORT || 3001;

const startServer = async () => {
    try {
        // Initialize storage (create buckets if they don't exist)
        await ensureBuckets();

        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
