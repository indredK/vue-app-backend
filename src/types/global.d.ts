declare namespace Express {
  export interface Request {
    params: any;
    query: any;
    body: any;
    headers: any;
  }
}

declare namespace NodeJS {
  export interface ProcessEnv {
    [key: string]: string | undefined;
  }
}
