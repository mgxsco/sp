import { ConnectButton } from '@rainbow-me/rainbowkit'

export type Section = 'mint' | 'soulbound' | 'gallery' | 'abxd'

interface HeaderProps {
  activeSection: Section
  onSectionChange: (section: Section) => void
}

export function Header({ activeSection, onSectionChange }: HeaderProps) {
  const sections: { id: Section; label: string }[] = [
    { id: 'mint', label: 'MINT' },
    { id: 'soulbound', label: 'SOULBOUND' },
    { id: 'gallery', label: 'GALLERY' },
    { id: 'abxd', label: 'ABXD' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10">
      <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a
          href="https://www.mgxs.co"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity duration-300"
        >
          <img
            src="https://images.squarespace-cdn.com/content/v1/6571e36aba71cb56d944e911/a11fb335-c0f5-42cf-bc6c-acf2330c6c48/MGXS_LOGO_BK.png"
            alt="MGXS"
            className="h-8 w-auto"
          />
        </a>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`px-4 py-2 font-tomorrow text-[11px] tracking-[0.1em] transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-lime text-black'
                  : 'text-black/50 hover:text-black'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {/* Wallet */}
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
                        className="font-tomorrow text-[11px] tracking-[0.1em] text-black/50 hover:text-black transition-colors duration-200"
                      >
                        Connect
                      </button>
                    )
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="font-tomorrow text-[11px] tracking-[0.1em] text-red-600 hover:text-red-500 transition-colors duration-200"
                      >
                        Wrong Network
                      </button>
                    )
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      className="font-tomorrow text-[11px] tracking-[0.1em] text-black/50 hover:text-black transition-colors duration-200"
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
