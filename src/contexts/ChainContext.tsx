import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useReadContract } from 'wagmi'
import { CHAIN_IDS, getContractAddress, PUBLIC_MINT_ERC1155_ABI } from '../contracts/NFTContract'

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

  const [hasAutoSynced, setHasAutoSynced] = useState(false)

  // Read minting status from all chains to auto-sync
  const { data: sepoliaMinting } = useReadContract({
    address: getContractAddress(CHAIN_IDS.SEPOLIA) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: CHAIN_IDS.SEPOLIA,
    query: { enabled: !!getContractAddress(CHAIN_IDS.SEPOLIA) },
  })

  const { data: mainnetMinting } = useReadContract({
    address: getContractAddress(CHAIN_IDS.MAINNET) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: CHAIN_IDS.MAINNET,
    query: { enabled: !!getContractAddress(CHAIN_IDS.MAINNET) },
  })

  const { data: polygonMinting } = useReadContract({
    address: getContractAddress(CHAIN_IDS.POLYGON) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: CHAIN_IDS.POLYGON,
    query: { enabled: !!getContractAddress(CHAIN_IDS.POLYGON) },
  })

  const { data: amoyMinting } = useReadContract({
    address: getContractAddress(CHAIN_IDS.POLYGON_AMOY) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: CHAIN_IDS.POLYGON_AMOY,
    query: { enabled: !!getContractAddress(CHAIN_IDS.POLYGON_AMOY) },
  })

  // Auto-sync to a chain with minting enabled on initial load
  useEffect(() => {
    if (hasAutoSynced) return

    const mintingStatus: Record<ChainId, boolean | undefined> = {
      [CHAIN_IDS.SEPOLIA]: sepoliaMinting as boolean | undefined,
      [CHAIN_IDS.MAINNET]: mainnetMinting as boolean | undefined,
      [CHAIN_IDS.POLYGON]: polygonMinting as boolean | undefined,
      [CHAIN_IDS.POLYGON_AMOY]: amoyMinting as boolean | undefined,
    }

    // Check if we have loaded at least some minting statuses
    const loadedStatuses = Object.values(mintingStatus).filter(s => s !== undefined)
    if (loadedStatuses.length === 0) return

    // If current chain has minting enabled, we're good
    if (mintingStatus[activeChainId] === true) {
      setHasAutoSynced(true)
      return
    }

    // Find a chain with minting enabled
    const chainPriority: ChainId[] = [
      CHAIN_IDS.MAINNET,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.SEPOLIA,
      CHAIN_IDS.POLYGON_AMOY,
    ]

    for (const chainId of chainPriority) {
      if (mintingStatus[chainId] === true && getContractAddress(chainId)) {
        console.log(`Auto-syncing to ${CHAIN_NAMES[chainId]} (minting enabled)`)
        setActiveChainIdState(chainId)
        localStorage.setItem(STORAGE_KEY, chainId.toString())
        setHasAutoSynced(true)
        return
      }
    }

    // No chain with minting enabled found, keep current
    setHasAutoSynced(true)
  }, [sepoliaMinting, mainnetMinting, polygonMinting, amoyMinting, activeChainId, hasAutoSynced])

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
