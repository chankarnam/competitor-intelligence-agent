import { CheckCircle2, Loader2, Globe, Search, BarChart3 } from 'lucide-react'

interface ProgressStep {
  message: string
  timestamp: number
}

interface LoadingProgressProps {
  steps: ProgressStep[]
  isComplete: boolean
}

function getStepIcon(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('fetch') || lower.includes('scraping') || lower.includes('fetching')) {
    return Globe
  }
  if (lower.includes('review') || lower.includes('search')) {
    return Search
  }
  if (lower.includes('battle card') || lower.includes('generating')) {
    return BarChart3
  }
  return Globe
}

export default function LoadingProgress({ steps, isComplete }: LoadingProgressProps) {
  return (
    <div className="card p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
        ) : (
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
        )}
        <div>
          <h3 className="font-semibold text-zinc-100 text-sm">
            {isComplete ? 'Analysis Complete' : 'AI Agent Working...'}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isComplete
              ? 'All battle cards have been generated'
              : 'Fetching and analyzing competitor data'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{
            width: isComplete ? '100%' : `${Math.min(5 + steps.length * 4, 90)}%`,
          }}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {steps.length === 0 && (
          <div className="flex items-center gap-3 py-1">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
            <span className="text-sm text-zinc-400">Initializing agent...</span>
          </div>
        )}

        {steps.map((step, index) => {
          const isLast = index === steps.length - 1 && !isComplete
          const Icon = getStepIcon(step.message)

          return (
            <div
              key={step.timestamp}
              className={`flex items-start gap-3 py-1 animate-fade-in ${
                isLast ? 'text-zinc-200' : 'text-zinc-500'
              }`}
            >
              {isLast ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isLast ? 'text-indigo-400' : 'text-zinc-600'}`} />
                <span className="text-sm leading-5 break-all">{step.message}</span>
              </div>
            </div>
          )
        })}

        {isComplete && steps.length > 0 && (
          <div className="flex items-center gap-3 py-1 text-green-400 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Battle cards ready!</span>
          </div>
        )}
      </div>
    </div>
  )
}
