import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { PUBLIC_MINT_ERC1155_ABI, DEFAULT_CONTRACT_ADDRESS } from '../contracts/NFTContract'

const CONTRACT_ADDRESS = (import.meta.env.VITE_NFT_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS) as `0x${string}`

export function useNFTMint() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Get contract info
  const { data: contractName } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'name',
  })

  const { data: contractSymbol } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'symbol',
  })

  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
  })

  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintPrice',
  })

  const { data: maxPerWallet } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'maxPerWallet',
  })

  const { data: mintingEnabled } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
  })

  const { data: totalTokenTypes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'totalTokenTypes',
  })

  const { data: remainingMints } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'remainingMintsForWallet',
    args: address ? [address] : undefined,
  })

  const isOwner = address && contractOwner ? address.toLowerCase() === contractOwner.toLowerCase() : false

  // ============ Public Functions ============

  /**
   * Public mint - anyone can call this
   */
  const mint = async (tokenId: bigint, amount: bigint = 1n) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured')
    }

    const totalCost = (mintPrice || 0n) * amount

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'mint',
      args: [tokenId, amount],
      value: totalCost,
    })
  }

  /**
   * Public mint to specific address
   */
  const mintTo = async (toAddress: `0x${string}`, tokenId: bigint, amount: bigint = 1n) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured')
    }

    const totalCost = (mintPrice || 0n) * amount

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'mintTo',
      args: [toAddress, tokenId, amount],
      value: totalCost,
    })
  }

  // ============ Owner Functions ============

  /**
   * Create a new token type (owner only)
   */
  const createToken = async (tokenURI: string, maxSupply: bigint = 0n) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'createToken',
      args: [tokenURI, maxSupply],
    })
  }

  /**
   * Create and mint new token in one transaction (owner only)
   */
  const createAndMint = async (
    toAddress: `0x${string}`,
    tokenURI: string,
    maxSupply: bigint = 0n,
    amount: bigint = 1n
  ) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'createAndMint',
      args: [toAddress, tokenURI, maxSupply, amount],
    })
  }

  /**
   * Owner mint (bypasses payment)
   */
  const ownerMint = async (toAddress: `0x${string}`, tokenId: bigint, amount: bigint = 1n) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'ownerMint',
      args: [toAddress, tokenId, amount],
    })
  }

  /**
   * Set mint price (owner only)
   */
  const setMintPrice = async (price: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'setMintPrice',
      args: [price],
    })
  }

  /**
   * Set max per wallet (owner only)
   */
  const setMaxPerWallet = async (limit: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'setMaxPerWallet',
      args: [limit],
    })
  }

  /**
   * Enable/disable minting (owner only)
   */
  const setMintingEnabled = async (enabled: boolean) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'setMintingEnabled',
      args: [enabled],
    })
  }

  /**
   * Withdraw contract balance (owner only)
   */
  const withdraw = async () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_MINT_ERC1155_ABI,
      functionName: 'withdraw',
      args: [],
    })
  }

  return {
    // Public functions
    mint,
    mintTo,
    // Owner functions
    createToken,
    createAndMint,
    ownerMint,
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
    contractAddress: CONTRACT_ADDRESS,
    contractName,
    contractSymbol,
    contractOwner,
    // Mint settings
    mintPrice,
    maxPerWallet,
    mintingEnabled,
    totalTokenTypes,
    remainingMints,
    // User state
    isOwner,
  }
}
