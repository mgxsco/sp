// Manifold ERC1155Creator ABI - For minting on Manifold contracts
// Contract: 0x8b0E7479FbBa239593F6B1D3a63945bC5399eA14 (Sepolia)
export const MANIFOLD_ERC1155_ABI = [
  // Mint new tokens with URIs (owner only)
  {
    inputs: [
      { name: 'to', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'uris', type: 'string[]' }
    ],
    name: 'mintBaseNew',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Mint existing token to addresses
  {
    inputs: [
      { name: 'to', type: 'address[]' },
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    name: 'mintBaseExisting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Get token URI
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Get balance of token for address
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
  // Get total supply of a token
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Check if address is admin
  {
    inputs: [{ name: 'admin', type: 'address' }],
    name: 'isAdmin',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Get contract owner
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Get contract name
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Get contract symbol
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Transfer event (ERC1155)
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

// Default contract address on Sepolia
export const DEFAULT_CONTRACT_ADDRESS = '0x8b0E7479FbBa239593F6B1D3a63945bC5399eA14' as const
