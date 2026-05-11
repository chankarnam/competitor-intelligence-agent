import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Globe, Shield } from 'lucide-react'
import type { AnalysisFormData } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const [productName, setProductName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim()) {
      setError('Please enter your product name.')
      return
    }
    const formData: AnalysisFormData = { product_name: productName.trim() }
    navigate('/results', { state: { formData } })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero — unchanged */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
          AI-Powered Competitive Intelligence
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 tracking-tight mb-4">
          Know exactly how to{' '}
          <span className="text-gradient">win every deal</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Tell us your product — the AI agent autonomously discovers your top
          competitors, scrapes their pricing and reviews, and generates battle-ready cards
          in minutes.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          {[
            { icon: Globe, label: 'Auto-discovers competitors' },
            { icon: BarChart3, label: 'Structured battle cards' },
            { icon: Shield, label: 'Powered by Claude AI' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full"
            >
              <Icon className="w-3.5 h-3.5 text-indigo-400" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Single-input form */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
        <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="product-name">
          What's your product?
        </label>

        <input
          id="product-name"
          type="text"
          className="input text-base mb-3"
          placeholder="e.g. Acme CRM, Notion, Linear..."
          value={productName}
          onChange={(e) => {
            setProductName(e.target.value)
            if (error) setError(null)
          }}
          autoFocus
        />

        {error && (
          <p className="text-sm text-red-400 mb-3">{error}</p>
        )}

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
        >
          Discover My Competitors
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-xs text-zinc-600 mt-4">
          The agent discovers 5 competitors autonomously and typically takes 3–6 minutes.
        </p>
      </form>
    </div>
  )
}
