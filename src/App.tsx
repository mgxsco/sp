import { useState } from 'react'
import { Header, Section } from './components/Header'
import { MintForm } from './components/MintForm'
import { SoulboundMintForm } from './components/SoulboundMintForm'
import { Gallery } from './components/Gallery'
import { SeedMintingSection } from './components/SeedMintingSection'
import { AdminPanel } from './components/AdminPanel'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('mint')

  const getSectionContent = () => {
    switch (activeSection) {
      case 'mint':
        return {
          title: 'Mint',
          description: 'Upload your artwork and mint it directly to the blockchain. Each piece becomes a unique token in the collection.',
        }
      case 'soulbound':
        return {
          title: 'Soulbound',
          description: 'Mint non-transferable tokens bound to your wallet forever. These tokens cannot be sold or transferred, only burned.',
        }
      case 'gallery':
        return {
          title: 'Gallery',
          description: 'Browse all minted NFTs from the collections.',
        }
      case 'seedminting':
        return {
          title: 'Seed Minting',
          description: 'Mint seeds, burn to reveal AI-generated artwork, and mint your favorites.',
        }
    }
  }

  const content = getSectionContent()

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-tektur">
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="max-w-[1200px] mx-auto px-6 pt-24 pb-20">
        {/* Hero Section */}
        <div className="mb-8 pt-8">
          <h1 className="font-tomorrow text-3xl font-medium text-black tracking-wide uppercase mb-2">
            {content.title}
          </h1>
          <p className="text-black/50 text-sm max-w-lg">
            {content.description}
          </p>
        </div>

        {/* Content */}
        {activeSection === 'mint' && <MintForm />}
        {activeSection === 'soulbound' && <SoulboundMintForm />}
        {activeSection === 'gallery' && <Gallery />}
        {activeSection === 'seedminting' && <SeedMintingSection />}

        {/* Admin Panel - Only visible to contract owner on mint sections */}
        {(activeSection === 'mint' || activeSection === 'soulbound') && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-tomorrow text-black/30 text-[10px] tracking-[0.15em] uppercase">
            MGXS © {new Date().getFullYear()}
          </p>
          <div className="flex gap-6">
            <a
              href="https://www.mgxs.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 hover:text-black transition-colors uppercase"
            >
              Website
            </a>
            <a
              href="https://www.mgxs.co/art"
              target="_blank"
              rel="noopener noreferrer"
              className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 hover:text-black transition-colors uppercase"
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
