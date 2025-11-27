import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-900">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <a href="https://www.mgxs.co" target="_blank" rel="noopener noreferrer" className="text-white font-medium tracking-widest text-sm hover:opacity-70 transition-opacity">
          MGXS
        </a>

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
                        className="text-xs tracking-wider text-gray-400 hover:text-white transition-colors uppercase"
                      >
                        Connect
                      </button>
                    )
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="text-xs tracking-wider text-red-400 hover:text-red-300 transition-colors uppercase"
                      >
                        Wrong Network
                      </button>
                    )
                  }

                  return (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={openChainModal}
                        className="text-xs tracking-wider text-gray-500 hover:text-white transition-colors uppercase"
                      >
                        {chain.name}
                      </button>
                      <button
                        onClick={openAccountModal}
                        className="text-xs tracking-wider text-gray-400 hover:text-white transition-colors"
                      >
                        {account.displayName}
                      </button>
                    </div>
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
