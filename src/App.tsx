import { Header } from './components/Header'
import { MintForm } from './components/MintForm'

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-5xl mx-auto px-6 md:px-8 py-16 md:py-24">
        {/* Hero Section */}
        <div className="mb-16 md:mb-24">
          <h1 className="text-3xl md:text-5xl font-light text-white tracking-tight mb-4">
            MINT
          </h1>
          <div className="h-px bg-white w-16 mb-6"></div>
          <p className="text-gray-400 text-sm md:text-base max-w-lg font-light leading-relaxed">
            Upload your artwork and mint it directly to the blockchain.
            Connect your wallet to begin.
          </p>
        </div>

        {/* Mint Form */}
        <MintForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs tracking-wide">
            MGXS © {new Date().getFullYear()}
          </p>
          <div className="flex gap-6">
            <a href="https://www.mgxs.co" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-xs tracking-wide transition-colors underline-animate">
              WEBSITE
            </a>
            <a href="https://www.mgxs.co/art" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-xs tracking-wide transition-colors underline-animate">
              ART
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
