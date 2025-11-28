import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi'
import { PUBLIC_MINT_ERC1155_ABI, getContractAddress } from '../contracts/NFTContract'

export function useNFTMint() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  // Get contract address for current chain
  const contractAddress = getContractAddress(chainId)

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Get contract info - only query if we have a valid contract address
  const { data: contractName } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'name',
    query: { enabled: !!contractAddress },
  })

  const { data: contractSymbol } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'symbol',
    query: { enabled: !!contractAddress },
  })

  const { data: contractOwner } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    query: { enabled: !!contractAddress },
  })

  const { data: mintPrice } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintPrice',
    query: { enabled: !!contractAddress },
  })

  const { data: maxPerWallet } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'maxPerWallet',
    query: { enabled: !!contractAddress },
  })

  const { data: mintingEnabled } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
    query: { enabled: !!contractAddress },
  })

  const { data: totalTokens } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'totalTokens',
    query: { enabled: !!contractAddress },
  })

  const { data: nextTokenId } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'nextTokenId',
    query: { enabled: !!contractAddress },
  })

  const { data: remainingMints } = useReadContract({
    address: contractAddress || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'remainingMintsForWallet',
    args: address ? [address] : undefined,
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
    chainId,
  }
}
