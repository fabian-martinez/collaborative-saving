import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';

export interface TestDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export class TestDatabase {
  private static container: PostgreSqlContainer;
  private static dataSource: DataSource;

  static async start(): Promise<TestDatabaseConfig> {
    if (!this.container) {
      this.container = await new PostgreSqlContainer('postgres:15')
        .withDatabase('testdb')
        .withUsername('test')
        .withPassword('test')
        .withExposedPorts(5432)
        .start();
    }

    return {
      host: this.container.getHost(),
      port: this.container.getPort(),
      username: 'test',
      password: 'test',
      database: 'testdb',
    };
  }

  static async stop(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }

  static async getDataSource(): Promise<DataSource> {
    if (!this.dataSource) {
      const config = await this.start();
      this.dataSource = new DataSource({
        type: 'postgres',
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: config.database,
        entities: ['src/**/*.entity.ts'],
        synchronize: true,
        logging: false,
      });

      await this.dataSource.initialize();
    }

    return this.dataSource;
  }

  static async closeDataSource(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.dataSource = null;
    }
  }
}
