import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { PUBLIC_MINT_ERC1155_ABI, getContractAddress } from '../contracts/NFTContract'
import { useActiveChain } from '../contexts/ChainContext'

export function useNFTMint() {
  const { address } = useAccount()
  const { activeChainId } = useActiveChain()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  // Get contract address for active chain (set by admin)
  const contractAddress = getContractAddress(activeChainId)

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Get contract info - read from the ACTIVE chain, not wallet's connected chain
  const { data: contractName } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'name',
    chainId: activeChainId,
    query: { enabled: !!contractAddress },
  })

  const { data: contractSymbol } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'symbol',
    chainId: activeChainId,
    query: { enabled: !!contractAddress },
  })

  const { data: contractOwner } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: activeChainId,
    query: { enabled: !!contractAddress },
  })

  const { data: mintPrice } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintPrice',
    chainId: activeChainId,
    query: { enabled: !!contractAddress },
  })

  const { data: maxPerWallet } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'maxPerWallet',
    chainId: activeChainId,
    query: { enabled: !!contractAddress },
  })

  const { data: mintingEnabled } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    chainId: activeChainId,
    query: { enabled: !!contractAddress },
  })

  const { data: totalTokens } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'totalTokens',
    chainId: activeChainId,
    query: { enabled: !!contractAddress },
  })

  const { data: nextTokenId } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'nextTokenId',
    chainId: activeChainId,
    query: { enabled: !!contractAddress },
  })

  const { data: remainingMints } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'remainingMintsForWallet',
    args: address ? [address] : undefined,
    chainId: activeChainId,
    query: { enabled: !!contractAddress && !!address },
  })

  const isOwner = address && contractOwner ? address.toLowerCase() === contractOwner.toLowerCase() : false

  // ============ Public Functions ============

  /**
   * Mint a NEW token with your own URI - anyone can call this
   */
  const mintNew = async (tokenURI: string) => {
    if (!contractAddress) {
      throw new Error('NFT contract not deployed on this chain')
    }

    writeContract({
      address: contractAddress,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'mintNew',
      args: [tokenURI],
      value: mintPrice || 0n,
      chainId: activeChainId,
    })
  }

  // ============ Owner Functions ============

  /**
   * Owner mint new token (bypasses payment)
   */
  const ownerMintNew = async (toAddress: `0x${string}`, tokenURI: string) => {
    if (!contractAddress) {
      throw new Error('NFT contract not deployed on this chain')
    }

    writeContract({
      address: contractAddress,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'ownerMintNew',
      args: [toAddress, tokenURI],
      chainId: activeChainId,
    })
  }

  /**
   * Set mint price (owner only)
   */
  const setMintPrice = async (price: bigint) => {
    if (!contractAddress) throw new Error('No contract on this chain')
    writeContract({
      address: contractAddress,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'setMintPrice',
      args: [price],
      chainId: activeChainId,
    })
  }

  /**
   * Set max per wallet (owner only)
   */
  const setMaxPerWallet = async (limit: bigint) => {
    if (!contractAddress) throw new Error('No contract on this chain')
    writeContract({
      address: contractAddress,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'setMaxPerWallet',
      args: [limit],
      chainId: activeChainId,
    })
  }

  /**
   * Enable/disable minting (owner only)
   */
  const setMintingEnabled = async (enabled: boolean) => {
    if (!contractAddress) throw new Error('No contract on this chain')
    writeContract({
      address: contractAddress,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'setMintingEnabled',
      args: [enabled],
      chainId: activeChainId,
    })
  }

  /**
   * Withdraw contract balance (owner only)
   */
  const withdraw = async () => {
    if (!contractAddress) throw new Error('No contract on this chain')
    writeContract({
      address: contractAddress,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'withdraw',
      args: [],
      chainId: activeChainId,
    })
  }

  return {
    // Public function - anyone can mint
    mintNew,
    // Owner functions
    ownerMintNew,
    setMintPrice,
    setMaxPerWallet,
    setMintingEnabled,
    withdraw,
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
    nextTokenId,
    remainingMints,
    // User state
    isOwner,
    // Chain info
    activeChainId,
  }
}
