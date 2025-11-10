declare module 'pg' {
  export interface QueryResult<T> {
    rows: T[];
  }

  export interface PoolClient {
    query<T = any>(queryText: string, values?: any[]): Promise<QueryResult<T>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: any);
    query<T = any>(queryText: string, values?: any[]): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }
}

declare module 'swagger-jsdoc' {
  export interface Options {
    definition: any;
    apis: string[];
  }

  export default function swaggerJSDoc(options: Options): any;
}
