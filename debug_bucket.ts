
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables in server/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('Checking buckets...');
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    if (bError) {
        console.error('Error listing buckets:', bError);
    } else {
        console.log('Found buckets:', buckets.map(b => b.name));
    }

    console.log('\nChecking database entry in storage.buckets...');
    const { data: dbEntry, error: dbError } = await supabase
        .from('buckets')
        .select('*')
        .schema('storage');

    if (dbError) {
        console.error('Error querying storage.buckets:', dbError);
    } else {
        console.log('Database entries in storage.buckets:', dbEntry);
    }
}

check();
