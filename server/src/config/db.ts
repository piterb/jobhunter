import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from current dir or root
const envPath1 = path.join(process.cwd(), '.env.local');
const envPath2 = path.join(process.cwd(), '..', '.env.local');

dotenv.config({ path: envPath1 });
dotenv.config({ path: envPath2 });
dotenv.config(); // fallback to .env

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error(`[DB Config] Failed to load DATABASE_URL.`);
    console.error(`Current CWD: ${process.cwd()}`);
    console.error(`Tried paths: \n  - ${envPath1}\n  - ${envPath2}`);
    throw new Error('DATABASE_URL environment variable is not set');
}

// Config for postgres.js
const sql = postgres(connectionString, {
    // Neon and local PG specific options could go here
    // For example, transform column names from snake_case to camelCase if we wanted,
    // but we'll stick to snake_case to match existing DB schema for now.
    debug: process.env.NODE_ENV === 'development' ? (_connection, _query, _params) => {
        // Optional: log queries in development
        // console.log('Executing query:', query, 'with params:', params);
    } : false,
});

export default sql;
