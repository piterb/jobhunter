const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const { CONFIG } = require('./config');

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

// Helper to pick random item from array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function seedData() {
    console.log('🌱 Starting seed script...');

    // 1. Get the target user (Google authenticated)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users || users.length === 0) {
        console.error('❌ No users found. Please sign up first.');
        return;
    }

    // specific filtering for google user if possible, otherwise first user
    let user = users.find(u => u.app_metadata?.provider === 'google');

    if (!user) {
        console.warn('⚠️ No Google-authenticated user found. Falling back to the first available user.');
        user = users[0];
    }

    console.log(`👤 Seeding data for user: ${user.email} (${user.id})`);

    // 2. Clear existing data for this user
    console.log('🧹 Clearing existing data...');
    await supabase.from('activities').delete().eq('user_id', user.id);
    await supabase.from('jobs').delete().eq('user_id', user.id);
    await supabase.from('documents').delete().eq('user_id', user.id);
    await supabase.from('ai_usage_logs').delete().eq('user_id', user.id);

    // 3. Avatar & Profile
    console.log('🖼️  Setting up avatar...');
    let avatarUrl = user.user_metadata?.avatar_url || null;

    try {
        // Ensure 'avatars' bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(b => b.name === CONFIG.buckets.avatars)) {
            console.log(`Creating '${CONFIG.buckets.avatars}' bucket...`);
            await supabase.storage.createBucket(CONFIG.buckets.avatars, { public: true });
        }

        // Generate avatar
        const styles = ['avataaars', 'bottts', 'pixel-art', 'lorelei'];
        const randomStyle = random(styles);
        const randomSeed = Math.random().toString(36).substring(7);
        const dicebearUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;

        console.log(`Downloading avatar from ${dicebearUrl}...`);
        const response = await axios.get(dicebearUrl, { responseType: 'arraybuffer' });
        const avatarBuffer = Buffer.from(response.data, 'binary');
        const storagePath = `${user.id}/avatar_${Date.now()}.svg`;

        const { error: uploadError } = await supabase.storage
            .from(CONFIG.buckets.avatars)
            .upload(storagePath, avatarBuffer, {
                contentType: 'image/svg+xml',
                upsert: true
            });

        if (uploadError) {
            console.warn('Failed to upload avatar:', uploadError.message);
        } else {
            const { data: { publicUrl } } = supabase.storage.from(CONFIG.buckets.avatars).getPublicUrl(storagePath);
            avatarUrl = publicUrl;
            console.log('✅ Avatar uploaded to storage:', avatarUrl);
        }
    } catch (err: any) {
        console.warn('Error processing avatar:', err.message);
    }

    await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Demo User',
        avatar_url: avatarUrl,
        onboarding_completed: true,
        professional_headline: 'Senior Software Engineer'
    });

    // 4. Create Documents
    console.log('📄 Creating documents and uploading files...');

    // Ensure 'documents' bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === CONFIG.buckets.documents)) {
        console.log(`Creating '${CONFIG.buckets.documents}' bucket...`);
        await supabase.storage.createBucket(CONFIG.buckets.documents, { public: false }); // Documents should likely be private based on schema policies
    }

    const resumeContent = `
    PETER DEVELOPER
    Senior Software Engineer
    
    SUMMARY
    Full-stack developer with 8+ years of experience building scalable web applications.
    Expert in React, Node.js, and Cloud Architecture.
    
    EXPERIENCE
    Senior Engineer at Tech Corp (2020 - Present)
    - Led migration from monolithic architecture to microservices.
    - Improved application performance by 40%.
    - Mentored junior developers.
    
    Software Developer at StartUp Inc (2016 - 2020)
    - Built MVP for fintech product.
    - Implemented CI/CD pipelines.
    
    SKILLS
    - Languages: JavaScript, TypeScript, Python, SQL
    - Frameworks: React, Next.js, Express, Django
    - Tools: Docker, Kubernetes, AWS
    `;

    let resumeContentPath = 'resume_placeholder.md';

    try {
        // Generate file from text content directly
        const fileBuffer = Buffer.from(resumeContent, 'utf-8');
        // Schema policy requires: (split_part(name, '/', 1)) = auth.uid()::text
        resumeContentPath = `${user.id}/resume_2025_final.md`;

        const { error: uploadErr } = await supabase.storage
            .from(CONFIG.buckets.documents)
            .upload(resumeContentPath, fileBuffer, {
                contentType: 'text/markdown',
                upsert: true
            });

        if (uploadErr) console.warn('Failed to upload resume MD:', uploadErr.message);
        else console.log('✅ Sample resume MD uploaded to documents bucket.');
    } catch (e: any) {
        console.warn('Error uploading resume file:', e.message);
    }

    const documents = [
        {
            user_id: user.id,
            name: 'Resume_2025_Final.md',
            doc_type: 'Resume',
            storage_path: resumeContentPath,
            content_text: resumeContent,
            is_primary: true
        }
    ];

    const { error: docError } = await supabase.from('documents').insert(documents);
    if (docError) console.error('Error seeding documents:', docError);

    // 5. Create Jobs (Varied data)
    console.log('💼 Creating jobs...');
    const companies = [
        { name: 'Vercel', url: 'https://vercel.com', loc: 'Remote' },
        { name: 'Linear', url: 'https://linear.app', loc: 'Remote (EU)' },
        { name: 'Supabase', url: 'https://supabase.com', loc: 'Remote' },
        { name: 'OpenAI', url: 'https://openai.com', loc: 'San Francisco, CA' },
        { name: 'Anthropic', url: 'https://anthropic.com', loc: 'San Francisco, CA' },
        { name: 'Stripe', url: 'https://stripe.com', loc: 'Dublin, IE' },
        { name: 'Airbnb', url: 'https://airbnb.com', loc: 'Remote' },
        { name: 'Netflix', url: 'https://netflix.com', loc: 'Los Gatos, CA' },
        { name: 'Google', url: 'https://google.com', loc: 'Mountain View, CA' },
        { name: 'Meta', url: 'https://meta.com', loc: 'Menlo Park, CA' },
        { name: 'Shopify', url: 'https://shopify.com', loc: 'Remote (Canada)' },
        { name: 'Discord', url: 'https://discord.com', loc: 'San Francisco, CA' }
    ];

    const titles = ['Senior Frontend Engineer', 'Staff Software Engineer', 'Product Engineer', 'Full Stack Developer', 'Backend Engineer', 'Engineering Manager'];
    const statuses = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'] as const;

    const jobData = companies.map((comp, i) => {
        const status = statuses[i % statuses.length]; // Distribute statuses
        const postedDate = new Date();
        postedDate.setDate(postedDate.getDate() - randomInt(1, 40));

        let appliedAt = null;
        if (status !== 'Saved') {
            const d = new Date(postedDate);
            d.setDate(d.getDate() + randomInt(1, 5));
            appliedAt = d.toISOString();
        }

        return {
            user_id: user!.id,
            company: comp.name,
            title: random(titles),
            url: `${comp.url}/careers`,
            location: comp.loc,
            status: status,
            employment_type: 'Full-time',
            salary_min: randomInt(120, 160) * 1000,
            salary_max: randomInt(170, 250) * 1000,
            skills_tools: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', status === 'Interview' ? 'System Design' : 'Tailwind'],
            date_posted: postedDate.toISOString(),
            applied_at: appliedAt,
            notes: i % 3 === 0 ? `Referral from a friend at ${comp.name}.` : null,
            contact_email: i % 4 === 0 ? `recruiting@${comp.name.toLowerCase()}.com` : null
        };
    });

    const { data: createdJobs, error: jobError } = await supabase.from('jobs').insert(jobData).select();

    if (jobError) {
        console.error('Error creating jobs:', jobError);
        return;
    }

    // 6. Create Activities
    console.log('📅 Creating activities...');
    const activities = [];

    if (createdJobs) {
        for (const job of createdJobs) {
            // Base activity: Found the job
            activities.push({
                job_id: job.id,
                user_id: user.id,
                event_type: 'Manual',
                category: 'General',
                content: 'Added job to tracker.',
                occurred_at: job.created_at
            });

            if (job.status === 'Applied' || job.status === 'Interview' || job.status === 'Rejected' || job.status === 'Offer' || job.status === 'Ghosted') {
                activities.push({
                    job_id: job.id,
                    user_id: user.id,
                    event_type: 'Email',
                    category: 'General',
                    content: 'Application submitted via career page.',
                    occurred_at: job.applied_at || new Date().toISOString()
                });
            }

            if (job.status === 'Interview') {
                activities.push({
                    job_id: job.id,
                    user_id: user.id,
                    event_type: 'Call',
                    category: 'Interview',
                    content: 'Recruiter screening call. Went well, discussed salary expectations.',
                    occurred_at: new Date(new Date(job.created_at).getTime() + 86400000 * 2).toISOString()
                });
                activities.push({
                    job_id: job.id,
                    user_id: user.id,
                    event_type: 'Call',
                    category: 'Interview',
                    content: 'Technical Interview with the team lead.',
                    occurred_at: new Date(new Date(job.created_at).getTime() + 86400000 * 7).toISOString()
                });
            }

            if (job.status === 'Offer') {
                activities.push({
                    job_id: job.id,
                    user_id: user.id,
                    event_type: 'Email',
                    category: 'Offer',
                    content: 'Received official offer letter!',
                    occurred_at: new Date().toISOString()
                });
            }

            if (job.status === 'Rejected') {
                activities.push({
                    job_id: job.id,
                    user_id: user.id,
                    event_type: 'Email',
                    category: 'Rejection',
                    content: 'Standard rejection email received.',
                    occurred_at: new Date().toISOString()
                });
            }
        }
    }

    const { error: actError } = await supabase.from('activities').insert(activities);
    if (actError) console.error('Error creating activities:', actError);

    // 7. Create AI Usage Logs
    console.log('🤖 Creating AI usage logs...');
    const aiLogs = [];
    for (let i = 0; i < 15; i++) {
        aiLogs.push({
            user_id: user.id,
            feature: random(['Job_Parsing', 'Email_Analysis', 'Cover_Letter_Generation']),
            model: 'gpt-4o-mini',
            tokens_input: randomInt(500, 2000),
            tokens_output: randomInt(100, 500),
            cost: randomInt(1, 10) / 1000, // micro cents
            latency_ms: randomInt(200, 1500),
            status: 'Success',
            created_at: randomDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), new Date()).toISOString()
        });
    }

    const { error: aiError } = await supabase.from('ai_usage_logs').insert(aiLogs);
    if (aiError) console.error('Error creating AI logs:', aiError);

    console.log('✅ Seeding complete!');
}

seedData();
