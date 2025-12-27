import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi'
import { REVEALED_ERC1155_ABI } from '../contracts/RevealedContract'

// Network-specific contract addresses
const CONTRACT_ADDRESSES: Record<number, `0x${string}` | undefined> = {
  1: import.meta.env.VITE_REVEALED_CONTRACT_MAINNET as `0x${string}`,        // Ethereum Mainnet
  11155111: import.meta.env.VITE_REVEALED_CONTRACT_SEPOLIA as `0x${string}`, // Sepolia
  137: import.meta.env.VITE_REVEALED_CONTRACT_POLYGON as `0x${string}`,      // Polygon Mainnet
  80002: import.meta.env.VITE_REVEALED_CONTRACT_AMOY as `0x${string}`,       // Polygon Amoy
}

export function useRevealed() {
  const { address } = useAccount()
  const chainId = useChainId()
  const CONTRACT_ADDRESS = CONTRACT_ADDRESSES[chainId] || '' as `0x${string}`
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Contract info
  const { data: contractName } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REVEALED_ERC1155_ABI,
    functionName: 'name',
  })

  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REVEALED_ERC1155_ABI,
    functionName: 'owner',
  })

  const { data: totalTokens } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REVEALED_ERC1155_ABI,
    functionName: 'totalTokens',
  })

  const { data: nextTokenId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REVEALED_ERC1155_ABI,
    functionName: 'nextTokenId',
  })

  const { data: seedContract } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REVEALED_ERC1155_ABI,
    functionName: 'seedContract',
  })

  const isOwner = address && contractOwner ? address.toLowerCase() === contractOwner.toLowerCase() : false

  // ============ Public Functions ============

  const mintRevealed = async (tokenURI: string) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Revealed contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: REVEALED_ERC1155_ABI,
      functionName: 'mintRevealed',
      args: [tokenURI],
    })
  }

  // ============ Owner Functions ============

  const setSeedContract = async (seedContractAddress: `0x${string}`) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: REVEALED_ERC1155_ABI,
      functionName: 'setSeedContract',
      args: [seedContractAddress],
    })
  }

  const ownerMint = async (toAddress: `0x${string}`, tokenURI: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: REVEALED_ERC1155_ABI,
      functionName: 'ownerMint',
      args: [toAddress, tokenURI],
    })
  }

  return {
    // Public functions
    mintRevealed,
    // Owner functions
    setSeedContract,
    ownerMint,
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
    contractOwner,
    totalTokens,
    nextTokenId,
    seedContract,
    // User state
    isOwner,
  }
}
