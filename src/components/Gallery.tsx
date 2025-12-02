import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { PUBLIC_MINT_ERC1155_ABI, DEFAULT_CONTRACT_ADDRESS } from '../contracts/NFTContract'
import { SOULBOUND_MINT_ERC1155_ABI, DEFAULT_SOULBOUND_CONTRACT_ADDRESS } from '../contracts/SoulboundNFTContract'

const NFT_CONTRACT_ADDRESS = (import.meta.env.VITE_NFT_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS) as `0x${string}`
const SOULBOUND_CONTRACT_ADDRESS = (import.meta.env.VITE_SOULBOUND_CONTRACT_ADDRESS || DEFAULT_SOULBOUND_CONTRACT_ADDRESS) as `0x${string}`

interface NFTMetadata {
  name: string
  description?: string
  image: string
  attributes?: { trait_type: string; value: string }[]
}

interface NFTItem {
  tokenId: number
  contractType: 'mint' | 'soulbound'
  contractAddress: string
  uri: string
  metadata?: NFTMetadata
  creator?: string
  isOwned?: boolean
}

export function Gallery() {
  const { address } = useAccount()
  const chainId = useChainId()
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [burningTokenId, setBurningTokenId] = useState<number | null>(null)

  // Get total tokens from both contracts
  const { data: mintTotalTokens } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'totalTokens',
  })

  const { data: soulboundTotalTokens } = useReadContract({
    address: SOULBOUND_CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'totalTokens',
  })

  // Burn functionality
  const { writeContract, data: burnHash, isPending: isBurning } = useWriteContract()
  const { isLoading: isBurnConfirming, isSuccess: isBurnSuccess } = useWaitForTransactionReceipt({
    hash: burnHash,
  })

  const handleBurn = async (tokenId: number) => {
    if (!SOULBOUND_CONTRACT_ADDRESS) return
    setBurningTokenId(tokenId)
    writeContract({
      address: SOULBOUND_CONTRACT_ADDRESS,
      abi: SOULBOUND_MINT_ERC1155_ABI,
      functionName: 'burn',
      args: [BigInt(tokenId)],
    })
  }

  // Fetch all NFT data
  useEffect(() => {
    const fetchNFTs = async () => {
      setLoading(true)
      const allNFTs: NFTItem[] = []

      // Fetch from Mint contract
      if (NFT_CONTRACT_ADDRESS && mintTotalTokens !== undefined) {
        for (let i = 0; i < Number(mintTotalTokens); i++) {
          allNFTs.push({
            tokenId: i,
            contractType: 'mint',
            contractAddress: NFT_CONTRACT_ADDRESS,
            uri: '',
          })
        }
      }

      // Fetch from Soulbound contract
      if (SOULBOUND_CONTRACT_ADDRESS && soulboundTotalTokens !== undefined) {
        for (let i = 0; i < Number(soulboundTotalTokens); i++) {
          allNFTs.push({
            tokenId: i,
            contractType: 'soulbound',
            contractAddress: SOULBOUND_CONTRACT_ADDRESS,
            uri: '',
          })
        }
      }

      setNfts(allNFTs)
      setLoading(false)
    }

    fetchNFTs()
  }, [mintTotalTokens, soulboundTotalTokens])

  // Reset burning state on success
  useEffect(() => {
    if (isBurnSuccess) {
      setBurningTokenId(null)
      setSelectedNFT(null)
      // Refresh would happen automatically through contract state changes
    }
  }, [isBurnSuccess])

  const getExplorerUrl = (contractAddr: string, tokenId: number) => {
    switch (chainId) {
      case 11155111:
        return `https://sepolia.etherscan.io/token/${contractAddr}?a=${tokenId}`
      case 137:
        return `https://polygonscan.com/token/${contractAddr}?a=${tokenId}`
      case 80002:
        return `https://amoy.polygonscan.com/token/${contractAddr}?a=${tokenId}`
      default:
        return `https://etherscan.io/token/${contractAddr}?a=${tokenId}`
    }
  }

  const hasAnyContracts = NFT_CONTRACT_ADDRESS || SOULBOUND_CONTRACT_ADDRESS

  if (!hasAnyContracts) {
    return (
      <div className="text-center py-20">
        <p className="font-tektur text-black/40 text-sm">No contracts configured</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="font-tektur text-black/40 text-sm">Loading gallery...</p>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-tektur text-black/40 text-sm">No NFTs minted yet</p>
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="flex gap-8 mb-12">
        {NFT_CONTRACT_ADDRESS && (
          <div className="flex items-center gap-2">
            <span className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase">Mint:</span>
            <span className="font-tektur text-black/80 text-sm">{mintTotalTokens?.toString() ?? '0'}</span>
          </div>
        )}
        {SOULBOUND_CONTRACT_ADDRESS && (
          <div className="flex items-center gap-2">
            <span className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase">Soulbound:</span>
            <span className="font-tektur text-black/80 text-sm">{soulboundTotalTokens?.toString() ?? '0'}</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <NFTCard
            key={`${nft.contractType}-${nft.tokenId}`}
            nft={nft}
            address={address}
            onSelect={setSelectedNFT}
            onBurn={handleBurn}
            isBurning={burningTokenId === nft.tokenId && (isBurning || isBurnConfirming)}
          />
        ))}
      </div>

      {/* Modal */}
      {selectedNFT && (
        <NFTModal
          nft={selectedNFT}
          onClose={() => setSelectedNFT(null)}
          onBurn={handleBurn}
          isBurning={burningTokenId === selectedNFT.tokenId && (isBurning || isBurnConfirming)}
          getExplorerUrl={getExplorerUrl}
        />
      )}
    </div>
  )
}

// NFT Card Component
function NFTCard({
  nft,
  address,
  onSelect,
  onBurn,
  isBurning,
}: {
  nft: NFTItem
  address?: string
  onSelect: (nft: NFTItem) => void
  onBurn: (tokenId: number) => void
  isBurning: boolean
}) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [isOwned, setIsOwned] = useState(false)

  const abi = nft.contractType === 'soulbound' ? SOULBOUND_MINT_ERC1155_ABI : PUBLIC_MINT_ERC1155_ABI

  const { data: uri } = useReadContract({
    address: nft.contractAddress as `0x${string}`,
    abi,
    functionName: 'uri',
    args: [BigInt(nft.tokenId)],
  })

  const { data: balance } = useReadContract({
    address: nft.contractAddress as `0x${string}`,
    abi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`, BigInt(nft.tokenId)] : undefined,
  })

  const { data: creator } = useReadContract({
    address: nft.contractAddress as `0x${string}`,
    abi,
    functionName: 'tokenCreator',
    args: [BigInt(nft.tokenId)],
  })

  // Fetch metadata from IPFS
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!uri) return

      try {
        const ipfsUrl = uri.startsWith('ipfs://')
          ? `https://gateway.pinata.cloud/ipfs/${uri.replace('ipfs://', '')}`
          : uri

        const response = await fetch(ipfsUrl)
        const data = await response.json()

        // Convert image URL
        if (data.image?.startsWith('ipfs://')) {
          data.image = `https://gateway.pinata.cloud/ipfs/${data.image.replace('ipfs://', '')}`
        }

        setMetadata(data)
      } catch (err) {
        console.error('Failed to fetch metadata:', err)
      }
    }

    fetchMetadata()
  }, [uri])

  // Check ownership
  useEffect(() => {
    if (balance !== undefined) {
      setIsOwned(balance > 0n)
    }
  }, [balance])

  return (
    <div
      className="group cursor-pointer"
      onClick={() => onSelect({ ...nft, metadata: metadata || undefined, creator: creator as string, isOwned })}
    >
      <div className="aspect-square bg-black/5 overflow-hidden mb-3">
        {metadata?.image ? (
          <img
            src={metadata.image}
            alt={metadata.name || `Token #${nft.tokenId}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-tektur text-black/20 text-sm">Loading...</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-tektur text-black text-sm truncate">
            {metadata?.name || `Token #${nft.tokenId}`}
          </p>
          <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">
            {nft.contractType === 'soulbound' ? 'Soulbound' : 'Transferable'} #{nft.tokenId}
          </p>
        </div>

        {isOwned && nft.contractType === 'soulbound' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onBurn(nft.tokenId)
            }}
            disabled={isBurning}
            className="font-tomorrow text-[9px] tracking-[0.15em] text-black/30 hover:text-red-600 transition-colors duration-300 uppercase shrink-0"
          >
            {isBurning ? '...' : 'Burn'}
          </button>
        )}
      </div>
    </div>
  )
}

// NFT Modal Component
function NFTModal({
  nft,
  onClose,
  onBurn,
  isBurning,
  getExplorerUrl,
}: {
  nft: NFTItem
  onClose: () => void
  onBurn: (tokenId: number) => void
  isBurning: boolean
  getExplorerUrl: (contractAddr: string, tokenId: number) => string
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-lime max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="aspect-square bg-black/5">
          {nft.metadata?.image ? (
            <img
              src={nft.metadata.image}
              alt={nft.metadata.name || `Token #${nft.tokenId}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-tektur text-black/20">No image</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-8 space-y-6">
          <div>
            <h2 className="font-tomorrow text-xl text-black mb-2">
              {nft.metadata?.name || `Token #${nft.tokenId}`}
            </h2>
            {nft.metadata?.description && (
              <p className="font-tektur text-black/60 text-sm leading-relaxed">
                {nft.metadata.description}
              </p>
            )}
          </div>

          <div className="space-y-0">
            {[
              { label: 'Token ID', value: `#${nft.tokenId}` },
              { label: 'Type', value: nft.contractType === 'soulbound' ? 'Soulbound' : 'Transferable' },
              { label: 'Creator', value: nft.creator ? `${nft.creator.slice(0, 6)}...${nft.creator.slice(-4)}` : '—' },
              { label: 'Owned', value: nft.isOwned ? 'Yes' : 'No' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-black/10">
                <span className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase">{item.label}</span>
                <span className="font-tektur text-black/80 text-sm">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Attributes */}
          {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
            <div>
              <p className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase mb-4">Attributes</p>
              <div className="grid grid-cols-2 gap-3">
                {nft.metadata.attributes.map((attr, i) => (
                  <div key={i} className="bg-black/5 p-3">
                    <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">{attr.trait_type}</p>
                    <p className="font-tektur text-black text-sm">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <a
              href={getExplorerUrl(nft.contractAddress, nft.tokenId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link font-tomorrow text-[10px] tracking-[0.15em] uppercase"
            >
              View on Explorer
            </a>

            {nft.isOwned && nft.contractType === 'soulbound' && (
              <button
                onClick={() => onBurn(nft.tokenId)}
                disabled={isBurning}
                className="font-tomorrow text-[10px] tracking-[0.15em] text-red-600 hover:text-red-500 transition-colors duration-300 uppercase"
              >
                {isBurning ? 'Burning...' : 'Burn Token'}
              </button>
            )}

            <button
              onClick={onClose}
              className="font-tomorrow text-[10px] tracking-[0.15em] text-black/50 hover:text-black transition-colors duration-300 uppercase ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
