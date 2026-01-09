/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_BACKEND_URL: string
  readonly VITE_DEV_PORT: string
  readonly VITE_STORAGE_KEY: string
  readonly VITE_USER_STORAGE_KEY: string
  readonly VITE_ENABLE_HTTPS: string
  readonly VITE_CORS_ORIGIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}