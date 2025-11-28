import { ConnectButton } from '@rainbow-me/rainbowkit'

interface HeaderProps {
  activeTab: 'mint' | 'gallery' | 'admin'
  setActiveTab: (tab: 'mint' | 'gallery' | 'admin') => void
  isOwner: boolean
}

export function Header({ activeTab, setActiveTab, isOwner }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href="https://www.mgxs.co"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity"
        >
          <img
            src="https://images.squarespace-cdn.com/content/v1/6571e36aba71cb56d944e911/a11fb335-c0f5-42cf-bc6c-acf2330c6c48/MGXS_LOGO_BK.png"
            alt="MGXS"
            className="h-6 w-auto"
          />
        </a>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('mint')}
            className={`font-tomorrow text-[11px] tracking-[0.15em] uppercase px-4 py-2 transition-colors ${
              activeTab === 'mint'
                ? 'bg-black text-[#DFFF00]'
                : 'text-black/60 hover:text-black'
            }`}
          >
            Mint
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`font-tomorrow text-[11px] tracking-[0.15em] uppercase px-4 py-2 transition-colors ${
              activeTab === 'gallery'
                ? 'bg-black text-[#DFFF00]'
                : 'text-black/60 hover:text-black'
            }`}
          >
            Gallery
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`font-tomorrow text-[11px] tracking-[0.15em] uppercase px-4 py-2 transition-colors ${
                activeTab === 'admin'
                  ? 'bg-black text-[#DFFF00]'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Admin
            </button>
          )}
        </nav>

        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted
            const connected = ready && account && chain

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="font-tomorrow text-[11px] tracking-[0.15em] text-black/60 hover:text-black transition-colors uppercase"
                      >
                        Connect
                      </button>
                    )
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="font-tomorrow text-[11px] tracking-[0.15em] text-red-600 hover:text-red-500 transition-colors uppercase"
                      >
                        Wrong Network
                      </button>
                    )
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      className="font-tomorrow text-[11px] tracking-[0.15em] text-black/60 hover:text-black transition-colors"
                    >
                      {account.displayName}
                    </button>
                  )
                })()}
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
}
