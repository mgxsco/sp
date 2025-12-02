import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia, mainnet, polygon, polygonAmoy } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'NFT Minting App',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  // Sepolia first as default for testnet NFT contract
  chains: [sepolia, mainnet, polygon, polygonAmoy],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [mainnet.id]: http('https://ethereum-rpc.publicnode.com'),
    [polygon.id]: http('https://polygon-bor-rpc.publicnode.com'),
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
  },
  ssr: false,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
