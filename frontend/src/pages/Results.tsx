import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { Download, ChevronLeft, AlertCircle, Zap, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import BattleCard from '../components/BattleCard'
import LoadingProgress from '../components/LoadingProgress'
import type { BattleCard as BattleCardType, AnalysisFormData, SSEEvent } from '../types'

interface ProgressStep {
  message: string
  timestamp: number
}

interface LocationState {
  formData?: AnalysisFormData
}

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  const [battleCards, setBattleCards] = useState<BattleCardType[]>([])
  const [productName, setProductName] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [edgeText, setEdgeText] = useState('')
  const [isAddingEdge, setIsAddingEdge] = useState(false)
  const [edgeAdded, setEdgeAdded] = useState(false)
  const [edgeError, setEdgeError] = useState<string | null>(null)

  // Load existing analysis by ID
  useEffect(() => {
    if (id) {
      fetchAnalysis(parseInt(id))
    } else if (state?.formData) {
      runAnalysis(state.formData)
    } else {
      navigate('/')
    }

    return () => {
      abortRef.current?.abort()
    }
  }, [id])

  async function fetchAnalysis(analysisId: number) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/analyses/${analysisId}`)
      if (!res.ok) throw new Error('Analysis not found')
      const data = await res.json()
      setProductName(data.your_product_name)
      setBattleCards(data.battle_cards)
      setIsComplete(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analysis')
    } finally {
      setIsLoading(false)
    }
  }

  async function runAnalysis(formData: AnalysisFormData) {
    setIsLoading(true)
    setIsComplete(false)
    setProductName(formData.product_name)
    setProgressSteps([])
    setError(null)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(err.detail || 'Request failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event: SSEEvent
          try {
            event = JSON.parse(raw)
          } catch {
            continue
          }

          handleSSEEvent(event, formData)
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Analysis failed')
      setIsLoading(false)
    }
  }

  function handleSSEEvent(event: SSEEvent, _formData: AnalysisFormData) {
    if (event.type === 'progress' && event.message) {
      setProgressSteps((prev) => [
        ...prev,
        { message: event.message!, timestamp: Date.now() },
      ])
    } else if (event.type === 'complete') {
      setBattleCards(event.battle_cards ?? [])
      setIsComplete(true)
      setIsLoading(false)
      if (event.analysis_id) {
        navigate(`/results/${event.analysis_id}`, {
          replace: true,
          state: null,
        })
      }
    } else if (event.type === 'error') {
      setError(event.message ?? 'An unknown error occurred')
      setIsLoading(false)
    }
  }

  async function handleAddEdge() {
    if (!edgeText.trim() || !id) return
    setIsAddingEdge(true)
    setEdgeError(null)
    try {
      const res = await fetch(`/api/analyze/${id}/edge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edge: edgeText.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add edge — please try again.')
      const data = await res.json()
      setBattleCards(data.battle_cards)
      setEdgeAdded(true)
    } catch (e) {
      setEdgeError(e instanceof Error ? e.message : 'Failed to add edge')
    } finally {
      setIsAddingEdge(false)
    }
  }

  async function handleExportPDF() {
    const { default: html2canvas } = await import('html2canvas')
    const { default: jsPDF } = await import('jspdf')

    const el = document.getElementById('battle-cards-container')
    if (!el) return

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#09090b',
      useCORS: true,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth = 210
    const pageHeight = 297
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let y = 0
    while (y < imgHeight) {
      if (y > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight)
      y += pageHeight
    }

    pdf.save(`${productName.replace(/\s+/g, '-').toLowerCase()}-battle-cards.pdf`)
  }

  // --- Render states ---

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card p-8">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Analysis Failed</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading && !isComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <Zap className="w-3 h-3 animate-pulse" />
            AI Agent Running
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            Analyzing competitors for{' '}
            <span className="text-gradient">{productName}</span>
          </h1>
          <p className="text-sm text-zinc-500">
            The agent is fetching real-time data from competitor websites and review platforms.
          </p>
        </div>
        <LoadingProgress steps={progressSteps} isComplete={isComplete} />
      </div>
    )
  }

  if (!isComplete && !isLoading) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 no-print">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            New Analysis
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">
            Battle Cards: <span className="text-gradient">{productName}</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {battleCards.length} competitor{battleCards.length !== 1 ? 's' : ''} analyzed
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="btn-secondary flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Your Edge personalization prompt */}
      {isComplete && id && (
        <div className="card border-dashed p-5 mb-6 no-print">
          {!edgeAdded ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <p className="text-sm text-zinc-300">
                  Want to see how you stack up? Tell us what makes{' '}
                  <span className="text-zinc-100 font-medium">{productName}</span> different.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1 text-sm"
                  placeholder="e.g. flat-rate pricing, faster setup, better support"
                  value={edgeText}
                  onChange={(e) => setEdgeText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isAddingEdge && handleAddEdge()}
                  disabled={isAddingEdge}
                />
                <button
                  onClick={handleAddEdge}
                  disabled={isAddingEdge || !edgeText.trim()}
                  className="btn-primary flex items-center gap-1.5 whitespace-nowrap text-sm"
                >
                  {isAddingEdge ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isAddingEdge ? 'Adding...' : '+ Add My Edge'}
                </button>
              </div>
              {edgeError && (
                <p className="text-xs text-red-400 mt-2">{edgeError}</p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-zinc-300">
                Your edge has been added — scroll down to see the{' '}
                <span className="text-blue-400 font-medium">Your Edge</span> section in each battle card.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Competitors analyzed bar */}
      {battleCards.length > 0 && (
        <div className="card p-4 mb-6 no-print">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-medium">
            Competitors Analyzed
          </p>
          <div className="flex flex-wrap gap-2">
            {battleCards.map((card, i) => (
              <a
                key={i}
                href={card.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setActiveTab(i)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-indigo-500/50 hover:bg-zinc-750 transition-colors group"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${card.website}&sz=16`}
                  alt=""
                  width={16}
                  height={16}
                  className="rounded-sm"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                  {card.competitor_name}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Competitor tabs */}
      {battleCards.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-print">
          {battleCards.map((card, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {card.competitor_name}
            </button>
          ))}
          <button
            onClick={() => setActiveTab(-1)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === -1
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            All Cards
          </button>
        </div>
      )}

      {/* Battle cards */}
      <div id="battle-cards-container" className="space-y-6">
        {battleCards.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-zinc-400">No battle cards were generated. Please try again.</p>
          </div>
        ) : activeTab === -1 || battleCards.length === 1 ? (
          battleCards.map((card, i) => (
            <BattleCard key={i} card={card} productName={productName} />
          ))
        ) : (
          <BattleCard card={battleCards[activeTab]} productName={productName} />
        )}
      </div>
    </div>
  )
}
