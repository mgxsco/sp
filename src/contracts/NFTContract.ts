// PublicMintERC1155 ABI - Anyone can mint new NFTs
// Deploy using contracts/PublicMintERC1155.sol
export const PUBLIC_MINT_ERC1155_ABI = [
  // ============ Public Minting ============
  {
    inputs: [{ name: 'tokenURI', type: 'string' }],
    name: 'mintNew',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },

  // ============ Owner Functions ============
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'ownerMintNew',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'setTokenURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_mintPrice', type: 'uint256' }],
    name: 'setMintPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_maxPerWallet', type: 'uint256' }],
    name: 'setMaxPerWallet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_enabled', type: 'bool' }],
    name: 'setMintingEnabled',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // ============ View Functions ============
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'mintPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'maxPerWallet',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'mintingEnabled',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalTokens',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'nextTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenExists',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenCreator',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'wallet', type: 'address' }],
    name: 'remainingMintsForWallet',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'wallet', type: 'address' }],
    name: 'walletMintCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'uri', type: 'string' }
    ],
    name: 'TokenCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'operator', type: 'address' },
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'id', type: 'uint256' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'TransferSingle',
    type: 'event'
  }
] as const

// Chain IDs
export const CHAIN_IDS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  POLYGON: 137,
  POLYGON_AMOY: 80002,
} as const

// Contract addresses per chain - Update after deploying your contracts
export const CONTRACT_ADDRESSES: Record<number, `0x${string}` | ''> = {
  [CHAIN_IDS.MAINNET]: (import.meta.env.VITE_CONTRACT_MAINNET || '') as `0x${string}`,
  [CHAIN_IDS.SEPOLIA]: (import.meta.env.VITE_CONTRACT_SEPOLIA || '') as `0x${string}`,
  [CHAIN_IDS.POLYGON]: (import.meta.env.VITE_CONTRACT_POLYGON || '') as `0x${string}`,
  [CHAIN_IDS.POLYGON_AMOY]: (import.meta.env.VITE_CONTRACT_POLYGON_AMOY || '') as `0x${string}`,
}

// Legacy fallback - for backwards compatibility
export const DEFAULT_CONTRACT_ADDRESS = (import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '') as `0x${string}`

// Get contract address for a specific chain
export function getContractAddress(chainId: number): `0x${string}` | null {
  const address = CONTRACT_ADDRESSES[chainId] || DEFAULT_CONTRACT_ADDRESS
  return address && address.length > 0 ? address : null
}
