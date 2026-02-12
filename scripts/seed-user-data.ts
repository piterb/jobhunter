import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'jobhunter' }
});

async function seedData() {
    // 1. Get the first user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users || users.length === 0) {
        console.error('No users found. Please sign up first.');
        return;
    }

    const user = users[0];
    console.log(`Seeding data for user: ${user.email} (${user.id})`);

    // 2. Ensure profile exists (trigger should handle this, but let's be safe)
    await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        onboarding_completed: true
    });

    // 3. Clear existing jobs for this user to have a clean slate
    await supabase.from('jobs').delete().eq('user_id', user.id);

    // 4. Create realistic jobs
    const jobs = [
        {
            user_id: user.id,
            title: 'Senior Frontend Engineer',
            company: 'Vercel',
            status: 'Applied',
            location: 'Remote',
            salary_min: 140000,
            salary_max: 180000,
            url: 'https://vercel.com/jobs/frontend-engineer',
            skills_tools: ['React', 'Next.js', 'Typescript', 'Tailwind'],
            notes: 'Focus on performance and developer experience. Guillermo Rauch mentioned this is a key role.',
            applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            user_id: user.id,
            title: 'Full Stack Developer',
            company: 'Supabase',
            status: 'Interview',
            location: 'Remote',
            salary_min: 130000,
            salary_max: 170000,
            url: 'https://supabase.com/careers',
            skills_tools: ['PostgreSQL', 'Elixir', 'React', 'Go'],
            notes: 'Open source enthusiast preferred. They use Deno for edge functions.',
            applied_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            user_id: user.id,
            title: 'Product Engineer',
            company: 'Linear',
            status: 'Saved',
            location: 'Remote (EU)',
            salary_min: 120000,
            salary_max: 160000,
            url: 'https://linear.app/careers',
            skills_tools: ['React', 'Node.js', 'GraphQL'],
            notes: 'Very high bar for UI/UX detail. Their app is incredibly fast.',
        }
    ];

    const { data: createdJobs, error: jobError } = await supabase.from('jobs').insert(jobs).select();

    if (jobError) {
        console.error('Error creating jobs:', jobError.message);
        return;
    }

    console.log(`Created ${createdJobs.length} jobs.`);

    // 5. Create activities for the Supabase job
    const supabaseJob = createdJobs.find(j => j.company === 'Supabase');
    if (supabaseJob) {
        const activities = [
            {
                job_id: supabaseJob.id,
                user_id: user.id,
                event_type: 'Call',
                category: 'General',
                content: 'Recruiter screen with Ant. Discussed the vision of the company and role expectations.',
                occurred_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                job_id: supabaseJob.id,
                user_id: user.id,
                event_type: 'Manual',
                category: 'Interview',
                content: 'Technical interview with Paul. Deep dive into Postgres and RLS. It went well!',
                occurred_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        const { error: actError } = await supabase.from('activities').insert(activities);
        if (actError) console.error('Error creating activities:', actError.message);
        else console.log('Created activities for Supabase job.');
    }
}

seedData();
