/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Wallet Connect
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string

  // NFT Contract
  readonly VITE_CONTRACT_MAINNET: string
  readonly VITE_CONTRACT_SEPOLIA: string

  // Soulbound Contract
  readonly VITE_SOULBOUND_CONTRACT_MAINNET: string
  readonly VITE_SOULBOUND_CONTRACT_ADDRESS: string // Sepolia

  // Seed Contract
  readonly VITE_SEED_CONTRACT_ADDRESS: string // Sepolia

  // Revealed Contract
  readonly VITE_REVEALED_CONTRACT_ADDRESS: string // Sepolia

  // Pinata IPFS
  readonly VITE_PINATA_API_KEY: string
  readonly VITE_PINATA_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
