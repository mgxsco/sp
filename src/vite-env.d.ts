/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Wallet Connect
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string

  // NFT Contract
  readonly VITE_CONTRACT_MAINNET: string  // Mainnet
  readonly VITE_CONTRACT_SEPOLIA: string  // Sepolia

  // Soulbound Contract
  readonly VITE_SOULBOUND_CONTRACT_ADDRESS: string  // Mainnet
  readonly VITE_SOULBOUND_CONTRACT_MAINNET: string  // Mainnet (duplicate)

  // Seed Contract
  readonly VITE_SEED_CONTRACT_ADDRESS: string  // Mainnet

  // Revealed Contract
  readonly VITE_REVEALED_CONTRACT_ADDRESS: string  // Mainnet

  // Pinata IPFS
  readonly VITE_PINATA_API_KEY: string
  readonly VITE_PINATA_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
