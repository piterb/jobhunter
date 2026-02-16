import sql from '../config/db';
import fs from 'fs-extra';
import path from 'path';

const MIGRATIONS_DIR = path.join(process.cwd(), '..', 'db', 'migrations');

async function migrate() {
    console.log('🔄 Running migrations...');

    try {
        // 1. Ensure migrations table exists
        await sql`
            CREATE TABLE IF NOT EXISTS jobhunter_schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT NOW()
            )
        `;

        // 2. Read migration files
        const files = await fs.readdir(MIGRATIONS_DIR);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

        for (const file of sqlFiles) {
            const version = file.split('_')[0];

            // Check if already applied
            const [alreadyApplied] = await sql`
                SELECT version FROM jobhunter_schema_migrations WHERE version = ${version}
            `;

            if (alreadyApplied) {
                console.log(`⏩ Skipping version ${version} (already applied)`);
                continue;
            }

            console.log(`🚀 Applying version ${version} (${file})...`);
            const content = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');

            // Run migration in a transaction
            await sql.begin(async (tx) => {
                await tx.unsafe(content);
                await tx.unsafe('INSERT INTO jobhunter_schema_migrations (version) VALUES ($1)', [version]);
            });

            console.log(`✅ Applied version ${version}`);
        }

        console.log('✨ All migrations completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
