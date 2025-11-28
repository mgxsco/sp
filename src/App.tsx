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
    <div className="min-h-screen bg-lime font-tektur">
      <Header />

      <main className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {/* Tabs */}
        <div className="flex gap-8 mb-12 border-b border-black/10">
          <button
            onClick={() => setActiveTab('mint')}
            className={`font-tomorrow text-[11px] tracking-[0.2em] uppercase pb-4 transition-colors duration-300 ${
              activeTab === 'mint'
                ? 'text-black border-b border-black -mb-[1px]'
                : 'text-black/40 hover:text-black/60'
            }`}
          >
            Mint
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`font-tomorrow text-[11px] tracking-[0.2em] uppercase pb-4 transition-colors duration-300 ${
                activeTab === 'admin'
                  ? 'text-black border-b border-black -mb-[1px]'
                  : 'text-black/40 hover:text-black/60'
              }`}
            >
              Admin
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'mint' && <MintForm />}
        {activeTab === 'admin' && isOwner && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10">
        <div className="max-w-3xl mx-auto px-6 py-8 flex justify-between items-center">
          <p className="font-tomorrow text-black/30 text-[10px] tracking-[0.2em] uppercase">
            MGXS © {new Date().getFullYear()}
          </p>
          <a
            href="https://www.mgxs.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link font-tomorrow text-[10px] tracking-[0.2em] uppercase"
          >
            mgxs.co
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
