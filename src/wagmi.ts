import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia, polygon, polygonMumbai } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'NFT Minting App',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  chains: [mainnet, sepolia, polygon, polygonMumbai],
  ssr: false,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
