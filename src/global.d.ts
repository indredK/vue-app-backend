declare const require: NodeRequire;
declare const __dirname: string;
declare const __filename: string;
declare const module: NodeModule;
declare const process: NodeJS.Process;

interface NodeRequire {
  (id: string): any;
  resolve(id: string): string;
  cache: NodeModuleCache;
  extensions: NodeExtensions;
  main: NodeModule | undefined;
}

interface NodeModuleCache {
  [id: string]: NodeModule;
}

interface NodeExtensions {
  [key: string]: (module: NodeModule, filename: string) => any;
}

interface NodeModule {
  id: string;
  exports: any;
  parent: NodeModule | null;
  filename: string | null;
  loaded: boolean;
  children: NodeModule[];
  paths: string[];
}

declare global {
  namespace Express {
    interface Request {
      headers: {
        [key: string]: string | string[] | undefined;
        authorization?: string;
      };
    }
  }
}

export {};
