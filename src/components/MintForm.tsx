import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { FileUpload } from './FileUpload'
import { useNFTMint } from '../hooks/useNFTMint'
import { useIPFSUpload } from '../hooks/useIPFSUpload'

interface Attribute {
  trait_type: string
  value: string
}

export function MintForm() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [newTraitType, setNewTraitType] = useState('')
  const [newTraitValue, setNewTraitValue] = useState('')

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
    contractName,
    mintPrice,
    maxPerWallet,
    mintingEnabled,
    totalTokens,
    nextTokenId,
    remainingMints,
  } = useNFTMint()

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
      case 11155111:
        return `https://sepolia.etherscan.io/tx/${txHash}`
      case 137:
        return `https://polygonscan.com/tx/${txHash}`
      case 80002:
        return `https://amoy.polygonscan.com/tx/${txHash}`
      default:
        return `https://etherscan.io/tx/${txHash}`
    }
  }

  const getNetworkName = () => {
    switch (chainId) {
      case 11155111:
        return 'Sepolia'
      case 1:
        return 'Ethereum'
      case 137:
        return 'Polygon'
      case 80002:
        return 'Amoy'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-16 lg:gap-[8vw]">
      {/* Left Column - Form */}
      <div className="space-y-12">
        <FileUpload onFileSelect={setFile} selectedFile={file} />

        <div>
          <label className="label">Title</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter title"
            className="input-field font-tektur"
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description (optional)"
            rows={3}
            className="input-field font-tektur resize-none"
          />
        </div>

        {/* Attributes */}
        <div>
          <label className="label">Attributes</label>

          {attributes.length > 0 && (
            <div className="space-y-0 mb-6">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 border-b border-white/10"
                >
                  <div className="flex gap-6">
                    <span className="font-tektur text-white/40 text-sm">{attr.trait_type}</span>
                    <span className="font-tektur text-white text-sm">{attr.value}</span>
                  </div>
                  <button
                    onClick={() => removeAttribute(index)}
                    className="font-tomorrow text-[10px] tracking-[0.2em] text-white/20 hover:text-white transition-colors duration-300 uppercase"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-6 items-end">
            <div className="flex-1">
              <input
                type="text"
                value={newTraitType}
                onChange={(e) => setNewTraitType(e.target.value)}
                placeholder="Trait"
                className="input-field font-tektur"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newTraitValue}
                onChange={(e) => setNewTraitValue(e.target.value)}
                placeholder="Value"
                className="input-field font-tektur"
              />
            </div>
            <button
              onClick={addAttribute}
              disabled={!newTraitType || !newTraitValue}
              className="font-tomorrow text-[10px] tracking-[0.2em] text-white/30 hover:text-white disabled:opacity-20 disabled:hover:text-white/30 transition-colors duration-300 uppercase pb-4"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Info & Action */}
      <div className="space-y-12 lg:pt-0">
        {/* Collection Info */}
        {contractAddress && (
          <div>
            <h3 className="label mb-6">Collection</h3>
            <div className="space-y-0">
              {[
                { label: 'Name', value: contractName || '—' },
                { label: 'Minted', value: totalTokens?.toString() ?? '0' },
                { label: 'Next ID', value: `#${nextTokenId?.toString() ?? '0'}` },
                { label: 'Price', value: mintPrice && mintPrice > 0n ? `${formatEther(mintPrice)} ETH` : 'Free' },
                { label: 'Status', value: mintingEnabled === undefined ? '...' : mintingEnabled ? 'Open' : 'Closed' },
                { label: 'Network', value: getNetworkName() },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-4 border-b border-white/10">
                  <span className="font-tomorrow text-[10px] tracking-[0.15em] text-white/30 uppercase">{item.label}</span>
                  <span className="font-tektur text-white/80 text-sm">{item.value}</span>
                </div>
              ))}
              {maxPerWallet !== undefined && maxPerWallet > 0n && (
                <div className="flex justify-between items-center py-4 border-b border-white/10">
                  <span className="font-tomorrow text-[10px] tracking-[0.15em] text-white/30 uppercase">Remaining</span>
                  <span className="font-tektur text-white/80 text-sm">
                    {remainingMints !== undefined && remainingMints < BigInt(2**200)
                      ? remainingMints.toString()
                      : '∞'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mint Button */}
        <div className="pt-4">
          {!isConnected ? (
            <p className="font-tektur text-white/30 text-sm">Connect wallet to mint</p>
          ) : !contractAddress ? (
            <p className="font-tektur text-white/30 text-sm">No contract configured</p>
          ) : !mintingEnabled ? (
            <p className="font-tektur text-white/30 text-sm">Minting is closed</p>
          ) : !hasRemainingMints ? (
            <p className="font-tektur text-white/30 text-sm">Wallet limit reached</p>
          ) : (
            <>
              <button
                onClick={handleMint}
                disabled={!canMint}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <span className="font-tomorrow">
                    {isUploading && 'Uploading...'}
                    {isPending && 'Confirm in Wallet...'}
                    {isConfirming && 'Minting...'}
                  </span>
                ) : (
                  <span className="font-tomorrow">Mint</span>
                )}
              </button>

              <p className="font-tektur text-white/20 text-[10px] mt-6 text-center">
                {mintPrice && mintPrice > 0n
                  ? `${formatEther(mintPrice)} ETH + gas`
                  : 'Gas fees only'}
              </p>
            </>
          )}

          {/* Success */}
          {isSuccess && hash && (
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="font-tomorrow text-[10px] tracking-[0.2em] text-white uppercase mb-6">
                Minted Successfully
              </p>
              <div className="flex gap-6">
                <a
                  href={getExplorerUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link font-tomorrow text-[10px] tracking-[0.15em] uppercase"
                >
                  View Transaction
                </a>
                <button
                  onClick={resetForm}
                  className="font-tomorrow text-[10px] tracking-[0.15em] text-white/40 hover:text-white transition-colors duration-300 uppercase"
                >
                  Mint Another
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {(uploadError || mintError) && (
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="font-tektur text-white/50 text-sm">
                {uploadError || (mintError as Error)?.message || 'An error occurred'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
