# NFT Minting Website

A modern, user-friendly NFT minting application built with React, Vite, and Web3 technologies.

## Features

- **Wallet Connection** - Connect with MetaMask, WalletConnect, Coinbase Wallet, and more via RainbowKit
- **File Upload** - Drag and drop support for images, videos, and audio files
- **IPFS Storage** - Decentralized storage via Pinata IPFS
- **Custom Metadata** - Add name, description, and custom attributes to your NFTs
- **Multi-Chain Support** - Works with Ethereum, Polygon, and testnets
- **Modern UI** - Clean, responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Web3 wallet (MetaMask, etc.)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment example file:

```bash
cp .env.example .env
```

3. Configure your environment variables:

```env
# Get a project ID from https://cloud.walletconnect.com/
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id

# Deploy the NFT contract and add the address
VITE_NFT_CONTRACT_ADDRESS=0x...

# Optional: Pinata IPFS keys for production
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
```

4. Start the development server:

```bash
npm run dev
```

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

### Manual Deploy

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "New Project" and import your repository

4. Configure Environment Variables in Vercel dashboard:
   - `VITE_WALLET_CONNECT_PROJECT_ID` - Your WalletConnect project ID
   - `VITE_NFT_CONTRACT_ADDRESS` - Your deployed NFT contract address
   - `VITE_PINATA_API_KEY` - Pinata API key (optional)
   - `VITE_PINATA_SECRET_KEY` - Pinata secret key (optional)

5. Click "Deploy"

Vercel will automatically detect Vite and configure the build settings.

## Smart Contract

The project includes a reference ERC-721 smart contract in `src/contracts/NFTContract.ts`. To deploy:

1. Use Remix, Hardhat, or Foundry to deploy the contract
2. Add the deployed contract address to your `.env` file

### Contract Features

- ERC-721 compliant NFT
- Custom metadata URI per token
- Configurable mint price
- Max supply limit
- Owner withdrawal function

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **RainbowKit** - Wallet connection UI
- **wagmi** - React hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **react-dropzone** - File upload handling

## Project Structure

```
src/
├── components/
│   ├── Header.tsx       # Navigation with wallet connection
│   ├── FileUpload.tsx   # Drag-and-drop file upload
│   └── MintForm.tsx     # Main minting form and preview
├── contracts/
│   └── NFTContract.ts   # Contract ABI and source
├── hooks/
│   ├── useNFTMint.ts    # Minting hook with wagmi
│   └── useIPFSUpload.ts # IPFS upload hook
├── App.tsx              # Main application
├── main.tsx             # Entry point
├── providers.tsx        # Web3 providers setup
├── wagmi.ts             # wagmi configuration
└── index.css            # Global styles
```

## License

MIT
