import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { NFT_CONTRACT_ABI } from '../contracts/NFTContract'

const CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS as `0x${string}` | undefined

export function useNFTMint() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'mintPrice',
  })

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'totalSupply',
  })

  const { data: maxSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'maxSupply',
  })

  const mint = async (toAddress: `0x${string}`, tokenURI: string) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured')
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: NFT_CONTRACT_ABI,
      functionName: 'mintNFT',
      args: [toAddress, tokenURI],
      value: mintPrice || parseEther('0.01'),
    })
  }

  return {
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    mintPrice,
    totalSupply,
    maxSupply,
    contractAddress: CONTRACT_ADDRESS,
  }
}
