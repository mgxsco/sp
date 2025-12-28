import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from 'wagmi'
import { SEED_ERC1155_ABI } from '../contracts/SeedContract'

// Network-specific contract addresses (using existing Vercel env vars)
// Note: _ADDRESS suffix = Mainnet, _SEPOLIA suffix = Sepolia
const CONTRACT_ADDRESSES: Record<number, `0x${string}` | undefined> = {
  1: import.meta.env.VITE_SEED_CONTRACT_ADDRESS as `0x${string}`, // Mainnet
  // 11155111: add VITE_SEED_CONTRACT_SEPOLIA when deployed
}

export function useSeed() {
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
    abi: SEED_ERC1155_ABI,
    functionName: 'name',
  })

  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'owner',
  })

  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'mintPrice',
  })

  const { data: maxSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'maxSupply',
  })

  const { data: totalMinted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'totalMinted',
  })

  const { data: mintingEnabled } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'mintingEnabled',
  })

  const { data: allowMultipleBurns } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'allowMultipleBurns',
  })

  const { data: remainingSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'remainingSupply',
  })

  // User-specific data
  const { data: seedBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'getSeedBalance',
    args: address ? [address] : undefined,
  })

  const { data: canBurn } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'canBurn',
    args: address ? [address] : undefined,
  })

  const { data: pendingReveals } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'pendingReveals',
    args: address ? [address] : undefined,
  })

  const { data: walletBurnCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SEED_ERC1155_ABI,
    functionName: 'walletBurnCount',
    args: address ? [address] : undefined,
  })

  const isOwner = address && contractOwner ? address.toLowerCase() === contractOwner.toLowerCase() : false

  // ============ Public Functions ============

  const mintSeed = async () => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Seed contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SEED_ERC1155_ABI,
      functionName: 'mintSeed',
      value: mintPrice || 0n,
    })
  }

  const burnSeed = async () => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Seed contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SEED_ERC1155_ABI,
      functionName: 'burnSeed',
    })
  }

  // ============ Owner Functions ============

  const setMintPrice = async (price: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SEED_ERC1155_ABI,
      functionName: 'setMintPrice',
      args: [price],
    })
  }

  const setMaxSupply = async (supply: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SEED_ERC1155_ABI,
      functionName: 'setMaxSupply',
      args: [supply],
    })
  }

  const setMintingEnabled = async (enabled: boolean) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SEED_ERC1155_ABI,
      functionName: 'setMintingEnabled',
      args: [enabled],
    })
  }

  const setAllowMultipleBurns = async (allowed: boolean) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SEED_ERC1155_ABI,
      functionName: 'setAllowMultipleBurns',
      args: [allowed],
    })
  }

  const withdraw = async () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SEED_ERC1155_ABI,
      functionName: 'withdraw',
    })
  }

  const grantPendingReveal = async (userAddress: `0x${string}`, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SEED_ERC1155_ABI,
      functionName: 'grantPendingReveal',
      args: [userAddress, amount],
    })
  }

  return {
    // Public functions
    mintSeed,
    burnSeed,
    // Owner functions
    setMintPrice,
    setMaxSupply,
    setMintingEnabled,
    setAllowMultipleBurns,
    withdraw,
    grantPendingReveal,
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
    mintPrice,
    maxSupply,
    totalMinted,
    mintingEnabled,
    allowMultipleBurns,
    remainingSupply,
    // User state
    seedBalance,
    canBurn,
    pendingReveals,
    walletBurnCount,
    isOwner,
  }
}
