/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_WS_BASE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
