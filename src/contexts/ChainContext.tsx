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

export function ChainProvider({ children }: { children: ReactNode }) {
  const [activeChainId, setActiveChainId] = useState<ChainId>(CHAIN_IDS.SEPOLIA)

  // Read minting status from all chains to auto-detect active chain
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

  // Auto-detect chain with minting enabled
  useEffect(() => {
    const mintingStatus: Record<ChainId, boolean | undefined> = {
      [CHAIN_IDS.SEPOLIA]: sepoliaMinting as boolean | undefined,
      [CHAIN_IDS.MAINNET]: mainnetMinting as boolean | undefined,
      [CHAIN_IDS.POLYGON]: polygonMinting as boolean | undefined,
      [CHAIN_IDS.POLYGON_AMOY]: amoyMinting as boolean | undefined,
    }

    // Find the chain with minting enabled (priority: Mainnet > Polygon > Sepolia > Amoy)
    const chainPriority: ChainId[] = [
      CHAIN_IDS.MAINNET,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.SEPOLIA,
      CHAIN_IDS.POLYGON_AMOY,
    ]

    for (const chainId of chainPriority) {
      if (mintingStatus[chainId] === true && getContractAddress(chainId)) {
        if (activeChainId !== chainId) {
          setActiveChainId(chainId)
        }
        return
      }
    }
  }, [sepoliaMinting, mainnetMinting, polygonMinting, amoyMinting, activeChainId])

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
