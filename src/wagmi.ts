import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia, mainnet, polygon, polygonAmoy } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'NFT Minting App',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  // Sepolia first as default for testnet NFT contract
  chains: [sepolia, mainnet, polygon, polygonAmoy],
  ssr: false,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
