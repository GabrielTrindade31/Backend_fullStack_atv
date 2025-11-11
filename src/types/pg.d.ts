import { EventEmitter } from 'events';

declare module 'pg' {
  interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
  }

  interface QueryResult<T = any> {
    rows: T[];
    rowCount: number;
  }

  interface PoolClient {
    query<T = any>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    release(): void;
  }

  class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    query<T = any>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }

  export { Pool, PoolConfig, QueryResult, PoolClient };
}
