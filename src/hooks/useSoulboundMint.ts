import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi'
import { SOULBOUND_ERC1155_ABI, getSoulboundContractAddress, CHAIN_IDS } from '../contracts/SoulboundContract'

export function useSoulboundMint() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  // Get contract address for current chain
  const contractAddress = getSoulboundContractAddress(chainId)

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Get contract info
  const { data: contractName } = useReadContract({
    address: contractAddress || undefined,
    abi: SOULBOUND_ERC1155_ABI,
    functionName: 'name',
    chainId,
    query: { enabled: !!contractAddress },
  })

  const { data: contractSymbol } = useReadContract({
    address: contractAddress || undefined,
    abi: SOULBOUND_ERC1155_ABI,
    functionName: 'symbol',
    chainId,
    query: { enabled: !!contractAddress },
  })

  const { data: contractOwner } = useReadContract({
    address: contractAddress || undefined,
    abi: SOULBOUND_ERC1155_ABI,
    functionName: 'owner',
    chainId,
    query: { enabled: !!contractAddress },
  })

  const { data: mintPrice } = useReadContract({
    address: contractAddress || undefined,
    abi: SOULBOUND_ERC1155_ABI,
    functionName: 'mintPrice',
    chainId,
    query: { enabled: !!contractAddress },
  })

  const { data: maxPerWallet } = useReadContract({
    address: contractAddress || undefined,
    abi: SOULBOUND_ERC1155_ABI,
    functionName: 'maxPerWallet',
    chainId,
    query: { enabled: !!contractAddress },
  })

  const { data: mintingEnabled } = useReadContract({
    address: contractAddress || undefined,
    abi: SOULBOUND_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId,
    query: { enabled: !!contractAddress },
  })

  const { data: totalTokens } = useReadContract({
    address: contractAddress || undefined,
    abi: SOULBOUND_ERC1155_ABI,
    functionName: 'totalTokens',
    chainId,
    query: { enabled: !!contractAddress },
  })

  const { data: remainingMints } = useReadContract({
    address: contractAddress || undefined,
    abi: SOULBOUND_ERC1155_ABI,
    functionName: 'remainingMintsForWallet',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!contractAddress && !!address },
  })

  const isOwner = address && contractOwner ? address.toLowerCase() === contractOwner.toLowerCase() : false

  /**
   * Mint a NEW soulbound token with your own URI - anyone can call this
   * Token will be bound to the minting wallet forever (non-transferable)
   */
  const mintNew = async (tokenURI: string) => {
    if (!contractAddress) {
      throw new Error('Soulbound contract not deployed on this chain')
    }

    writeContract({
      address: contractAddress,
      abi: SOULBOUND_ERC1155_ABI,
      functionName: 'mintNew',
      args: [tokenURI],
      value: mintPrice || 0n,
      chainId,
    })
  }

  // Get chain name for display
  const getChainName = () => {
    switch (chainId) {
      case CHAIN_IDS.MAINNET: return 'Ethereum'
      case CHAIN_IDS.SEPOLIA: return 'Sepolia'
      case CHAIN_IDS.POLYGON: return 'Polygon'
      case CHAIN_IDS.POLYGON_AMOY: return 'Polygon Amoy'
      default: return 'Unknown'
    }
  }

  return {
    // Public function
    mintNew,
    // Transaction state
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
    // Contract info
    contractAddress,
    contractName,
    contractSymbol,
    contractOwner,
    // Mint settings
    mintPrice,
    maxPerWallet,
    mintingEnabled,
    totalTokens,
    remainingMints,
    // User state
    isOwner,
    // Chain info
    chainId,
    chainName: getChainName(),
  }
}
