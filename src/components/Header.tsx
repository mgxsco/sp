import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-lime/95 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href="https://www.mgxs.co"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity duration-300"
        >
          <img
            src="https://images.squarespace-cdn.com/content/v1/6571e36aba71cb56d944e911/a11fb335-c0f5-42cf-bc6c-acf2330c6c48/MGXS_LOGO_BK.png"
            alt="MGXS"
            className="h-6 w-auto"
          />
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
                        className="font-tomorrow text-[10px] tracking-[0.15em] text-black/60 hover:text-black transition-colors duration-300 uppercase"
                      >
                        Connect
                      </button>
                    )
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="font-tomorrow text-[10px] tracking-[0.15em] text-red-600 hover:text-red-500 transition-colors duration-300 uppercase"
                      >
                        Wrong Network
                      </button>
                    )
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      className="font-tomorrow text-[10px] tracking-[0.15em] text-black/60 hover:text-black transition-colors duration-300"
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
