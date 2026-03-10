declare const process: {
  env: {
    [key: string]: string | undefined;
    DB_HOST?: string;
    DB_PORT?: string;
    DB_NAME?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    PORT?: string;
    NODE_ENV?: string;
    JWT_SECRET?: string;
  };
  exit(code?: number): never;
  argv: string[];
};

declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};
