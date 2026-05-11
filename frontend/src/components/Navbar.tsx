import { Link, useLocation } from 'react-router-dom'
import { Zap, History, Home } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-zinc-100 bg-zinc-800'
      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-zinc-100 text-sm tracking-tight">
              Intel<span className="text-indigo-400">Agent</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive('/')}`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Analysis</span>
            </Link>
            <Link
              to="/history"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive('/history')}`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
