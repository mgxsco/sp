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
    contractSymbol,
    mintPrice,
    maxPerWallet,
    mintingEnabled,
    totalTokens,
    nextTokenId,
    remainingMints,
    isOwner,
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

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left Column - Form */}
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Create Your NFT</h2>

          <div className="space-y-6">
            <FileUpload onFileSelect={setFile} selectedFile={file} />

            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome NFT"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your NFT..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Attributes Section */}
            <div>
              <label className="label">Attributes (Optional)</label>

              {attributes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {attributes.map((attr, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-slate-400 text-sm">{attr.trait_type}:</span>
                      <span className="text-white text-sm font-medium">{attr.value}</span>
                      <button
                        onClick={() => removeAttribute(index)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTraitType}
                  onChange={(e) => setNewTraitType(e.target.value)}
                  placeholder="Trait type (e.g., Artist)"
                  className="input-field flex-1"
                />
                <input
                  type="text"
                  value={newTraitValue}
                  onChange={(e) => setNewTraitValue(e.target.value)}
                  placeholder="Value (e.g., Name)"
                  className="input-field flex-1"
                />
                <button
                  onClick={addAttribute}
                  disabled={!newTraitType || !newTraitValue}
                  className="btn-secondary px-4 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Preview & Mint */}
      <div className="space-y-6">
        {/* Contract Info Card */}
        {contractAddress && (
          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Collection Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Collection</span>
                <span className="text-white font-medium">
                  {contractName || 'Loading...'} {contractSymbol && `(${contractSymbol})`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total NFTs</span>
                <span className="text-white font-medium">{totalTokens?.toString() ?? '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Next Token ID</span>
                <span className="text-primary-400 font-medium">#{nextTokenId?.toString() ?? '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Mint Price</span>
                <span className="text-white font-medium">
                  {mintPrice && mintPrice > 0n ? `${formatEther(mintPrice)} ETH` : 'Free'}
                </span>
              </div>
              {maxPerWallet !== undefined && maxPerWallet > 0n && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Your Remaining</span>
                  <span className="text-white font-medium">
                    {remainingMints !== undefined && remainingMints < BigInt(2**200)
                      ? remainingMints.toString()
                      : 'Unlimited'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Status</span>
                <span className={`font-medium ${mintingEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {mintingEnabled ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Network</span>
                <span className="text-white font-medium">
                  {chainId === 11155111 ? 'Sepolia' : chainId === 1 ? 'Ethereum' : chainId === 137 ? 'Polygon' : 'Unknown'}
                </span>
              </div>
              {isOwner && (
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    You are the contract owner
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Card */}
        <div className="card">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Preview</h3>

          <div className="bg-slate-900/50 rounded-xl overflow-hidden">
            <div className="aspect-square bg-slate-800 flex items-center justify-center">
              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">Upload a file to preview</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white truncate">
                  {name || 'Untitled NFT'}
                </h4>
                <span className="text-primary-400 text-sm">#{nextTokenId?.toString() ?? '?'}</span>
              </div>
              {description && (
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="card">
          {!isConnected ? (
            <div className="text-center py-4">
              <p className="text-slate-400 mb-4">Connect your wallet to mint your NFT</p>
            </div>
          ) : !contractAddress ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm mb-2">No contract configured</p>
              <p className="text-slate-500 text-xs">
                Deploy the contract and set VITE_NFT_CONTRACT_ADDRESS
              </p>
            </div>
          ) : !mintingEnabled ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">Minting is currently closed</p>
            </div>
          ) : !hasRemainingMints ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">You've reached the wallet mint limit</p>
            </div>
          ) : (
            <>
              <button
                onClick={handleMint}
                disabled={!canMint}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>
                      {isUploading && 'Uploading to IPFS...'}
                      {isPending && 'Confirm in wallet...'}
                      {isConfirming && 'Minting...'}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Mint NFT
                  </>
                )}
              </button>

              <p className="text-center text-slate-500 text-xs mt-3">
                {mintPrice && mintPrice > 0n
                  ? `Price: ${formatEther(mintPrice)} ETH + gas`
                  : 'Free (gas fees only)'}
              </p>
            </>
          )}

          {/* Success Message */}
          {isSuccess && hash && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">NFT Minted Successfully!</span>
              </div>
              <a
                href={getExplorerUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 text-sm underline block mb-2"
              >
                View transaction on explorer
              </a>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-white text-sm underline"
              >
                Mint another NFT
              </button>
            </div>
          )}

          {/* Error Message */}
          {(uploadError || mintError) && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">
                  {uploadError || (mintError as Error)?.message || 'An error occurred'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
