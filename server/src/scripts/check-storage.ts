
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
    console.log('Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        return;
    }

    console.log('Buckets found:', buckets.map(b => b.name));

    for (const bucketName of ['avatars', 'resumes']) {
        const bucket = buckets.find(b => b.name === bucketName);
        if (!bucket) {
            console.log(`Bucket '${bucketName}' NOT found. Attempting creation...`);
            const { data, error } = await supabase.storage.createBucket(bucketName, { public: true });
            if (error) console.error(`Error creating '${bucketName}':`, error);
            else console.log(`Created '${bucketName}'`);
        } else {
            console.log(`Bucket '${bucketName}' exists.`);
        }

        console.log(`Listing files in '${bucketName}'...`);
        const { data: files, error: listError } = await supabase.storage.from(bucketName).list();
        if (listError) {
            console.error(`Error listing files in '${bucketName}':`, listError);
        } else {
            console.log(`Files in '${bucketName}':`, files);
            if (files.length > 0) {
                // recursive check for folders? list() is essentially flat for the root or specified folder
                // If files are in folders, we might see the folder.
            }
        }
    }
}

checkStorage();
