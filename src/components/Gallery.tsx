import { useState, useEffect } from 'react'
import { useReadContracts } from 'wagmi'
import { PUBLIC_MINT_ERC1155_ABI, DEFAULT_CONTRACT_ADDRESS } from '../contracts/NFTContract'

const CONTRACT_ADDRESS = (import.meta.env.VITE_NFT_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS) as `0x${string}`

interface NFTMetadata {
  name: string
  description?: string
  image: string
  attributes?: { trait_type: string; value: string }[]
}

interface NFTItem {
  tokenId: number
  uri: string | null
  metadata: NFTMetadata | null
  loading: boolean
}

function NFTModal({ item, onClose }: { item: NFTItem; onClose: () => void }) {
  if (!item.metadata) return null

  const imageUrl = item.metadata.image.startsWith('ipfs://')
    ? item.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : item.metadata.image

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#1a1a1a] aspect-square flex items-center justify-center">
          <img
            src={imageUrl}
            alt={item.metadata.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-tomorrow text-xl text-black uppercase tracking-wide">
                {item.metadata.name}
              </h2>
              <p className="text-black/40 text-sm">#{item.tokenId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-black/40 hover:text-black text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {item.metadata.description && (
            <div className="mb-6">
              <p className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase mb-2">
                Description
              </p>
              <p className="text-black/80 text-sm">{item.metadata.description}</p>
            </div>
          )}

          {item.metadata.attributes && item.metadata.attributes.length > 0 && (
            <div>
              <p className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase mb-3">
                Attributes
              </p>
              <div className="grid grid-cols-2 gap-2">
                {item.metadata.attributes.map((attr, i) => (
                  <div key={i} className="bg-[#f5f5f5] p-3">
                    <p className="text-black/40 text-[10px] uppercase">{attr.trait_type}</p>
                    <p className="text-black text-sm">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NFTCard({ item, onClick }: { item: NFTItem; onClick: () => void }) {
  if (item.loading) {
    return (
      <div className="bg-[#1a1a1a] aspect-square flex items-center justify-center animate-pulse">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }

  if (!item.metadata) {
    return (
      <div className="bg-[#1a1a1a] aspect-square flex items-center justify-center">
        <p className="text-white/40 text-xs">#{item.tokenId}</p>
      </div>
    )
  }

  const imageUrl = item.metadata.image.startsWith('ipfs://')
    ? item.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : item.metadata.image

  return (
    <div className="cursor-pointer group" onClick={onClick}>
      <div className="bg-[#1a1a1a] aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={item.metadata.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = ''
            (e.target as HTMLImageElement).className = 'hidden'
          }}
        />
      </div>
      <div className="mt-2">
        <p className="text-black text-sm truncate group-hover:text-black/70 transition-colors">
          {item.metadata.name}
        </p>
        <p className="text-black/40 text-[10px]">#{item.tokenId}</p>
      </div>
    </div>
  )
}

export function Gallery() {
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [tokenIds, setTokenIds] = useState<number[]>([])

  // Get total tokens to know how many NFTs exist
  const { data: contractData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: PUBLIC_MINT_ERC1155_ABI,
        functionName: 'totalTokens',
      },
      {
        address: CONTRACT_ADDRESS,
        abi: PUBLIC_MINT_ERC1155_ABI,
        functionName: 'nextTokenId',
      },
    ],
  })

  const totalTokens = contractData?.[0]?.result as bigint | undefined
  const nextTokenId = contractData?.[1]?.result as bigint | undefined

  // Calculate which token IDs to fetch (latest 20)
  useEffect(() => {
    if (!nextTokenId) return
    const total = Number(nextTokenId)
    const count = Math.min(20, total)
    const ids: number[] = []
    for (let i = total - 1; i >= total - count && i >= 0; i--) {
      ids.push(i)
    }
    setTokenIds(ids)
  }, [nextTokenId])

  // Batch fetch URIs for all token IDs
  const { data: uriResults } = useReadContracts({
    contracts: tokenIds.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'uri',
      args: [BigInt(id)],
    })),
  })

  // Fetch metadata when URIs are available
  useEffect(() => {
    if (!uriResults || tokenIds.length === 0) return

    const fetchMetadata = async () => {
      const items: NFTItem[] = tokenIds.map((id, i) => ({
        tokenId: id,
        uri: (uriResults[i]?.result as string) || null,
        metadata: null,
        loading: true,
      }))
      setNfts(items)

      // Fetch metadata for each token in parallel
      const metadataPromises = items.map(async (item) => {
        if (!item.uri) return { ...item, loading: false }

        try {
          const metadataUrl = item.uri.startsWith('ipfs://')
            ? item.uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : item.uri

          const response = await fetch(metadataUrl)
          const metadata = await response.json()
          return { ...item, metadata, loading: false }
        } catch {
          return { ...item, loading: false }
        }
      })

      const results = await Promise.all(metadataPromises)
      setNfts(results)
    }

    fetchMetadata()
  }, [uriResults, tokenIds])

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="text-center py-12">
        <p className="text-black/40">No contract configured</p>
      </div>
    )
  }

  if (!totalTokens || totalTokens === 0n) {
    return (
      <div className="text-center py-12">
        <p className="text-black/40">No artworks minted yet</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-black/10">
        <p className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase">
          Latest Artworks
        </p>
        <p className="text-black/40 text-sm">{totalTokens?.toString()} total</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {nfts.map((item) => (
          <NFTCard
            key={item.tokenId}
            item={item}
            onClick={() => item.metadata && setSelectedNFT(item)}
          />
        ))}
      </div>

      {selectedNFT && (
        <NFTModal item={selectedNFT} onClose={() => setSelectedNFT(null)} />
      )}
    </div>
  )
}
