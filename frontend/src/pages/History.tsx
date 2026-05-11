import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, BarChart3, Trash2, ExternalLink, History as HistoryIcon, Zap } from 'lucide-react'
import type { AnalysisListItem } from '../types'

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function History() {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyses()
  }, [])

  async function fetchAnalyses() {
    try {
      const res = await fetch('/api/analyses')
      if (!res.ok) throw new Error('Failed to load history')
      const data = await res.json()
      setAnalyses(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this analysis? This cannot be undone.')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setAnalyses((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      alert('Failed to delete analysis. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-zinc-400 text-sm">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
          Loading history...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <HistoryIcon className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-zinc-100">Analysis History</h1>
          </div>
          <p className="text-sm text-zinc-500">
            {analyses.length} past{' '}
            {analyses.length === 1 ? 'analysis' : 'analyses'} saved
          </p>
        </div>
        <Link to="/" className="btn-primary flex items-center gap-2 text-sm">
          <Zap className="w-3.5 h-3.5" />
          New Analysis
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {analyses.length === 0 ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-400 mb-2">No analyses yet</h2>
          <p className="text-sm text-zinc-600 mb-6">
            Run your first competitive analysis to see results here.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Get Started
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="card p-5 hover:border-zinc-700 transition-colors duration-150"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-zinc-100 truncate">
                      {analysis.your_product_name}
                    </h2>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0">
                      {analysis.battle_cards_count}{' '}
                      {analysis.battle_cards_count === 1 ? 'card' : 'cards'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
                    <Clock className="w-3 h-3" />
                    {formatDate(analysis.created_at)}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {analysis.competitors.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md"
                      >
                        {c.name || c.url}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/results/${analysis.id}`}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(analysis.id)}
                    disabled={deletingId === analysis.id}
                    className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete analysis"
                  >
                    {deletingId === analysis.id ? (
                      <div className="w-4 h-4 border-2 border-zinc-600 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
