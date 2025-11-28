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
    <div className="space-y-8">
      {/* File Upload */}
      <FileUpload onFileSelect={setFile} selectedFile={file} />

      {/* Title */}
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

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          rows={2}
          className="input-field font-tektur resize-none"
        />
      </div>

      {/* Attributes */}
      <div>
        <label className="label">Attributes</label>
        {attributes.length > 0 && (
          <div className="mb-4">
            {attributes.map((attr, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-black/10">
                <div className="flex gap-4">
                  <span className="font-tektur text-black/50 text-sm">{attr.trait_type}</span>
                  <span className="font-tektur text-black text-sm">{attr.value}</span>
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
        <div className="flex gap-4 items-end">
          <input
            type="text"
            value={newTraitType}
            onChange={(e) => setNewTraitType(e.target.value)}
            placeholder="Trait"
            className="input-field font-tektur flex-1"
          />
          <input
            type="text"
            value={newTraitValue}
            onChange={(e) => setNewTraitValue(e.target.value)}
            placeholder="Value"
            className="input-field font-tektur flex-1"
          />
          <button
            onClick={addAttribute}
            disabled={!newTraitType || !newTraitValue}
            className="font-tomorrow text-[10px] tracking-[0.2em] text-black/40 hover:text-black disabled:opacity-20 uppercase pb-4"
          >
            Add
          </button>
        </div>
      </div>

      {/* Collection Info */}
      {contractAddress && (
        <div className="pt-4 border-t border-black/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase mb-1">Minted</p>
              <p className="font-tektur text-black">{totalTokens?.toString() ?? '0'}</p>
            </div>
            <div>
              <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase mb-1">Price</p>
              <p className="font-tektur text-black">
                {mintPrice && mintPrice > 0n ? `${formatEther(mintPrice)}` : 'Free'}
              </p>
            </div>
            <div>
              <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase mb-1">Status</p>
              <p className="font-tektur text-black">
                {mintingEnabled === undefined ? '...' : mintingEnabled ? 'Open' : 'Closed'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mint Button */}
      <div className="pt-4">
        {!isConnected ? (
          <p className="font-tektur text-black/40 text-sm text-center">Connect wallet to mint</p>
        ) : !contractAddress ? (
          <p className="font-tektur text-black/40 text-sm text-center">No contract configured</p>
        ) : !mintingEnabled ? (
          <p className="font-tektur text-black/40 text-sm text-center">Minting is closed</p>
        ) : !hasRemainingMints ? (
          <p className="font-tektur text-black/40 text-sm text-center">Wallet limit reached</p>
        ) : (
          <>
            <button onClick={handleMint} disabled={!canMint} className="btn-primary w-full">
              {isLoading ? (
                <span>
                  {isUploading && 'Uploading...'}
                  {isPending && 'Confirm in Wallet...'}
                  {isConfirming && 'Minting...'}
                </span>
              ) : (
                'Mint'
              )}
            </button>
            <p className="font-tektur text-black/30 text-[10px] mt-4 text-center">
              {mintPrice && mintPrice > 0n ? `${formatEther(mintPrice)} ETH + gas` : 'Gas fees only'}
            </p>
          </>
        )}

        {/* Success */}
        {isSuccess && hash && (
          <div className="mt-8 pt-6 border-t border-black/10 text-center">
            <p className="font-tomorrow text-[10px] tracking-[0.2em] text-black uppercase mb-4">
              Minted Successfully
            </p>
            <div className="flex justify-center gap-6">
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

        {/* Error */}
        {(uploadError || mintError) && (
          <div className="mt-6 pt-4 border-t border-black/10">
            <p className="font-tektur text-red-600 text-sm text-center">
              {uploadError || (mintError as Error)?.message || 'An error occurred'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
