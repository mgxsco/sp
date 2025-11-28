import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
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
  metadata: NFTMetadata | null
  loading: boolean
  error: boolean
}

function NFTCard({ item }: { item: NFTItem }) {
  if (item.loading) {
    return (
      <div className="bg-[#1a1a1a] aspect-square flex items-center justify-center">
        <p className="text-white/40 text-xs">Loading...</p>
      </div>
    )
  }

  if (item.error || !item.metadata) {
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
    <div className="group">
      <div className="bg-[#1a1a1a] aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={item.metadata.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
      <div className="mt-2">
        <p className="text-black text-sm truncate">{item.metadata.name}</p>
        <p className="text-black/40 text-[10px]">#{item.tokenId}</p>
      </div>
    </div>
  )
}

export function Gallery() {
  const [nfts, setNfts] = useState<NFTItem[]>([])

  const { data: totalTokens } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'totalTokens',
  })

  const { data: nextTokenId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'nextTokenId',
  })

  useEffect(() => {
    if (!nextTokenId || !CONTRACT_ADDRESS) return

    const fetchNFTs = async () => {
      const total = Number(nextTokenId)
      const count = Math.min(20, total)
      const startId = Math.max(0, total - count)

      // Initialize NFT items
      const items: NFTItem[] = []
      for (let i = total - 1; i >= startId; i--) {
        items.push({ tokenId: i, metadata: null, loading: true, error: false })
      }
      setNfts(items)

      // Fetch metadata for each token
      for (let i = 0; i < items.length; i++) {
        const tokenId = items[i].tokenId
        try {
          // Fetch URI from contract
          const response = await fetch(
            `https://eth-sepolia.g.alchemy.com/v2/demo`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                  {
                    to: CONTRACT_ADDRESS,
                    data: `0x0e89341c${tokenId.toString(16).padStart(64, '0')}`,
                  },
                  'latest',
                ],
                id: 1,
              }),
            }
          )

          const data = await response.json()
          if (data.result && data.result !== '0x') {
            // Decode the URI from the response
            const hex = data.result.slice(2)
            const offset = parseInt(hex.slice(0, 64), 16) * 2
            const length = parseInt(hex.slice(offset, offset + 64), 16)
            const uriHex = hex.slice(offset + 64, offset + 64 + length * 2)
            let uri = ''
            for (let j = 0; j < uriHex.length; j += 2) {
              uri += String.fromCharCode(parseInt(uriHex.slice(j, j + 2), 16))
            }

            // Convert IPFS URI
            const metadataUrl = uri.startsWith('ipfs://')
              ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
              : uri

            // Fetch metadata
            const metaResponse = await fetch(metadataUrl)
            const metadata = await metaResponse.json()

            setNfts((prev) =>
              prev.map((nft) =>
                nft.tokenId === tokenId
                  ? { ...nft, metadata, loading: false }
                  : nft
              )
            )
          } else {
            setNfts((prev) =>
              prev.map((nft) =>
                nft.tokenId === tokenId
                  ? { ...nft, loading: false, error: true }
                  : nft
              )
            )
          }
        } catch (err) {
          console.error(`Failed to fetch NFT #${tokenId}:`, err)
          setNfts((prev) =>
            prev.map((nft) =>
              nft.tokenId === tokenId
                ? { ...nft, loading: false, error: true }
                : nft
            )
          )
        }
      }
    }

    fetchNFTs()
  }, [nextTokenId])

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
          <NFTCard key={item.tokenId} item={item} />
        ))}
      </div>
    </div>
  )
}
