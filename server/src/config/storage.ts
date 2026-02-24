import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from current dir or root
const envPath1 = path.join(process.cwd(), '.env.local');
const envPath2 = path.join(process.cwd(), '..', '.env.local');

dotenv.config({ path: envPath1 });
dotenv.config({ path: envPath2 });
dotenv.config();

const isLocal = process.env.NODE_ENV === 'development' || !process.env.GCP_PROJECT_ID;

export const storage = new Storage({
    // Local dev uses fake-gcs-server endpoint from .env.local
    apiEndpoint: process.env.GCS_ENDPOINT,
    projectId: process.env.GCS_PROJECT_ID || 'local-dev',
});

const resourcePrefix = process.env.RESOURCE_PREFIX || 'jobhunter';

// Bucket names
export const BUCKETS = {
    DOCUMENTS: `${resourcePrefix}-documents`,
    AVATARS: `${resourcePrefix}-avatars`,
    FEEDBACK: `${resourcePrefix}-feedback-reports`,
};

/**
 * Ensures all required buckets exist. 
 * Should be called during server startup in development.
 */
export const ensureBuckets = async () => {
    console.log('[Storage] Checking buckets...');
    for (const bucketName of Object.values(BUCKETS)) {
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();

        if (!exists) {
            console.log(`[Storage] Creating bucket: ${bucketName}`);
            await storage.createBucket(bucketName, {
                location: 'EU', // or your preferred region
                // Local emulator doesn't care much about these, but good for real GCP
                storageClass: 'STANDARD',
            });

            // Set public access for avatars if needed (simplified for dev)
            if (bucketName === BUCKETS.AVATARS || bucketName === BUCKETS.FEEDBACK) {
                try {
                    await bucket.makePublic();
                } catch (err) {
                    console.warn(`[Storage] Could not set bucket ${bucketName} to public. Emulators might not support this. Continuing...`);
                }
            }
        }
    }
    console.log('[Storage] All buckets verified.');
};
