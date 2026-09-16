import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file (supports running from root or backend directory)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Always false for production/migrations
  logging: true,
  entities: [path.resolve(__dirname, './entities/!(*.d).{ts,js}')],
  migrations: [path.resolve(__dirname, './migrations/!(*.d).{ts,js}')],
  subscribers: [],
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
