import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Try to load from various possible .env locations
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupFeedbackBucket() {
    const bucketName = 'feedback-reports';

    console.log(`🔍 Checking bucket: ${bucketName}...`);

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('❌ Error listing buckets:', listError);
        return;
    }

    const exists = buckets.find(b => b.name === bucketName);

    if (!exists) {
        console.log(`🚀 Creating bucket: ${bucketName}...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
            allowedMimeTypes: ['text/html']
        });

        if (createError) {
            console.error('❌ Error creating bucket:', createError);
        } else {
            console.log(`✅ Bucket ${bucketName} created successfully!`);
        }
    } else {
        console.log(`✅ Bucket ${bucketName} already exists.`);
    }
}

setupFeedbackBucket();
