import { createContext, useContext, useState, ReactNode } from 'react'
import { CHAIN_IDS } from '../contracts/NFTContract'

type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS]

interface ChainContextType {
  activeChainId: ChainId
  setActiveChainId: (chainId: ChainId) => void
  chainName: string
}

const CHAIN_NAMES: Record<ChainId, string> = {
  [CHAIN_IDS.MAINNET]: 'Ethereum',
  [CHAIN_IDS.SEPOLIA]: 'Sepolia',
  [CHAIN_IDS.POLYGON]: 'Polygon',
  [CHAIN_IDS.POLYGON_AMOY]: 'Amoy',
}

const ChainContext = createContext<ChainContextType | null>(null)

const STORAGE_KEY = 'mgxs-active-chain'

export function ChainProvider({ children }: { children: ReactNode }) {
  const [activeChainId, setActiveChainIdState] = useState<ChainId>(() => {
    // Load from localStorage on init
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = parseInt(stored, 10)
        if (Object.values(CHAIN_IDS).includes(parsed as ChainId)) {
          return parsed as ChainId
        }
      }
    }
    return CHAIN_IDS.SEPOLIA // Default to Sepolia
  })

  const setActiveChainId = (chainId: ChainId) => {
    setActiveChainIdState(chainId)
    localStorage.setItem(STORAGE_KEY, chainId.toString())
  }

  const chainName = CHAIN_NAMES[activeChainId] || 'Unknown'

  return (
    <ChainContext.Provider value={{ activeChainId, setActiveChainId, chainName }}>
      {children}
    </ChainContext.Provider>
  )
}

export function useActiveChain() {
  const context = useContext(ChainContext)
  if (!context) {
    throw new Error('useActiveChain must be used within a ChainProvider')
  }
  return context
}

export { CHAIN_IDS, CHAIN_NAMES }
export type { ChainId }
