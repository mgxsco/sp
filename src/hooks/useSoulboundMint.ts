import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi'
import { SOULBOUND_MINT_ERC1155_ABI } from '../contracts/SoulboundNFTContract'

// Network-specific contract addresses (using existing Vercel env vars)
// Note: _ADDRESS suffix = Mainnet, _SEPOLIA suffix = Sepolia
const CONTRACT_ADDRESSES: Record<number, `0x${string}` | undefined> = {
  1: import.meta.env.VITE_SOULBOUND_CONTRACT_ADDRESS as `0x${string}`, // Mainnet
  // 11155111: add VITE_SOULBOUND_CONTRACT_SEPOLIA when deployed
}

export function useSoulboundMint() {
  const { address } = useAccount()
  const chainId = useChainId()
  const CONTRACT_ADDRESS = CONTRACT_ADDRESSES[chainId] || '' as `0x${string}`
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Get contract info
  const { data: contractName } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'name',
  })

  const { data: contractSymbol } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'symbol',
  })

  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'owner',
  })

  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'mintPrice',
  })

  const { data: maxPerWallet } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'maxPerWallet',
  })

  const { data: mintingEnabled } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'mintingEnabled',
  })

  const { data: totalTokens } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'totalTokens',
  })

  const { data: nextTokenId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'nextTokenId',
  })

  const { data: remainingMints } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_MINT_ERC1155_ABI,
    functionName: 'remainingMintsForWallet',
    args: address ? [address] : undefined,
  })

  const isOwner = address && contractOwner ? address.toLowerCase() === contractOwner.toLowerCase() : false

  // ============ Public Functions ============

  /**
   * Mint a NEW token with your own URI - anyone can call this
   */
  const mintNew = async (tokenURI: string) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Soulbound contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SOULBOUND_MINT_ERC1155_ABI,
      functionName: 'mintNew',
      args: [tokenURI],
      value: mintPrice || 0n,
    })
  }

  /**
   * Burn a token - only token owner can call this
   */
  const burn = async (tokenId: bigint) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Soulbound contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SOULBOUND_MINT_ERC1155_ABI,
      functionName: 'burn',
      args: [tokenId],
    })
  }

  // ============ Owner Functions ============

  /**
   * Owner mint new token (bypasses payment)
   */
  const ownerMintNew = async (toAddress: `0x${string}`, tokenURI: string) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Soulbound contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SOULBOUND_MINT_ERC1155_ABI,
      functionName: 'ownerMintNew',
      args: [toAddress, tokenURI],
    })
  }

  /**
   * Set mint price (owner only)
   */
  const setMintPrice = async (price: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SOULBOUND_MINT_ERC1155_ABI,
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
      abi: SOULBOUND_MINT_ERC1155_ABI,
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
      abi: SOULBOUND_MINT_ERC1155_ABI,
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
      abi: SOULBOUND_MINT_ERC1155_ABI,
      functionName: 'withdraw',
      args: [],
    })
  }

  return {
    // Public functions
    mintNew,
    burn,
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
    contractAddress: CONTRACT_ADDRESS,
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
  }
}
