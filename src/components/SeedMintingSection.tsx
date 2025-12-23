import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { useSeed } from '../hooks/useSeed'
import { useRevealed } from '../hooks/useRevealed'
import { useGeminiGenerate, base64ToFile, UseGeminiGenerateReturn } from '../hooks/useGeminiGenerate'
import { useIPFSUpload } from '../hooks/useIPFSUpload'

type SeedMintingSubTab = 'mint' | 'seed' | 'gallery'

export function SeedMintingSection() {
  const [activeSubTab, setActiveSubTab] = useState<SeedMintingSubTab>('mint')

  // Lift Gemini state to parent so it persists across tab switches
  const geminiState = useGeminiGenerate()

  const subTabs: { id: SeedMintingSubTab; label: string }[] = [
    { id: 'mint', label: 'MINT' },
    { id: 'seed', label: 'SEED' },
    { id: 'gallery', label: 'GALLERY' },
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
      {activeSubTab === 'gallery' && <SeedMintingGallery />}
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

  const {
    burnSeed,
    isPending: isBurnPending,
    isConfirming: isBurnConfirming,
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
  } = geminiState

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
            disabled={isGenerating || attemptsRemaining <= 0}
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
function SeedMintingGallery() {
  const { totalTokens } = useRevealed()

  return (
    <div className="border border-black/10 p-8 bg-white">
      <h3 className="font-tomorrow text-lg mb-6">Seed Minting Gallery</h3>
      <p className="text-black/50 text-sm mb-8">
        View all revealed NFTs from the Seed Minting collection.
      </p>

      <div className="text-center py-12 text-black/30">
        <p>Coming soon</p>
        <p className="text-sm mt-2">Total Revealed: {totalTokens?.toString() || '0'}</p>
      </div>
    </div>
  )
}
