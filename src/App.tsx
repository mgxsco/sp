import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { Header } from './components/Header'
import { MintForm } from './components/MintForm'
import { AdminPanel } from './components/AdminPanel'
import { Gallery } from './components/Gallery'
import { SoulboundMintForm } from './components/SoulboundMintForm'
import { getContractAddress, PUBLIC_MINT_ERC1155_ABI, CHAIN_IDS } from './contracts/NFTContract'

type Tab = 'mint' | 'soulbound' | 'gallery' | 'admin'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('mint')
  const { address } = useAccount()

  // Check owner on all chains - admin can control from any chain
  const { data: sepoliaOwner } = useReadContract({
    address: getContractAddress(CHAIN_IDS.SEPOLIA) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: CHAIN_IDS.SEPOLIA,
    query: { enabled: !!getContractAddress(CHAIN_IDS.SEPOLIA) },
  })

  const { data: mainnetOwner } = useReadContract({
    address: getContractAddress(CHAIN_IDS.MAINNET) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: CHAIN_IDS.MAINNET,
    query: { enabled: !!getContractAddress(CHAIN_IDS.MAINNET) },
  })

  const { data: polygonOwner } = useReadContract({
    address: getContractAddress(CHAIN_IDS.POLYGON) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: CHAIN_IDS.POLYGON,
    query: { enabled: !!getContractAddress(CHAIN_IDS.POLYGON) },
  })

  const { data: amoyOwner } = useReadContract({
    address: getContractAddress(CHAIN_IDS.POLYGON_AMOY) || undefined,
    abi: PUBLIC_MINT_ERC1155_ABI,
    functionName: 'owner',
    chainId: CHAIN_IDS.POLYGON_AMOY,
    query: { enabled: !!getContractAddress(CHAIN_IDS.POLYGON_AMOY) },
  })

  // Check if wallet is owner on ANY chain
  const isOwnerOnAnyChain = address && (
    (sepoliaOwner && address.toLowerCase() === (sepoliaOwner as string).toLowerCase()) ||
    (mainnetOwner && address.toLowerCase() === (mainnetOwner as string).toLowerCase()) ||
    (polygonOwner && address.toLowerCase() === (polygonOwner as string).toLowerCase()) ||
    (amoyOwner && address.toLowerCase() === (amoyOwner as string).toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-tektur flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isOwner={!!isOwnerOnAnyChain} />

      <main className="flex-1 max-w-[800px] w-full mx-auto px-6 py-8">
        <div className="bg-white shadow-sm p-8">
          {activeTab === 'mint' && <MintForm />}
          {activeTab === 'soulbound' && <SoulboundMintForm />}
          {activeTab === 'gallery' && <Gallery />}
          {activeTab === 'admin' && isOwnerOnAnyChain && <AdminPanel />}
        </div>
      </main>

      <footer className="bg-black text-white/60 py-6">
        <div className="max-w-[800px] mx-auto px-6 flex justify-between items-center">
          <p className="font-tomorrow text-[10px] tracking-[0.15em] uppercase">
            MGXS © {new Date().getFullYear()}
          </p>
          <a
            href="https://www.mgxs.co"
            target="_blank"
            rel="noopener noreferrer"
            className="font-tomorrow text-[10px] tracking-[0.15em] uppercase hover:text-white transition-colors"
          >
            mgxs.co
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
