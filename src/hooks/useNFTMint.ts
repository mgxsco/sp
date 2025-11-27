import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { MANIFOLD_ERC1155_ABI, DEFAULT_CONTRACT_ADDRESS } from '../contracts/NFTContract'

const CONTRACT_ADDRESS = (import.meta.env.VITE_NFT_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS) as `0x${string}`

export function useNFTMint() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Get contract info
  const { data: contractName } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MANIFOLD_ERC1155_ABI,
    functionName: 'name',
  })

  const { data: contractSymbol } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MANIFOLD_ERC1155_ABI,
    functionName: 'symbol',
  })

  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MANIFOLD_ERC1155_ABI,
    functionName: 'owner',
  })

  // Check if connected wallet is admin/owner
  const { data: isAdmin } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MANIFOLD_ERC1155_ABI,
    functionName: 'isAdmin',
    args: address ? [address] : undefined,
  })

  const isOwner = address && contractOwner ? address.toLowerCase() === contractOwner.toLowerCase() : false
  const canMint = isOwner || isAdmin

  // Mint new NFT with URI (creates a new token ID)
  const mint = async (toAddress: `0x${string}`, tokenURI: string, amount: bigint = 1n) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MANIFOLD_ERC1155_ABI,
      functionName: 'mintBaseNew',
      args: [[toAddress], [amount], [tokenURI]],
    })
  }

  // Mint existing token (for editions)
  const mintExisting = async (toAddress: `0x${string}`, tokenId: bigint, amount: bigint = 1n) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MANIFOLD_ERC1155_ABI,
      functionName: 'mintBaseExisting',
      args: [[toAddress], [tokenId], [amount]],
    })
  }

  return {
    mint,
    mintExisting,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    contractAddress: CONTRACT_ADDRESS,
    contractName,
    contractSymbol,
    contractOwner,
    isAdmin,
    isOwner,
    canMint,
  }
}
