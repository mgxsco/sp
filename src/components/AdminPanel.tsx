import { useState, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { useNFTMint } from '../hooks/useNFTMint'
import { useBalance } from 'wagmi'

export function AdminPanel() {
  const {
    isOwner,
    contractAddress,
    mintPrice,
    maxPerWallet,
    mintingEnabled,
    totalTokens,
    setMintPrice,
    setMaxPerWallet,
    setMintingEnabled,
    withdraw,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  } = useNFTMint()

  const [newPrice, setNewPrice] = useState('')
  const [newMaxPerWallet, setNewMaxPerWallet] = useState('')
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const { data: contractBalance } = useBalance({
    address: contractAddress as `0x${string}`,
  })

  useEffect(() => {
    if (mintPrice !== undefined) {
      setNewPrice(formatEther(mintPrice))
    }
  }, [mintPrice])

  useEffect(() => {
    if (maxPerWallet !== undefined) {
      setNewMaxPerWallet(maxPerWallet.toString())
    }
  }, [maxPerWallet])

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        setActiveAction(null)
        reset()
      }, 2000)
    }
  }, [isSuccess, reset])

  if (!isOwner) return null

  const isLoading = isPending || isConfirming

  const handleSetPrice = async () => {
    if (!newPrice) return
    setActiveAction('price')
    try {
      await setMintPrice(parseEther(newPrice))
    } catch (err) {
      console.error('Failed to set price:', err)
    }
  }

  const handleSetMaxPerWallet = async () => {
    setActiveAction('maxWallet')
    try {
      await setMaxPerWallet(BigInt(newMaxPerWallet || '0'))
    } catch (err) {
      console.error('Failed to set max per wallet:', err)
    }
  }

  const handleToggleMinting = async () => {
    setActiveAction('minting')
    try {
      await setMintingEnabled(!mintingEnabled)
    } catch (err) {
      console.error('Failed to toggle minting:', err)
    }
  }

  const handleWithdraw = async () => {
    setActiveAction('withdraw')
    try {
      await withdraw()
    } catch (err) {
      console.error('Failed to withdraw:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex gap-6 text-center pb-4 border-b border-black/10">
        <div className="flex-1">
          <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">Minted</p>
          <p className="font-tektur text-black mt-1">{totalTokens?.toString() ?? '0'}</p>
        </div>
        <div className="flex-1">
          <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">Balance</p>
          <p className="font-tektur text-black mt-1">
            {contractBalance ? `${parseFloat(formatEther(contractBalance.value)).toFixed(4)} ETH` : '0 ETH'}
          </p>
        </div>
        <div className="flex-1">
          <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">Status</p>
          <p className="font-tektur text-black mt-1">
            {mintingEnabled === undefined ? '...' : mintingEnabled ? 'Open' : 'Closed'}
          </p>
        </div>
      </div>

      {/* Mint Price */}
      <div>
        <label className="label">Mint Price (ETH)</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="0.00"
            className="input-field flex-1"
          />
          <button
            onClick={handleSetPrice}
            disabled={isLoading || !newPrice}
            className="btn-secondary px-6"
          >
            {activeAction === 'price' && isLoading ? '...' : 'Set'}
          </button>
        </div>
      </div>

      {/* Max Per Wallet */}
      <div>
        <label className="label">Max Per Wallet</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={newMaxPerWallet}
            onChange={(e) => setNewMaxPerWallet(e.target.value)}
            placeholder="0 = unlimited"
            min="0"
            className="input-field flex-1"
          />
          <button
            onClick={handleSetMaxPerWallet}
            disabled={isLoading}
            className="btn-secondary px-6"
          >
            {activeAction === 'maxWallet' && isLoading ? '...' : 'Set'}
          </button>
        </div>
      </div>

      {/* Minting Toggle */}
      <div>
        <label className="label">Minting</label>
        <button
          onClick={handleToggleMinting}
          disabled={isLoading || mintingEnabled === undefined}
          className="btn-secondary w-full"
        >
          {activeAction === 'minting' && isLoading
            ? 'Updating...'
            : mintingEnabled
            ? 'Disable Minting'
            : 'Enable Minting'}
        </button>
      </div>

      {/* Withdraw */}
      <div className="pt-4 border-t border-black/10">
        <button
          onClick={handleWithdraw}
          disabled={isLoading || !contractBalance || contractBalance.value === 0n}
          className="btn-primary w-full"
        >
          {activeAction === 'withdraw' && isLoading
            ? 'Withdrawing...'
            : `Withdraw ${contractBalance ? parseFloat(formatEther(contractBalance.value)).toFixed(4) : '0'} ETH`}
        </button>
      </div>

      {/* Contract Address */}
      <div className="text-center pt-2">
        <a
          href={`https://sepolia.etherscan.io/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black/40 hover:text-black text-xs transition-colors"
        >
          {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
        </a>
      </div>

      {/* Status Messages */}
      {isSuccess && (
        <p className="font-tomorrow text-[10px] tracking-[0.2em] text-green-600 uppercase text-center">
          Success
        </p>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm">
          {(error as Error)?.message || 'Transaction failed'}
        </div>
      )}
    </div>
  )
}
