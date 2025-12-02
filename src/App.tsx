import { useState } from 'react'
import { Header, Section } from './components/Header'
import { MintForm } from './components/MintForm'
import { SoulboundMintForm } from './components/SoulboundMintForm'
import { Gallery } from './components/Gallery'
import { AdminPanel } from './components/AdminPanel'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('mint')

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'mint':
        return 'Mint'
      case 'soulbound':
        return 'Soulbound'
      case 'gallery':
        return 'Gallery'
    }
  }

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'mint':
        return 'Upload your artwork and mint it directly to the blockchain. Each piece becomes a unique token in the collection.'
      case 'soulbound':
        return 'Mint non-transferable tokens bound to your wallet forever. These tokens cannot be sold or transferred, only burned.'
      case 'gallery':
        return 'Browse all minted tokens from both collections. View metadata, attributes, and burn your soulbound tokens.'
    }
  }

  return (
    <div className="min-h-screen bg-lime font-tektur">
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="max-w-[1440px] mx-auto px-[6vw] md:px-[4vw] pt-32 pb-20">
        {/* Hero Section */}
        <div className="mb-20 fade-in">
          <h1 className="font-tomorrow text-4xl md:text-6xl font-medium text-black tracking-wide uppercase mb-6 draw-line pb-4">
            {getSectionTitle()}
          </h1>
          <p className="text-black/60 text-sm md:text-base max-w-md leading-relaxed fade-in-delay">
            {getSectionDescription()}
          </p>
        </div>

        {/* Content */}
        {activeSection === 'mint' && <MintForm />}
        {activeSection === 'soulbound' && <SoulboundMintForm />}
        {activeSection === 'gallery' && <Gallery />}

        {/* Admin Panel - Only visible to contract owner on mint sections */}
        {(activeSection === 'mint' || activeSection === 'soulbound') && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10">
        <div className="max-w-[1440px] mx-auto px-[6vw] md:px-[4vw] py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-tomorrow text-black/40 text-[10px] tracking-[0.2em] uppercase">
            MGXS © {new Date().getFullYear()}
          </p>
          <div className="flex gap-8">
            <a
              href="https://www.mgxs.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link font-tomorrow text-[10px] tracking-[0.2em] uppercase"
            >
              Website
            </a>
            <a
              href="https://www.mgxs.co/art"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link font-tomorrow text-[10px] tracking-[0.2em] uppercase"
            >
              Art
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
