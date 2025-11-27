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
    <div className="border-t border-black/10 pt-20 mt-20">
      {/* Admin Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <h2 className="font-tomorrow text-2xl md:text-3xl font-medium text-black tracking-wide uppercase">
            Admin
          </h2>
        </div>
        <p className="text-black/50 text-sm font-tektur">
          Contract owner controls
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-16">
        {/* Left Column - Settings */}
        <div className="space-y-10">
          {/* Mint Price */}
          <div>
            <label className="label">Mint Price (ETH)</label>
            <div className="flex gap-4 items-end">
              <input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="input-field font-tektur flex-1"
              />
              <button
                onClick={handleSetPrice}
                disabled={isLoading || !newPrice}
                className="font-tomorrow text-[10px] tracking-[0.2em] text-black/50 hover:text-black disabled:opacity-20 transition-colors duration-300 uppercase pb-4"
              >
                {activeAction === 'price' && isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
            <p className="font-tektur text-black/30 text-[10px] mt-2">
              Current: {mintPrice !== undefined ? `${formatEther(mintPrice)} ETH` : '...'}
            </p>
          </div>

          {/* Max Per Wallet */}
          <div>
            <label className="label">Max Per Wallet</label>
            <div className="flex gap-4 items-end">
              <input
                type="number"
                value={newMaxPerWallet}
                onChange={(e) => setNewMaxPerWallet(e.target.value)}
                placeholder="0 = unlimited"
                min="0"
                className="input-field font-tektur flex-1"
              />
              <button
                onClick={handleSetMaxPerWallet}
                disabled={isLoading}
                className="font-tomorrow text-[10px] tracking-[0.2em] text-black/50 hover:text-black disabled:opacity-20 transition-colors duration-300 uppercase pb-4"
              >
                {activeAction === 'maxWallet' && isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
            <p className="font-tektur text-black/30 text-[10px] mt-2">
              Current: {maxPerWallet !== undefined ? (maxPerWallet === 0n ? 'Unlimited' : maxPerWallet.toString()) : '...'}
            </p>
          </div>

          {/* Minting Toggle */}
          <div>
            <label className="label">Minting Status</label>
            <div className="flex items-center justify-between py-4 border-b border-black/10">
              <span className="font-tektur text-black/80">
                {mintingEnabled === undefined ? '...' : mintingEnabled ? 'Open' : 'Closed'}
              </span>
              <button
                onClick={handleToggleMinting}
                disabled={isLoading || mintingEnabled === undefined}
                className={`font-tomorrow text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 ${
                  mintingEnabled
                    ? 'text-black/50 hover:text-red-600'
                    : 'text-black/50 hover:text-green-600'
                } disabled:opacity-20`}
              >
                {activeAction === 'minting' && isLoading
                  ? 'Updating...'
                  : mintingEnabled
                  ? 'Disable'
                  : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Withdraw */}
        <div className="space-y-10">
          {/* Contract Stats */}
          <div>
            <label className="label">Contract Stats</label>
            <div className="space-y-0">
              <div className="flex justify-between items-center py-4 border-b border-black/10">
                <span className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase">
                  Total Minted
                </span>
                <span className="font-tektur text-black/80 text-sm">
                  {totalTokens?.toString() ?? '0'}
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-black/10">
                <span className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase">
                  Contract Balance
                </span>
                <span className="font-tektur text-black/80 text-sm">
                  {contractBalance ? `${parseFloat(formatEther(contractBalance.value)).toFixed(4)} ETH` : '0 ETH'}
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-black/10">
                <span className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 uppercase">
                  Contract
                </span>
                <a
                  href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-tektur text-black/60 hover:text-black text-xs transition-colors duration-300"
                >
                  {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
                </a>
              </div>
            </div>
          </div>

          {/* Withdraw */}
          <div>
            <label className="label">Withdraw Funds</label>
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !contractBalance || contractBalance.value === 0n}
              className="btn-secondary w-full mt-2"
            >
              <span className="font-tomorrow">
                {activeAction === 'withdraw' && isLoading
                  ? 'Withdrawing...'
                  : `Withdraw ${contractBalance ? parseFloat(formatEther(contractBalance.value)).toFixed(4) : '0'} ETH`}
              </span>
            </button>
            <p className="font-tektur text-black/30 text-[10px] mt-3 text-center">
              Sends funds to owner wallet
            </p>
          </div>

          {/* Status Messages */}
          {isSuccess && (
            <div className="pt-4">
              <p className="font-tomorrow text-[10px] tracking-[0.2em] text-green-600 uppercase">
                Transaction Successful
              </p>
            </div>
          )}

          {error && (
            <div className="pt-4">
              <p className="font-tektur text-red-600 text-sm">
                {(error as Error)?.message || 'Transaction failed'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
