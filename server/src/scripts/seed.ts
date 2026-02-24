import sql from '../config/db';
import { storage, BUCKETS, ensureBuckets } from '../config/storage';
import axios from 'axios';

const MOCK_USER = {
    id: 'd7b6f3b0-1234-4a5b-8c9d-1234567890ab',
    email: 'dev@jobhunter.local',
};

const seed = async () => {
    console.log('🌱 Seeding database for new architecture...');
    await ensureBuckets();

    try {
        // 1. Create Dev Profile if not exists
        console.log('Creating/Updating dev profile...');
        let targetUserId = MOCK_USER.id;

        // Generate random avatar via DiceBear
        let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=dev-${Date.now()}`;
        try {
            const styles = ['avataaars', 'bottts', 'pixel-art', 'lorelei', 'notionists'];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            const randomSeed = Math.random().toString(36).substring(7);
            const dicebearUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;

            const response = await axios.get(dicebearUrl, { responseType: 'arraybuffer' });
            const filePath = `${MOCK_USER.id}/seed_avatar.svg`;

            const isLocal = process.env.NODE_ENV === 'development';
            await storage.bucket(BUCKETS.AVATARS).file(filePath).save(response.data, {
                contentType: 'image/svg+xml',
                resumable: false,
                metadata: {
                    contentType: 'image/svg+xml',
                    contentDisposition: 'inline',
                },
                ...(isLocal ? {} : { public: true })
            });

            const gcsEndpoint = process.env.GCS_ENDPOINT || 'http://127.0.0.1:4443';
            avatarUrl = isLocal
                ? `${gcsEndpoint}/download/storage/v1/b/${BUCKETS.AVATARS}/o/${encodeURIComponent(filePath)}?alt=media`
                : `https://storage.googleapis.com/${BUCKETS.AVATARS}/${filePath}`;

            console.log('Avatar uploaded to GCS:', avatarUrl);
        } catch (err) {
            console.warn('Failed to upload seed avatar, using direct URL:', err);
        }

        const [existingBySubject] = await sql<{ id: string }[]>`
            SELECT id
            FROM profiles
            WHERE auth_subject = ${MOCK_USER.id}
            LIMIT 1
        `;

        const [existingByEmail] = await sql<{ id: string }[]>`
            SELECT id
            FROM profiles
            WHERE lower(email) = lower(${MOCK_USER.email})
            LIMIT 1
        `;

        targetUserId = existingBySubject?.id || existingByEmail?.id || MOCK_USER.id;

        const [updatedProfile] = await sql<{ id: string }[]>`
            UPDATE profiles
            SET
                email = ${MOCK_USER.email},
                auth_subject = ${MOCK_USER.id},
                full_name = 'Test Developer',
                avatar_url = ${avatarUrl},
                professional_headline = 'Senior Software Engineer',
                ghosting_threshold_days = 14,
                updated_at = NOW()
            WHERE id = ${targetUserId}
            RETURNING id
        `;

        if (!updatedProfile) {
            await sql`
                INSERT INTO profiles (id, email, auth_subject, full_name, avatar_url, professional_headline, ghosting_threshold_days)
                VALUES (${MOCK_USER.id}, ${MOCK_USER.email}, ${MOCK_USER.id}, 'Test Developer', ${avatarUrl}, 'Senior Software Engineer', 14)
            `;
            targetUserId = MOCK_USER.id;
        }

        // 2. Insert Sample Jobs
        console.log('Inserting sample jobs...');

        // Clear existing jobs for this user
        await sql`DELETE FROM jobs WHERE user_id = ${targetUserId}`;

        const jobs = [
            {
                user_id: targetUserId,
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
                last_activity: new Date(Date.now() - 86400000).toISOString()
            },
            {
                user_id: targetUserId,
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
            }
        ];

        for (const job of jobs) {
            await sql`
                INSERT INTO jobs (user_id, title, company, status, employment_type, salary_min, salary_max, location, skills_tools, url, notes, last_activity)
                VALUES (${job.user_id}, ${job.title}, ${job.company}, ${job.status}, ${job.employment_type}, ${job.salary_min}, ${job.salary_max}, ${job.location}, ${job.skills_tools}, ${job.url}, ${job.notes}, ${job.last_activity})
            `;
        }

        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seed();
