import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1440px] mx-auto px-[6vw] md:px-[4vw] py-5 flex items-center justify-between">
        <a
          href="https://www.mgxs.co"
          target="_blank"
          rel="noopener noreferrer"
          className="font-tomorrow text-white text-sm tracking-[0.3em] uppercase hover:opacity-60 transition-opacity duration-300"
        >
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
                        className="font-tomorrow text-[10px] tracking-[0.2em] text-white/50 hover:text-white transition-colors duration-300 uppercase"
                      >
                        Connect Wallet
                      </button>
                    )
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="font-tomorrow text-[10px] tracking-[0.2em] text-red-400 hover:text-red-300 transition-colors duration-300 uppercase"
                      >
                        Wrong Network
                      </button>
                    )
                  }

                  return (
                    <div className="flex items-center gap-6">
                      <button
                        onClick={openChainModal}
                        className="font-tomorrow text-[10px] tracking-[0.2em] text-white/30 hover:text-white transition-colors duration-300 uppercase"
                      >
                        {chain.name}
                      </button>
                      <button
                        onClick={openAccountModal}
                        className="font-tomorrow text-[10px] tracking-[0.2em] text-white/50 hover:text-white transition-colors duration-300"
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
