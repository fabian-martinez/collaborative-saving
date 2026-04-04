import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Always false for production/migrations
  logging: true,
  entities: [path.resolve(__dirname, '../entities/*.entity{.ts,.js}')],
  migrations: [path.resolve(__dirname, './migrations/*{.ts,.js}')],
  subscribers: [],
});
