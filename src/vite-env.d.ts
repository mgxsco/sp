/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_NFT_CONTRACT_ADDRESS: string
  readonly VITE_PINATA_API_KEY: string
  readonly VITE_PINATA_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
