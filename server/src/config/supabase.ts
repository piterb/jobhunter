import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

// Admin client for system operations (Auth, etc.) - has NO specific schema set globally
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Public client for user-facing operations BEFORE authentication (like login)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Helper to create a client for a specific user token
// This client WILL use the 'jobhunter' schema for data operations
export const createSupabaseUserClient = (token: string) => {
    return createClient(supabaseUrl, supabaseServiceKey, {
        global: {
            headers: { Authorization: `Bearer ${token}` },
        },
        db: {
            schema: 'jobhunter',
        },
    });
};

// Start with admin client as default 'supabase' export for backward compatibility 
// (we will update usages next)
export const supabase = supabaseAdmin;
