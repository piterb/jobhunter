import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test file
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
