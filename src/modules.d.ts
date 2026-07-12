declare module 'reload' {
  interface ReloadOptions {
    port?: number;
    webSocketServerWaitStart?: boolean;
    route?: string;
    forceWss?: boolean;
    verbose?: boolean;
  }

  interface ReloadServer {
    reload: () => void;
    closeServer: () => Promise<unknown>;
  }

  export default function reload(app: unknown, options?: ReloadOptions): Promise<ReloadServer>;
}

declare module 'pug-multiple-basedirs-plugin' {
  export default function MultipleBasedirsPlugin(options: { paths: string[] }): unknown;
}
