import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { FileUpload } from './FileUpload'
import { useSoulboundMint } from '../hooks/useSoulboundMint'
import { useIPFSUpload } from '../hooks/useIPFSUpload'
import { CHAIN_IDS } from '../contracts/SoulboundContract'
import { SoulboundGallery } from './SoulboundGallery'

interface Attribute {
  trait_type: string
  value: string
}

export function SoulboundMintForm() {
  const { address, isConnected } = useAccount()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [newTraitType, setNewTraitType] = useState('')
  const [newTraitValue, setNewTraitValue] = useState('')
  const [showMintedOverlay, setShowMintedOverlay] = useState(false)

  const { uploadToIPFS, isUploading, error: uploadError } = useIPFSUpload()
  const {
    mintNew,
    isPending,
    isConfirming,
    isSuccess,
    error: mintError,
    hash,
    reset,
    contractAddress,
    mintPrice,
    mintingEnabled,
    totalTokens,
    remainingMints,
    chainId,
    chainName,
  } = useSoulboundMint()

  // Show overlay when mint succeeds
  useEffect(() => {
    if (isSuccess) {
      setShowMintedOverlay(true)
    }
  }, [isSuccess])

  const addAttribute = () => {
    if (newTraitType && newTraitValue) {
      setAttributes([...attributes, { trait_type: newTraitType, value: newTraitValue }])
      setNewTraitType('')
      setNewTraitValue('')
    }
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const handleMint = async () => {
    if (!file || !name || !address) return

    try {
      const { metadataUrl } = await uploadToIPFS(file, {
        name,
        description,
        attributes: attributes.length > 0 ? attributes : undefined,
      })

      await mintNew(metadataUrl)
    } catch (err) {
      console.error('Minting failed:', err)
    }
  }

  const resetForm = () => {
    setFile(null)
    setName('')
    setDescription('')
    setAttributes([])
    reset()
  }

  const isLoading = isUploading || isPending || isConfirming
  const hasRemainingMints = remainingMints === undefined || remainingMints > 0n
  const canMint = isConnected && file && name && !isLoading && contractAddress && mintingEnabled && hasRemainingMints

  const getExplorerUrl = (txHash: string) => {
    switch (chainId) {
      case CHAIN_IDS.MAINNET:
        return `https://etherscan.io/tx/${txHash}`
      case CHAIN_IDS.SEPOLIA:
        return `https://sepolia.etherscan.io/tx/${txHash}`
      case CHAIN_IDS.POLYGON:
        return `https://polygonscan.com/tx/${txHash}`
      case CHAIN_IDS.POLYGON_AMOY:
        return `https://amoy.polygonscan.com/tx/${txHash}`
      default:
        return `https://etherscan.io/tx/${txHash}`
    }
  }

  return (
    <>
      {/* MINTED! Overlay */}
      {showMintedOverlay && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer animate-fade-in"
          onClick={() => setShowMintedOverlay(false)}
        >
          <div className="text-center">
            <h1 className="font-tektur text-[#DFFF00] text-6xl sm:text-8xl md:text-9xl font-bold tracking-wider animate-pulse-slow">
              BOUND!
            </h1>
            <p className="font-tomorrow text-white/40 text-xs sm:text-sm mt-6 tracking-[0.3em] uppercase">
              Forever yours. Click to continue
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Soulbound info banner */}
        <div className="bg-black/5 border border-black/10 p-4">
          <p className="font-tomorrow text-[10px] tracking-[0.15em] text-black/60 uppercase mb-2">
            Soulbound NFT
          </p>
          <p className="text-sm text-black/70">
            These tokens are <strong>permanently bound</strong> to your wallet.
            They cannot be transferred or sold after minting.
          </p>
        </div>

        <FileUpload onFileSelect={setFile} selectedFile={file} />

        <div>
          <label className="label">Title</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter title"
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            rows={2}
            className="input-field resize-none"
          />
        </div>

        <div>
          <label className="label">Attributes</label>
          {attributes.length > 0 && (
            <div className="mb-3 bg-[#f5f5f5] p-3">
              {attributes.map((attr, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex gap-3 text-sm">
                    <span className="text-black/50">{attr.trait_type}:</span>
                    <span className="text-black">{attr.value}</span>
                  </div>
                  <button
                    onClick={() => removeAttribute(index)}
                    className="text-black/30 hover:text-black text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={newTraitType}
              onChange={(e) => setNewTraitType(e.target.value)}
              placeholder="Trait"
              className="input-field flex-1"
            />
            <input
              type="text"
              value={newTraitValue}
              onChange={(e) => setNewTraitValue(e.target.value)}
              placeholder="Value"
              className="input-field flex-1"
            />
            <button
              onClick={addAttribute}
              disabled={!newTraitType || !newTraitValue}
              className="btn-secondary px-4"
            >
              Add
            </button>
          </div>
        </div>

        {contractAddress && (
          <div className="flex gap-6 text-center py-4 border-t border-black/10">
            <div className="flex-1">
              <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">Minted</p>
              <p className="font-tektur text-black mt-1">{totalTokens?.toString() ?? '0'}</p>
            </div>
            <div className="flex-1">
              <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">Price</p>
              <p className="font-tektur text-black mt-1">
                {mintPrice && mintPrice > 0n ? `${formatEther(mintPrice)} ETH` : 'Free'}
              </p>
            </div>
            <div className="flex-1">
              <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">Chain</p>
              <p className="font-tektur text-black mt-1">{chainName}</p>
            </div>
          </div>
        )}

        <div>
          {!isConnected ? (
            <p className="text-black/40 text-sm text-center py-4">Connect wallet to mint</p>
          ) : !contractAddress ? (
            <p className="text-black/40 text-sm text-center py-4">No soulbound contract on {chainName}</p>
          ) : !mintingEnabled ? (
            <p className="text-black/40 text-sm text-center py-4">Minting is closed</p>
          ) : !hasRemainingMints ? (
            <p className="text-black/40 text-sm text-center py-4">Wallet limit reached</p>
          ) : (
            <>
              <button onClick={handleMint} disabled={!canMint} className="btn-primary w-full">
                {isLoading ? (
                  <>
                    {isUploading && 'Uploading...'}
                    {isPending && 'Confirm in Wallet...'}
                    {isConfirming && 'Binding...'}
                  </>
                ) : (
                  'Mint Soulbound'
                )}
              </button>
              <p className="text-black/30 text-[10px] mt-3 text-center">
                {mintPrice && mintPrice > 0n ? `${formatEther(mintPrice)} ETH + gas` : 'Gas fees only'} • Cannot be transferred
              </p>
            </>
          )}

          {isSuccess && hash && (
            <div className="mt-6 pt-4 border-t border-black/10 text-center">
              <p className="font-tomorrow text-[10px] tracking-[0.2em] text-black uppercase mb-3">
                Bound Forever
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href={getExplorerUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link font-tomorrow text-[10px] tracking-[0.15em] uppercase"
                >
                  View Tx
                </a>
                <button
                  onClick={resetForm}
                  className="font-tomorrow text-[10px] tracking-[0.15em] text-black/50 hover:text-black uppercase"
                >
                  Mint Another
                </button>
              </div>
            </div>
          )}

          {(uploadError || mintError) && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm">
              {uploadError || (mintError as Error)?.message || 'An error occurred'}
            </div>
          )}
        </div>

        {/* Soulbound Gallery */}
        <div className="mt-12 pt-8 border-t border-black/10">
          <SoulboundGallery />
        </div>
      </div>
    </>
  )
}
