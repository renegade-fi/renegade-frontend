'use client'

export function Header() {
  return (
    <header className="flex items-center justify-between bg-black p-4 text-white">
      <div className="flex items-center space-x-4">
        <nav className="flex space-x-4">
          <a href="#" className="hover:underline">
            Trade
          </a>
          <a href="#" className="hover:underline">
            Assets
          </a>
          <a href="#" className="hover:underline">
            Orders
          </a>
          <a href="#" className="hover:underline">
            Stats
          </a>
        </nav>
      </div>
      <div className="flex space-x-4">
        <a href="#" className="hover:underline">
          Deposit
        </a>
        <a href="#" className="hover:underline">
          Connect Wallet
        </a>
      </div>
    </header>
  )
}
