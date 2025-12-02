/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_NFT_CONTRACT_ADDRESS: string
  readonly VITE_PINATA_API_KEY: string
  readonly VITE_PINATA_SECRET_KEY: string
  // NFT Contract addresses per chain
  readonly VITE_CONTRACT_MAINNET: string
  readonly VITE_CONTRACT_SEPOLIA: string
  readonly VITE_CONTRACT_POLYGON: string
  readonly VITE_CONTRACT_POLYGON_AMOY: string
  // Soulbound Contract addresses per chain
  readonly VITE_SOULBOUND_CONTRACT_MAINNET: string
  readonly VITE_SOULBOUND_CONTRACT_SEPOLIA: string
  readonly VITE_SOULBOUND_CONTRACT_POLYGON: string
  readonly VITE_SOULBOUND_CONTRACT_POLYGON_AMOY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
