import { useState } from 'react'
import { Header } from './components/Header'
import { MintForm } from './components/MintForm'
import { AdminPanel } from './components/AdminPanel'
import { useNFTMint } from './hooks/useNFTMint'

type Tab = 'mint' | 'admin'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('mint')
  const { isOwner } = useNFTMint()

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-tektur flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isOwner={isOwner} />

      <main className="flex-1 max-w-[800px] w-full mx-auto px-6 py-8">
        <div className="bg-white shadow-sm p-8">
          {activeTab === 'mint' && <MintForm />}
          {activeTab === 'admin' && isOwner && <AdminPanel />}
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
