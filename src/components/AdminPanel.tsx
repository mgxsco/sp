import { useState, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { useNFTMint } from '../hooks/useNFTMint'
import { useAccount, useBalance, useReadContract, useWriteContract, useSwitchChain, useChainId } from 'wagmi'
import { useActiveChain, CHAIN_IDS, CHAIN_NAMES, ChainId } from '../contexts/ChainContext'
import { getContractAddress, PUBLIC_MINT_ERC1155_ABI } from '../contracts/NFTContract'

const AVAILABLE_CHAINS: ChainId[] = [
  CHAIN_IDS.SEPOLIA,
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.POLYGON_AMOY,
]

export function AdminPanel() {
  const { activeChainId, setActiveChainId } = useActiveChain()
  const { address } = useAccount()
  const walletChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  const {
    contractAddress,
    mintPrice,
    maxPerWallet,
    mintingEnabled,
    totalTokens,
    setMintPrice,
    setMaxPerWallet,
    withdraw,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  } = useNFTMint()

  // Check owner on all chains - admin can control from any chain
  const { data: sepoliaOwner } = useReadContract({
    address: getContractAddress(CHAIN_IDS.SEPOLIA) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: CHAIN_IDS.SEPOLIA,
    query: { enabled: !!getContractAddress(CHAIN_IDS.SEPOLIA) },
  })

  const { data: mainnetOwner } = useReadContract({
    address: getContractAddress(CHAIN_IDS.MAINNET) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: CHAIN_IDS.MAINNET,
    query: { enabled: !!getContractAddress(CHAIN_IDS.MAINNET) },
  })

  const { data: polygonOwner } = useReadContract({
    address: getContractAddress(CHAIN_IDS.POLYGON) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: CHAIN_IDS.POLYGON,
    query: { enabled: !!getContractAddress(CHAIN_IDS.POLYGON) },
  })

  const { data: amoyOwner } = useReadContract({
    address: getContractAddress(CHAIN_IDS.POLYGON_AMOY) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: CHAIN_IDS.POLYGON_AMOY,
    query: { enabled: !!getContractAddress(CHAIN_IDS.POLYGON_AMOY) },
  })

  // Check if wallet is owner on ANY chain
  const isOwnerOnAnyChain = address && (
    (sepoliaOwner && address.toLowerCase() === (sepoliaOwner as string).toLowerCase()) ||
    (mainnetOwner && address.toLowerCase() === (mainnetOwner as string).toLowerCase()) ||
    (polygonOwner && address.toLowerCase() === (polygonOwner as string).toLowerCase()) ||
    (amoyOwner && address.toLowerCase() === (amoyOwner as string).toLowerCase())
  )

  const { writeContractAsync } = useWriteContract()

  const [newPrice, setNewPrice] = useState('')
  const [newMaxPerWallet, setNewMaxPerWallet] = useState('')
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [activationError, setActivationError] = useState<string | null>(null)

  // Read minting status for all chains
  const { data: sepoliaMinting, refetch: refetchSepolia } = useReadContract({
    address: getContractAddress(CHAIN_IDS.SEPOLIA) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: CHAIN_IDS.SEPOLIA,
    query: { enabled: !!getContractAddress(CHAIN_IDS.SEPOLIA) },
  })

  const { data: mainnetMinting, refetch: refetchMainnet } = useReadContract({
    address: getContractAddress(CHAIN_IDS.MAINNET) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: CHAIN_IDS.MAINNET,
    query: { enabled: !!getContractAddress(CHAIN_IDS.MAINNET) },
  })

  const { data: polygonMinting, refetch: refetchPolygon } = useReadContract({
    address: getContractAddress(CHAIN_IDS.POLYGON) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: CHAIN_IDS.POLYGON,
    query: { enabled: !!getContractAddress(CHAIN_IDS.POLYGON) },
  })

  const { data: amoyMinting, refetch: refetchAmoy } = useReadContract({
    address: getContractAddress(CHAIN_IDS.POLYGON_AMOY) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: CHAIN_IDS.POLYGON_AMOY,
    query: { enabled: !!getContractAddress(CHAIN_IDS.POLYGON_AMOY) },
  })

  const mintingStatusByChain: Record<ChainId, boolean | undefined> = {
    [CHAIN_IDS.SEPOLIA]: sepoliaMinting as boolean | undefined,
    [CHAIN_IDS.MAINNET]: mainnetMinting as boolean | undefined,
    [CHAIN_IDS.POLYGON]: polygonMinting as boolean | undefined,
    [CHAIN_IDS.POLYGON_AMOY]: amoyMinting as boolean | undefined,
  }

  const refetchAll = () => {
    refetchSepolia()
    refetchMainnet()
    refetchPolygon()
    refetchAmoy()
  }

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

  // Track which chain is being toggled
  const [togglingChain, setTogglingChain] = useState<ChainId | null>(null)
  const [toggleStatus, setToggleStatus] = useState<'switching' | 'signing' | 'confirming' | null>(null)

  // Handle toggling minting on a single chain (without affecting others)
  const handleToggleChainMinting = async (chainId: ChainId, enable: boolean) => {
    const chainContract = getContractAddress(chainId)
    if (!chainContract) return

    setTogglingChain(chainId)
    setActivationError(null)

    try {
      // Switch to the target chain if needed
      if (walletChainId !== chainId) {
        setToggleStatus('switching')
        await switchChainAsync({ chainId })
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      setToggleStatus('signing')

      // Execute the transaction
      await writeContractAsync({
        address: chainContract,
        abi: PUBLIC_MINT_ERC1155_ABI,
        functionName: 'setMintingEnabled',
        args: [enable],
        chainId: chainId,
      })

      setToggleStatus('confirming')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update active chain in context if enabling
      if (enable) {
        setActiveChainId(chainId)
      }

      // Refetch minting status
      setTimeout(refetchAll, 1000)

    } catch (err) {
      console.error(`Failed to ${enable ? 'enable' : 'disable'} minting on chain ${chainId}:`, err)
      setActivationError(`Failed to ${enable ? 'enable' : 'disable'} minting on ${CHAIN_NAMES[chainId]}`)
    } finally {
      setTogglingChain(null)
      setToggleStatus(null)
    }
  }

  if (!isOwnerOnAnyChain) return null

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

  const handleWithdraw = async () => {
    setActiveAction('withdraw')
    try {
      await withdraw()
    } catch (err) {
      console.error('Failed to withdraw:', err)
    }
  }

  const getExplorerUrl = (address: string, chainId: ChainId) => {
    switch (chainId) {
      case CHAIN_IDS.MAINNET:
        return `https://etherscan.io/address/${address}`
      case CHAIN_IDS.SEPOLIA:
        return `https://sepolia.etherscan.io/address/${address}`
      case CHAIN_IDS.POLYGON:
        return `https://polygonscan.com/address/${address}`
      case CHAIN_IDS.POLYGON_AMOY:
        return `https://amoy.polygonscan.com/address/${address}`
      default:
        return `https://etherscan.io/address/${address}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Chain Minting Controls */}
      <div>
        <label className="label">Chain Minting Control</label>
        <p className="text-black/40 text-xs mb-3">
          Toggle minting on/off for each chain. Signing a transaction is required for each change.
        </p>

        {/* Error message */}
        {activationError && (
          <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm">{activationError}</div>
        )}

        {/* Chain grid */}
        <div className="space-y-2">
            {AVAILABLE_CHAINS.map((chainId) => {
              const chainContract = getContractAddress(chainId)
              const isEnabled = mintingStatusByChain[chainId]
              const isToggling = togglingChain === chainId

              return (
                <div
                  key={chainId}
                  className={`flex items-center justify-between p-3 border ${
                    isEnabled ? 'border-green-500 bg-green-50' : 'border-black/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-tomorrow text-[11px] tracking-[0.15em] uppercase">
                      {CHAIN_NAMES[chainId]}
                    </span>
                    {chainContract && (
                      <a
                        href={getExplorerUrl(chainContract, chainId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black/30 hover:text-black text-[10px] font-mono"
                      >
                        {chainContract.slice(0, 6)}...{chainContract.slice(-4)}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!chainContract ? (
                      <span className="text-[10px] text-black/20 uppercase tracking-wider">No contract</span>
                    ) : isToggling ? (
                      <span className="text-[10px] text-black/60 uppercase tracking-wider">
                        {toggleStatus === 'switching' ? 'Switching...' :
                         toggleStatus === 'signing' ? 'Sign tx...' :
                         toggleStatus === 'confirming' ? 'Confirming...' : '...'}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleChainMinting(chainId, true)}
                          disabled={isEnabled === true || isToggling || togglingChain !== null}
                          className={`font-tomorrow text-[10px] tracking-[0.1em] uppercase py-1 px-3 transition-colors ${
                            isEnabled === true
                              ? 'bg-green-600 text-white'
                              : 'border border-black/20 text-black/40 hover:border-green-500 hover:text-green-600'
                          } ${(isToggling || togglingChain !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          On
                        </button>
                        <button
                          onClick={() => handleToggleChainMinting(chainId, false)}
                          disabled={isEnabled === false || isEnabled === undefined || isToggling || togglingChain !== null}
                          className={`font-tomorrow text-[10px] tracking-[0.1em] uppercase py-1 px-3 transition-colors ${
                            isEnabled === false
                              ? 'bg-black text-white'
                              : 'border border-black/20 text-black/40 hover:border-black hover:text-black'
                          } ${(isToggling || togglingChain !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Off
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Stats for active chain */}
      <div className="flex gap-6 text-center pb-4 border-b border-black/10">
        <div className="flex-1">
          <p className="font-tomorrow text-[9px] tracking-[0.15em] text-black/40 uppercase">
            {CHAIN_NAMES[activeChainId]} Minted
          </p>
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
        <label className="label">Mint Price (ETH) - {CHAIN_NAMES[activeChainId]}</label>
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
        <label className="label">Max Per Wallet - {CHAIN_NAMES[activeChainId]}</label>
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

      {/* Withdraw */}
      <div className="pt-4 border-t border-black/10">
        <button
          onClick={handleWithdraw}
          disabled={isLoading || !contractBalance || contractBalance.value === 0n}
          className="btn-primary w-full"
        >
          {activeAction === 'withdraw' && isLoading
            ? 'Withdrawing...'
            : `Withdraw ${contractBalance ? parseFloat(formatEther(contractBalance.value)).toFixed(4) : '0'} ETH from ${CHAIN_NAMES[activeChainId]}`}
        </button>
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
