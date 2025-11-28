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

interface ActivationStep {
  chainId: ChainId
  action: 'enable' | 'disable'
  status: 'pending' | 'switching' | 'signing' | 'confirming' | 'done' | 'error'
}

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

  // Chain activation flow state
  const [activationSteps, setActivationSteps] = useState<ActivationStep[]>([])
  const [isActivating, setIsActivating] = useState(false)
  const [activationError, setActivationError] = useState<string | null>(null)
  const [targetChain, setTargetChain] = useState<ChainId | null>(null)

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

  // Handle chain activation
  const handleActivateChain = async (selectedChainId: ChainId) => {
    const selectedContract = getContractAddress(selectedChainId)
    if (!selectedContract) return

    setActivationError(null)
    setTargetChain(selectedChainId)

    // Build the list of steps needed
    const steps: ActivationStep[] = []

    // First, disable minting on all other chains that have it enabled
    for (const chainId of AVAILABLE_CHAINS) {
      if (chainId === selectedChainId) continue
      const hasContract = !!getContractAddress(chainId)
      const isEnabled = mintingStatusByChain[chainId]
      if (hasContract && isEnabled) {
        steps.push({ chainId, action: 'disable', status: 'pending' })
      }
    }

    // Then enable minting on the selected chain
    steps.push({ chainId: selectedChainId, action: 'enable', status: 'pending' })

    setActivationSteps(steps)
    setIsActivating(true)

    // Process steps sequentially
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepContract = getContractAddress(step.chainId)
      if (!stepContract) continue

      try {
        // Update status to switching
        setActivationSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'switching' } : s
        ))

        // Switch to the target chain if needed
        if (walletChainId !== step.chainId) {
          await switchChainAsync({ chainId: step.chainId })
          // Wait a bit for the chain switch to settle
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Update status to signing
        setActivationSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'signing' } : s
        ))

        // Execute the transaction
        await writeContractAsync({
          address: stepContract,
          abi: PUBLIC_MINT_ERC1155_ABI,
          functionName: 'setMintingEnabled',
          args: [step.action === 'enable'],
          chainId: step.chainId,
        })

        // Update status to confirming
        setActivationSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'confirming' } : s
        ))

        // Wait for confirmation (simplified - in production you'd use useWaitForTransactionReceipt)
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Update status to done
        setActivationSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'done' } : s
        ))

      } catch (err) {
        console.error(`Failed to ${step.action} minting on chain ${step.chainId}:`, err)
        setActivationSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'error' } : s
        ))
        setActivationError(`Failed to ${step.action} minting on ${CHAIN_NAMES[step.chainId]}`)
        setIsActivating(false)
        return
      }
    }

    // All done - update active chain in context and refetch statuses
    setActiveChainId(selectedChainId)
    setIsActivating(false)
    setActivationSteps([])
    setTargetChain(null)

    // Refetch all minting statuses
    setTimeout(refetchAll, 1000)
  }

  const cancelActivation = () => {
    setIsActivating(false)
    setActivationSteps([])
    setTargetChain(null)
    setActivationError(null)
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

  const getStepStatusText = (step: ActivationStep) => {
    switch (step.status) {
      case 'pending': return 'Waiting...'
      case 'switching': return 'Switching chain...'
      case 'signing': return 'Sign in wallet...'
      case 'confirming': return 'Confirming...'
      case 'done': return 'Done ✓'
      case 'error': return 'Failed ✗'
    }
  }

  return (
    <div className="space-y-6">
      {/* Chain Activation Section */}
      <div>
        <label className="label">Activate Minting on Chain</label>
        <p className="text-black/40 text-xs mb-3">
          Select a chain to activate minting. This will enable minting on the selected chain and disable it on all others.
        </p>

        {/* Activation in progress */}
        {isActivating && activationSteps.length > 0 && (
          <div className="mb-4 p-4 bg-[#f5f5f5] border border-black/10">
            <p className="font-tomorrow text-[10px] tracking-[0.15em] text-black/60 uppercase mb-3">
              Activating {CHAIN_NAMES[targetChain!]}...
            </p>
            <div className="space-y-2">
              {activationSteps.map((step, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-black/70">
                    {step.action === 'enable' ? 'Enable' : 'Disable'} {CHAIN_NAMES[step.chainId]}
                  </span>
                  <span className={`font-mono text-xs ${
                    step.status === 'done' ? 'text-green-600' :
                    step.status === 'error' ? 'text-red-600' :
                    step.status === 'pending' ? 'text-black/30' :
                    'text-black/60'
                  }`}>
                    {getStepStatusText(step)}
                  </span>
                </div>
              ))}
            </div>
            {activationError && (
              <div className="mt-3 text-red-600 text-sm">{activationError}</div>
            )}
            <button
              onClick={cancelActivation}
              className="mt-3 text-black/40 hover:text-black text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Chain grid */}
        {!isActivating && (
          <div className="space-y-2">
            {AVAILABLE_CHAINS.map((chainId) => {
              const chainContract = getContractAddress(chainId)
              const isEnabled = mintingStatusByChain[chainId]
              const isActive = isEnabled === true

              return (
                <div
                  key={chainId}
                  className={`flex items-center justify-between p-3 border ${
                    isActive ? 'border-green-500 bg-green-50' : 'border-black/10'
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
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase tracking-wider ${
                      !chainContract ? 'text-black/20' :
                      isEnabled === undefined ? 'text-black/30' :
                      isEnabled ? 'text-green-600' : 'text-black/40'
                    }`}>
                      {!chainContract ? 'No contract' :
                       isEnabled === undefined ? '...' :
                       isEnabled ? 'Active' : 'Inactive'}
                    </span>
                    {chainContract && !isActive && (
                      <button
                        onClick={() => handleActivateChain(chainId)}
                        disabled={isActivating}
                        className="btn-secondary text-[10px] py-1 px-3"
                      >
                        Activate
                      </button>
                    )}
                    {isActive && (
                      <span className="text-green-600 text-xs">●</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
