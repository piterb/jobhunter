import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
// Rely on process.env (passed via shell command due to EPERM issues with .env file)

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using SUPABASE_URL:', supabaseUrl);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const seed = async () => {
    console.log('🌱 Seeding database...');

    try {
        // 1. Ensure clean slate (optional, but safer)
        // Note: We don't delete auth.users directly via API easily.
        // We assume db reset cleared tables, OR we check if user exists.

        const devEmail = 'dev@example.com';
        const devPassword = 'dev123456';

        // Check if user exists
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        let userId = users.find(u => u.email === devEmail)?.id;

        if (!userId) {
            console.log(`Creating user ${devEmail}...`);
            const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
                email: devEmail,
                password: devPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: 'Test Developer',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev'
                }
            });

            if (userError) throw userError;
            userId = user.user?.id;
        } else {
            console.log(`User ${devEmail} already exists (ID: ${userId})`);
        }

        if (!userId) throw new Error('Failed to create/find user');

        // 2. Update Profile & Avatar
        console.log('Updating profile and avatar...');

        let avatarUrl = null;

        try {
            console.log('Generating random avatar via DiceBear...');
            const styles = ['avataaars', 'bottts', 'pixel-art', 'lorelei', 'notionists'];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            const randomSeed = Math.random().toString(36).substring(7);
            const dicebearUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;

            const response = await axios.get(dicebearUrl, { responseType: 'arraybuffer' });
            const avatarBuffer = Buffer.from(response.data, 'binary');
            const storagePath = `${userId}/seed_avatar_${randomSeed}.svg`;

            // Ensure 'avatars' bucket exists
            const { data: buckets } = await supabaseAdmin.storage.listBuckets();
            if (!buckets?.find(b => b.name === 'avatars')) {
                console.log("Creating 'avatars' bucket...");
                await supabaseAdmin.storage.createBucket('avatars', { public: true });
            }

            const { error: uploadError } = await supabaseAdmin.storage
                .from('avatars')
                .upload(storagePath, avatarBuffer, {
                    contentType: 'image/svg+xml',
                    upsert: true
                });

            if (uploadError) {
                console.warn('Failed to upload generated avatar to bucket:', uploadError.message);
            } else {
                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from('avatars')
                    .getPublicUrl(storagePath);
                avatarUrl = publicUrl;
                console.log('Generated avatar uploaded successfully:', avatarUrl);

                // Verify upload
                const { data: fileList, error: listError } = await supabaseAdmin.storage.from('avatars').list(userId);
                if (listError) console.error('Error verifying avatar upload:', listError);
                else {
                    const uploadedFile = fileList.find(f => f.name === `seed_avatar_${randomSeed}.svg`);
                    if (uploadedFile) console.log('✅ Avatar file verified in storage.');
                    else console.warn('⚠️ Avatar file NOT found in storage after upload.');
                }
            }
        } catch (avatarErr: any) {
            console.warn('Error generating seed avatar (falling back to default icon):', avatarErr.message);
            // avatarUrl remains null, which triggers the default letter icon in the UI
        }

        await supabaseAdmin
            .schema('jobhunter')
            .from('profiles')
            .update({
                full_name: 'Test Developer',
                avatar_url: avatarUrl,
                professional_headline: 'Senior Fullstack Engineer',
                onboarding_completed: true,
                ghosting_threshold_days: 14,
                theme: 'dark',
                default_ai_model: 'gpt-4o-mini',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        // 3. Insert Jobs
        console.log('Inserting jobs...');

        // Clear existing jobs to avoid duplicates if running multiple times without reset
        await supabaseAdmin.schema('jobhunter').from('jobs').delete().eq('user_id', userId);

        const jobs = [
            {
                user_id: userId,
                title: 'Senior React Developer',
                company: 'Tech Innovators Inc.',
                status: 'Interview',
                employment_type: 'Full-time',
                salary_min: 5000,
                salary_max: 7000,
                location: 'Remote',
                skills_tools: ['React', 'TypeScript', 'Tailwind', 'Next.js'],
                url: 'https://example.com/jobs/react-dev',
                notes: 'Great company culture, mentioned focus on design systems.',
                last_activity: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
                user_id: userId,
                title: 'Python Backend Engineer',
                company: 'DataStream Corp',
                status: 'Applied',
                employment_type: 'Contract',
                salary_min: 4000,
                salary_max: 5500,
                location: 'Bratislava / Hybrid',
                skills_tools: ['Python', 'Django', 'PostgreSQL', 'Docker'],
                url: 'https://example.com/jobs/python-eng',
                notes: "Need to follow up if I don't hear back by Friday.",
                last_activity: new Date(Date.now() - 8 * 86400000).toISOString()
            },
            {
                user_id: userId,
                title: 'UI/UX Designer',
                company: 'Creative Studio',
                status: 'Saved',
                employment_type: 'Full-time',
                salary_min: 3000,
                salary_max: 4500,
                location: 'Remote',
                skills_tools: ['Figma', 'Adobe XD', 'Prototyping'],
                url: 'https://example.com/jobs/designer',
                notes: 'Looks interesting, but salary is a bit low.',
                last_activity: new Date(Date.now() - 3 * 86400000).toISOString()
            },
            {
                user_id: userId,
                title: 'Frontend Developer',
                company: 'Old School Systems',
                status: 'Ghosted',
                employment_type: 'Full-time',
                salary_min: 2500,
                salary_max: 3500,
                location: 'Vienna',
                skills_tools: ['jQuery', 'CSS', 'HTML', 'PHP'],
                url: 'https://example.com/jobs/old-dev',
                notes: 'No response after two follow-up emails.',
                last_activity: new Date(Date.now() - 25 * 86400000).toISOString()
            }
        ];

        const { data: createdJobs, error: jobsError } = await supabaseAdmin
            .schema('jobhunter')
            .from('jobs')
            .insert(jobs)
            .select();

        if (jobsError) throw jobsError;
        console.log(`Created ${createdJobs.length} jobs.`);

        // 4. Insert Activities
        console.log('Inserting activities...');
        const job1 = createdJobs.find(j => j.title === 'Senior React Developer');
        const job4 = createdJobs.find(j => j.title === 'Frontend Developer');

        const activities = [];

        if (job1) {
            activities.push(
                {
                    job_id: job1.id,
                    user_id: userId,
                    event_type: 'Email',
                    category: 'General',
                    content: 'Application sent.',
                    occurred_at: new Date(Date.now() - 15 * 86400000).toISOString()
                },
                {
                    job_id: job1.id,
                    user_id: userId,
                    event_type: 'Email',
                    category: 'Interview',
                    content: 'Invitation for first HR call.',
                    occurred_at: new Date(Date.now() - 12 * 86400000).toISOString()
                }
            );
        }

        if (job4) {
            activities.push(
                {
                    job_id: job4.id,
                    user_id: userId,
                    event_type: 'Email',
                    category: 'Follow-up',
                    content: 'Sent follow-up email #1.',
                    occurred_at: new Date(Date.now() - 30 * 86400000).toISOString()
                }
            );
        }

        if (activities.length > 0) {
            const { error: actError } = await supabaseAdmin
                .schema('jobhunter')
                .from('activities')
                .insert(activities);

            if (actError) throw actError;
            console.log(`Created ${activities.length} activities.`);
        }

        // 5. Insert Sample Resume
        console.log('Inserting sample resume...');
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

        // Ensure 'resumes' bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'resumes')) {
            console.log("Creating 'resumes' bucket...");
            await supabaseAdmin.storage.createBucket('resumes', { public: true });
        }

        let resumeStoragePath = 'mock/path/resume.md';

        try {
            // Generate file from text content directly
            const resumeBuffer = Buffer.from(resumeContent, 'utf-8');
            resumeStoragePath = `${userId}/sample_resume.md`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('resumes')
                .upload(resumeStoragePath, resumeBuffer, {
                    contentType: 'text/markdown',
                    upsert: true
                });

            if (uploadError) {
                console.warn('Failed to upload generated resume to bucket:', uploadError.message);
            } else {
                console.log('Generated resume uploaded successfully to storage.');

                // Verify upload
                const { data: fileList, error: listError } = await supabaseAdmin.storage.from('resumes').list(userId);
                if (listError) console.error('Error verifying resume upload:', listError);
                else {
                    const uploadedFile = fileList.find(f => f.name === 'sample_resume.md');
                    if (uploadedFile) console.log('✅ Resume file verified in storage.');
                    else console.warn('⚠️ Resume file NOT found in storage listing after upload.');
                }
            }
        } catch (err: any) {
            console.warn('Error uploading sample resume:', err.message);
        }

        const { error: docError } = await supabaseAdmin
            .schema('jobhunter')
            .from('documents')
            .insert({
                user_id: userId,
                name: 'Main Resume',
                doc_type: 'Resume',
                storage_path: resumeStoragePath,
                content_text: resumeContent,
                is_primary: true
            });

        if (docError) {
            console.warn('Failed to insert sample resume record:', docError.message);
        } else {
            console.log('Created sample resume record.');
        }

        console.log('✅ Seeding completed successfully!');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seed();
