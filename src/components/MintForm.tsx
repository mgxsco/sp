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

  // Check if user can mint
  const hasRemainingMints = remainingMints === undefined || remainingMints > 0n
  const canMint = isConnected && file && name && !isLoading && contractAddress && mintingEnabled && hasRemainingMints

  // Get block explorer URL based on chain
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
    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
      {/* Left Column - Form */}
      <div className="space-y-10">
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
            placeholder="Enter description (optional)"
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* Attributes Section */}
        <div>
          <label className="label">Attributes</label>

          {attributes.length > 0 && (
            <div className="space-y-2 mb-4">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-900"
                >
                  <div className="flex gap-4">
                    <span className="text-gray-500 text-sm">{attr.trait_type}</span>
                    <span className="text-white text-sm">{attr.value}</span>
                  </div>
                  <button
                    onClick={() => removeAttribute(index)}
                    className="text-gray-600 hover:text-white transition-colors text-xs uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                type="text"
                value={newTraitType}
                onChange={(e) => setNewTraitType(e.target.value)}
                placeholder="Trait"
                className="input-field"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newTraitValue}
                onChange={(e) => setNewTraitValue(e.target.value)}
                placeholder="Value"
                className="input-field"
              />
            </div>
            <button
              onClick={addAttribute}
              disabled={!newTraitType || !newTraitValue}
              className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors text-xs uppercase tracking-wider pb-3"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Info & Mint */}
      <div className="space-y-10">
        {/* Collection Info */}
        {contractAddress && (
          <div className="space-y-4">
            <h3 className="label">Collection</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-900">
                <span className="text-gray-500 text-sm">Name</span>
                <span className="text-white text-sm">{contractName || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-900">
                <span className="text-gray-500 text-sm">Total Minted</span>
                <span className="text-white text-sm">{totalTokens?.toString() ?? '0'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-900">
                <span className="text-gray-500 text-sm">Next ID</span>
                <span className="text-white text-sm">#{nextTokenId?.toString() ?? '0'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-900">
                <span className="text-gray-500 text-sm">Price</span>
                <span className="text-white text-sm">
                  {mintPrice && mintPrice > 0n ? `${formatEther(mintPrice)} ETH` : 'Free'}
                </span>
              </div>
              {maxPerWallet !== undefined && maxPerWallet > 0n && (
                <div className="flex justify-between items-center py-2 border-b border-gray-900">
                  <span className="text-gray-500 text-sm">Remaining</span>
                  <span className="text-white text-sm">
                    {remainingMints !== undefined && remainingMints < BigInt(2**200)
                      ? remainingMints.toString()
                      : '∞'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-900">
                <span className="text-gray-500 text-sm">Status</span>
                <span className={`text-sm ${mintingEnabled === undefined ? 'text-gray-500' : mintingEnabled ? 'text-white' : 'text-gray-600'}`}>
                  {mintingEnabled === undefined ? '...' : mintingEnabled ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-900">
                <span className="text-gray-500 text-sm">Network</span>
                <span className="text-white text-sm">{getNetworkName()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Mint Action */}
        <div className="pt-6">
          {!isConnected ? (
            <p className="text-gray-500 text-sm">Connect wallet to mint</p>
          ) : !contractAddress ? (
            <p className="text-gray-500 text-sm">No contract configured</p>
          ) : !mintingEnabled ? (
            <p className="text-gray-500 text-sm">Minting is closed</p>
          ) : !hasRemainingMints ? (
            <p className="text-gray-500 text-sm">Wallet limit reached</p>
          ) : (
            <>
              <button
                onClick={handleMint}
                disabled={!canMint}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <span>
                    {isUploading && 'Uploading...'}
                    {isPending && 'Confirm in wallet...'}
                    {isConfirming && 'Minting...'}
                  </span>
                ) : (
                  'Mint'
                )}
              </button>

              <p className="text-gray-600 text-xs mt-4 text-center">
                {mintPrice && mintPrice > 0n
                  ? `${formatEther(mintPrice)} ETH + gas`
                  : 'Gas fees only'}
              </p>
            </>
          )}

          {/* Success Message */}
          {isSuccess && hash && (
            <div className="mt-8 pt-8 border-t border-gray-900">
              <p className="text-white text-sm mb-4">Minted successfully</p>
              <div className="flex gap-4">
                <a
                  href={getExplorerUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white text-xs uppercase tracking-wider transition-colors underline-animate"
                >
                  View Transaction
                </a>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-white text-xs uppercase tracking-wider transition-colors"
                >
                  Mint Another
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(uploadError || mintError) && (
            <div className="mt-8 pt-8 border-t border-gray-900">
              <p className="text-gray-400 text-sm">
                {uploadError || (mintError as Error)?.message || 'An error occurred'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
