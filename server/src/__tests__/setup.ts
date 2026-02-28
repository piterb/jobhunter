import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test file
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// CI does not provide a dedicated server/.env.test, but some modules import DB config eagerly.
// Tests that touch the DB layer replace it with mocks, so a stable placeholder is enough here.
process.env.DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:5432/test?sslmode=disable';
