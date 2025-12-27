import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { useSeed } from '../hooks/useSeed'
import { useRevealed } from '../hooks/useRevealed'
import { useGeminiGenerate, base64ToFile, UseGeminiGenerateReturn } from '../hooks/useGeminiGenerate'
import { useIPFSUpload } from '../hooks/useIPFSUpload'

type SeedMintingSubTab = 'mint' | 'seed'

export function SeedMintingSection() {
  const [activeSubTab, setActiveSubTab] = useState<SeedMintingSubTab>('mint')

  // Lift Gemini state to parent so it persists across tab switches
  const geminiState = useGeminiGenerate()

  const subTabs: { id: SeedMintingSubTab; label: string }[] = [
    { id: 'mint', label: 'MINT' },
    { id: 'seed', label: 'SEED' },
  ]

  return (
    <div>
      {/* Subtabs */}
      <div className="flex items-center gap-1 mb-8">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 font-tomorrow text-[10px] tracking-[0.1em] border transition-all duration-200 ${
              activeSubTab === tab.id
                ? 'bg-black text-white border-black'
                : 'bg-white text-black/50 border-black/20 hover:border-black/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSubTab === 'mint' && <SeedMintSection />}
      {activeSubTab === 'seed' && <SeedRevealSection geminiState={geminiState} />}

      {/* Gallery always visible */}
      <div className="mt-8">
        <SeedMintingGallery />
      </div>
    </div>
  )
}

// ============ Seed Mint Section ============
function SeedMintSection() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const {
    mintSeed,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
    contractAddress,
    mintPrice,
    totalMinted,
    mintingEnabled,
    remainingSupply,
    seedBalance,
  } = useSeed()

  const isLoading = isPending || isConfirming

  const getExplorerUrl = (txHash: string) => {
    switch (chainId) {
      case 11155111: return `https://sepolia.etherscan.io/tx/${txHash}`
      case 137: return `https://polygonscan.com/tx/${txHash}`
      case 80002: return `https://amoy.polygonscan.com/tx/${txHash}`
      default: return `https://etherscan.io/tx/${txHash}`
    }
  }

  return (
    <div className="border border-black/10 p-8 bg-white">
      <h3 className="font-tomorrow text-lg mb-6">Mint Seed</h3>
      <p className="text-black/50 text-sm mb-8">
        Mint a Seed token to participate in the reveal experience.
        Burn your seed to generate AI artwork and mint your favorite.
      </p>

      {/* Stats */}
      {contractAddress && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-black/5">
            <p className="font-tomorrow text-[10px] text-black/40 uppercase mb-1">Minted</p>
            <p className="font-tektur text-lg">{totalMinted?.toString() || '0'}</p>
          </div>
          <div className="text-center p-4 bg-black/5">
            <p className="font-tomorrow text-[10px] text-black/40 uppercase mb-1">Remaining</p>
            <p className="font-tektur text-lg">{remainingSupply?.toString() || '0'}</p>
          </div>
          <div className="text-center p-4 bg-black/5">
            <p className="font-tomorrow text-[10px] text-black/40 uppercase mb-1">Your Seeds</p>
            <p className="font-tektur text-lg">{seedBalance?.toString() || '0'}</p>
          </div>
        </div>
      )}

      {/* Mint Button */}
      {!isConnected ? (
        <p className="text-black/40 text-sm">Connect wallet to mint</p>
      ) : !contractAddress ? (
        <p className="text-black/40 text-sm">Contract not configured</p>
      ) : !mintingEnabled ? (
        <p className="text-black/40 text-sm">Minting is closed</p>
      ) : remainingSupply === 0n ? (
        <p className="text-black/40 text-sm">Sold out</p>
      ) : (
        <>
          <button
            onClick={() => mintSeed()}
            disabled={isLoading}
            className="w-full bg-lime text-black font-tomorrow text-sm py-4 hover:bg-lime/80 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              isPending ? 'Confirm in wallet...' : 'Minting...'
            ) : (
              `Mint Seed${mintPrice && mintPrice > 0n ? ` (${formatEther(mintPrice)} ETH)` : ' (Free)'}`
            )}
          </button>

          {isSuccess && hash && (
            <div className="mt-6 p-4 bg-lime/20">
              <p className="font-tomorrow text-sm mb-2">Seed Minted!</p>
              <a
                href={getExplorerUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-black/60 hover:text-black underline"
              >
                View Transaction
              </a>
              <button
                onClick={reset}
                className="block mt-2 text-sm text-black/40 hover:text-black"
              >
                Mint Another
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-red-600 text-sm">
              {(error as Error)?.message || 'Error minting seed'}
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ============ Seed Reveal Section ============
function SeedRevealSection({ geminiState }: { geminiState: UseGeminiGenerateReturn }) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [lastBurnHash, setLastBurnHash] = useState<string | null>(null)

  const {
    burnSeed,
    isPending: isBurnPending,
    isConfirming: isBurnConfirming,
    isSuccess: isBurnSuccess,
    hash: burnHash,
    error: burnError,
    seedBalance,
    canBurn,
    pendingReveals,
  } = useSeed()

  const {
    mintRevealed,
    isPending: isMintPending,
    isConfirming: isMintConfirming,
    isSuccess: isMintSuccess,
    hash: mintHash,
    error: mintError,
  } = useRevealed()

  const {
    generateImage,
    currentImage,
    attemptsRemaining,
    isGenerating,
    error: generateError,
    basePrompt,
    setBasePrompt,
    resetAttempts,
    claimSession,
    hasSession,
  } = geminiState

  const [isClaimingSession, setIsClaimingSession] = useState(false)

  // Reset attempts when burn is successful
  useEffect(() => {
    if (isBurnSuccess && burnHash && burnHash !== lastBurnHash) {
      setLastBurnHash(burnHash)
      resetAttempts(burnHash)
    }
  }, [isBurnSuccess, burnHash, lastBurnHash, resetAttempts])

  const { uploadToIPFS, isUploading } = useIPFSUpload()

  const hasPendingReveal = pendingReveals !== undefined && pendingReveals > 0n
  const isBurning = isBurnPending || isBurnConfirming
  const isMinting = isMintPending || isMintConfirming || isUploading

  const getExplorerUrl = (txHash: string) => {
    switch (chainId) {
      case 11155111: return `https://sepolia.etherscan.io/tx/${txHash}`
      case 137: return `https://polygonscan.com/tx/${txHash}`
      case 80002: return `https://amoy.polygonscan.com/tx/${txHash}`
      default: return `https://etherscan.io/tx/${txHash}`
    }
  }

  const handleBurn = async () => {
    await burnSeed()
  }

  const handleGenerate = async () => {
    await generateImage()
  }

  const handleClaimSession = async () => {
    setIsClaimingSession(true)
    try {
      await claimSession()
    } finally {
      setIsClaimingSession(false)
    }
  }

  const handleMintRevealed = async () => {
    if (!currentImage || !nftName) return

    try {
      // Convert base64 to file and upload to IPFS
      const file = base64ToFile(currentImage.imageData, `${nftName.replace(/\s+/g, '_')}.png`)
      const { metadataUrl } = await uploadToIPFS(file, {
        name: nftName,
        description: nftDescription || `Generated with prompt: ${currentImage.prompt}`,
        attributes: [
          { trait_type: 'Generator', value: 'Gemini' },
          { trait_type: 'Prompt', value: currentImage.prompt },
        ],
      })

      await mintRevealed(metadataUrl)
    } catch (err) {
      console.error('Failed to mint revealed:', err)
    }
  }

  return (
    <div className="border border-black/10 p-8 bg-white">
      <h3 className="font-tomorrow text-lg mb-2">Reveal Your Seed</h3>
      <p className="text-black/50 text-sm mb-8">
        Burn your seed to unlock 10 AI image generation attempts. Pick your favorite to mint.
      </p>

      {/* Status */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-black/5">
          <p className="font-tomorrow text-[10px] text-black/40 uppercase mb-1">Your Seeds</p>
          <p className="font-tektur text-lg">{seedBalance?.toString() || '0'}</p>
        </div>
        <div className="text-center p-4 bg-black/5">
          <p className="font-tomorrow text-[10px] text-black/40 uppercase mb-1">Pending Reveals</p>
          <p className="font-tektur text-lg">{pendingReveals?.toString() || '0'}</p>
        </div>
        <div className="text-center p-4 bg-black/5">
          <p className="font-tomorrow text-[10px] text-black/40 uppercase mb-1">Attempts Left</p>
          <p className="font-tektur text-lg">{attemptsRemaining}</p>
        </div>
      </div>

      {!isConnected ? (
        <p className="text-black/40 text-sm">Connect wallet to continue</p>
      ) : !hasPendingReveal && seedBalance && seedBalance > 0n ? (
        // Step 1: Burn Seed
        <div>
          <h4 className="font-tomorrow text-sm mb-4">Step 1: Burn Your Seed</h4>
          <button
            onClick={handleBurn}
            disabled={isBurning || !canBurn}
            className="w-full bg-black text-white font-tomorrow text-sm py-4 hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {isBurning ? (isBurnPending ? 'Confirm in wallet...' : 'Burning...') : 'Burn Seed'}
          </button>
          {burnError && (
            <p className="mt-4 text-red-600 text-sm">{(burnError as Error)?.message}</p>
          )}
        </div>
      ) : hasPendingReveal ? (
        // Step 2: Generate & Pick
        <div>
          <h4 className="font-tomorrow text-sm mb-4">Step 2: Generate Images ({attemptsRemaining} attempts left)</h4>

          {/* Claim Session button if user has attempts but no session */}
          {!hasSession && attemptsRemaining > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-3">
                Sign once to activate your generation session.
              </p>
              <button
                onClick={handleClaimSession}
                disabled={isClaimingSession}
                className="w-full bg-black text-white font-tomorrow text-sm py-3 hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                {isClaimingSession ? 'Signing...' : 'Activate Session'}
              </button>
            </div>
          )}

          {/* Prompt Input */}
          <div className="mb-4">
            <label className="block font-tomorrow text-[10px] text-black/40 uppercase mb-2">Prompt</label>
            <input
              type="text"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="Enter generation prompt..."
              className="w-full p-3 border border-black/20 text-sm font-tektur"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || attemptsRemaining <= 0 || !hasSession}
            className="w-full bg-lime text-black font-tomorrow text-sm py-4 hover:bg-lime/80 transition-colors disabled:opacity-50 mb-6"
          >
            {isGenerating ? 'Generating...' : `Generate Image (${attemptsRemaining} left)`}
          </button>

          {generateError && (
            <p className="mb-4 text-red-600 text-sm">{generateError}</p>
          )}

          {/* Current Generated Image */}
          {currentImage && (
            <div className="mb-6">
              <h5 className="font-tomorrow text-[10px] text-black/40 uppercase mb-4">Generated Image</h5>
              <div className="max-w-md mx-auto">
                <img
                  src={currentImage.imageData}
                  alt="Generated"
                  className="w-full aspect-square object-cover border border-black/10"
                />
              </div>
            </div>
          )}

          {/* Mint Current Image */}
          {currentImage && (
            <div className="border-t border-black/10 pt-6">
              <h4 className="font-tomorrow text-sm mb-4">Step 3: Mint This Image</h4>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block font-tomorrow text-[10px] text-black/40 uppercase mb-2">Name *</label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    placeholder="Enter NFT name..."
                    className="w-full p-3 border border-black/20 text-sm font-tektur"
                  />
                </div>
                <div>
                  <label className="block font-tomorrow text-[10px] text-black/40 uppercase mb-2">Description</label>
                  <textarea
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full p-3 border border-black/20 text-sm font-tektur resize-none"
                  />
                </div>
              </div>
              <button
                onClick={handleMintRevealed}
                disabled={isMinting || !nftName}
                className="w-full bg-lime text-black font-tomorrow text-sm py-4 hover:bg-lime/80 transition-colors disabled:opacity-50"
              >
                {isMinting ? (
                  isUploading ? 'Uploading to IPFS...' : isMintPending ? 'Confirm in wallet...' : 'Minting...'
                ) : (
                  'Mint NFT'
                )}
              </button>

              {isMintSuccess && mintHash && (
                <div className="mt-6 p-4 bg-lime/20">
                  <p className="font-tomorrow text-sm mb-2">NFT Minted!</p>
                  <a
                    href={getExplorerUrl(mintHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-black/60 hover:text-black underline"
                  >
                    View Transaction
                  </a>
                </div>
              )}

              {mintError && (
                <p className="mt-4 text-red-600 text-sm">{(mintError as Error)?.message}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-black/40 text-sm">
          You need a Seed token to continue. Go to the MINT tab to get one.
        </p>
      )}
    </div>
  )
}

// ============ Seed Minting Gallery ============
interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: { trait_type: string; value: string }[]
}

interface GalleryNFT {
  tokenId: number
  uri: string
  metadata: NFTMetadata | null
  creator: string
  isLoading: boolean
  error: string | null
}

function SeedMintingGallery() {
  const { totalTokens, nextTokenId, contractAddress } = useRevealed()
  const [nfts, setNfts] = useState<GalleryNFT[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNft, setSelectedNft] = useState<GalleryNFT | null>(null)

  // Fetch all NFT data
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!nextTokenId || !contractAddress) {
        setIsLoading(false)
        return
      }

      const tokenCount = Number(nextTokenId)
      if (tokenCount === 0) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const nftPromises: Promise<GalleryNFT>[] = []

      for (let i = 0; i < tokenCount; i++) {
        nftPromises.push(fetchSingleNFT(i, contractAddress))
      }

      const results = await Promise.all(nftPromises)
      setNfts(results.reverse()) // Show newest first
      setIsLoading(false)
    }

    fetchNFTs()
  }, [nextTokenId, contractAddress])

  const fetchSingleNFT = async (tokenId: number, contract: string): Promise<GalleryNFT> => {
    try {
      // Fetch URI from contract using eth_call
      const uriData = await fetch(`https://rpc-amoy.polygon.technology`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: contract,
            data: `0x0e89341c${tokenId.toString(16).padStart(64, '0')}` // uri(uint256)
          }, 'latest'],
          id: 1
        })
      }).then(r => r.json())

      if (!uriData.result || uriData.result === '0x') {
        return { tokenId, uri: '', metadata: null, creator: '', isLoading: false, error: 'No URI' }
      }

      // Decode the URI from the response
      const uri = decodeURIResult(uriData.result)

      // Fetch creator
      const creatorData = await fetch(`https://rpc-amoy.polygon.technology`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: contract,
            data: `0x510b5158${tokenId.toString(16).padStart(64, '0')}` // tokenCreator(uint256)
          }, 'latest'],
          id: 1
        })
      }).then(r => r.json())

      const creator = creatorData.result ? `0x${creatorData.result.slice(-40)}` : ''

      // Fetch metadata from IPFS
      let metadata: NFTMetadata | null = null
      if (uri) {
        const metadataUrl = uri.startsWith('ipfs://')
          ? uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
          : uri

        try {
          const metaResponse = await fetch(metadataUrl)
          if (metaResponse.ok) {
            metadata = await metaResponse.json()
            // Convert IPFS image URL
            if (metadata?.image?.startsWith('ipfs://')) {
              metadata.image = metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
            }
          }
        } catch {
          // Metadata fetch failed
        }
      }

      return { tokenId, uri, metadata, creator, isLoading: false, error: null }
    } catch (err) {
      return {
        tokenId,
        uri: '',
        metadata: null,
        creator: '',
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch'
      }
    }
  }

  // Decode string result from eth_call
  const decodeURIResult = (hexResult: string): string => {
    try {
      if (!hexResult || hexResult === '0x') return ''
      // Remove 0x prefix
      const data = hexResult.slice(2)
      // First 32 bytes is offset, next 32 is length
      const lengthHex = data.slice(64, 128)
      const length = parseInt(lengthHex, 16)
      // Rest is the string data
      const stringData = data.slice(128, 128 + length * 2)
      // Convert hex to string
      let result = ''
      for (let i = 0; i < stringData.length; i += 2) {
        result += String.fromCharCode(parseInt(stringData.slice(i, i + 2), 16))
      }
      return result
    } catch {
      return ''
    }
  }

  const shortenAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="border border-black/10 p-8 bg-white">
      <h3 className="font-tomorrow text-lg mb-2">Seed Minting Gallery</h3>
      <p className="text-black/50 text-sm mb-6">
        View all revealed NFTs from the Seed Minting collection.
      </p>

      {/* Stats */}
      <div className="flex gap-4 mb-8">
        <div className="text-center p-4 bg-black/5 flex-1">
          <p className="font-tomorrow text-[10px] text-black/40 uppercase mb-1">Total Revealed</p>
          <p className="font-tektur text-lg">{totalTokens?.toString() || '0'}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-black/40 text-sm">Loading gallery...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12 text-black/30">
          <p>No NFTs revealed yet</p>
          <p className="text-sm mt-2">Be the first to burn a seed and mint a revealed NFT!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {nfts.map((nft) => (
            <div
              key={nft.tokenId}
              onClick={() => setSelectedNft(nft)}
              className="border border-black/10 bg-white hover:border-black/30 transition-colors cursor-pointer group"
            >
              {nft.metadata?.image ? (
                <img
                  src={nft.metadata.image}
                  alt={nft.metadata.name || `NFT #${nft.tokenId}`}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-black/5 flex items-center justify-center">
                  <span className="text-black/20 text-sm">No Image</span>
                </div>
              )}
              <div className="p-3">
                <p className="font-tomorrow text-sm truncate">
                  {nft.metadata?.name || `Revealed #${nft.tokenId}`}
                </p>
                <p className="text-black/40 text-[10px] font-mono mt-1">
                  {shortenAddress(nft.creator)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for selected NFT */}
      {selectedNft && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNft(null)}
        >
          <div
            className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedNft.metadata?.image && (
              <img
                src={selectedNft.metadata.image}
                alt={selectedNft.metadata.name || `NFT #${selectedNft.tokenId}`}
                className="w-full aspect-square object-cover"
              />
            )}
            <div className="p-6">
              <h4 className="font-tomorrow text-lg mb-2">
                {selectedNft.metadata?.name || `Revealed #${selectedNft.tokenId}`}
              </h4>
              {selectedNft.metadata?.description && (
                <p className="text-black/60 text-sm mb-4">{selectedNft.metadata.description}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/40">Token ID</span>
                  <span className="font-mono">{selectedNft.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/40">Creator</span>
                  <span className="font-mono">{shortenAddress(selectedNft.creator)}</span>
                </div>
              </div>
              {selectedNft.metadata?.attributes && selectedNft.metadata.attributes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <p className="font-tomorrow text-[10px] text-black/40 uppercase mb-3">Attributes</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedNft.metadata.attributes.map((attr, i) => (
                      <div key={i} className="bg-black/5 p-2 text-center">
                        <p className="text-[10px] text-black/40 uppercase">{attr.trait_type}</p>
                        <p className="text-sm font-tektur truncate">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelectedNft(null)}
                className="w-full mt-6 bg-black text-white font-tomorrow text-sm py-3 hover:bg-black/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
