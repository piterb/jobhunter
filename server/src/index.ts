import app from './app';
import { ensureBuckets } from './config/storage';
import { authService } from './auth/service';

const port = process.env.PORT || 3001;

const startServer = async () => {
    try {
        // Validate auth runtime configuration early to fail fast on unsafe deploy config.
        authService.initialize();

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
