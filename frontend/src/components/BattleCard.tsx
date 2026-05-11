import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Swords,
  DollarSign,
  Newspaper,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Quote,
} from 'lucide-react'
import type { BattleCard as BattleCardType } from '../types'

interface BattleCardProps {
  card: BattleCardType
  productName: string
}

export default function BattleCard({ card, productName }: BattleCardProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)

  const hasPricing =
    card.pricing_tiers && card.pricing_tiers.length > 0

  return (
    <div className="card overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-zinc-100 truncate">
                {card.competitor_name}
              </h2>
              <a
                href={card.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-indigo-400 transition-colors flex-shrink-0"
                title="Visit website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <a
              href={card.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              {card.website}
            </a>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md font-mono">
              Battle Card
            </span>
          </div>
        </div>

        {card.core_positioning && (
          <div className="mt-4 flex items-start gap-2.5 bg-zinc-800/50 rounded-lg p-3">
            <Quote className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-300 italic leading-relaxed">
              {card.core_positioning}
            </p>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Pricing */}
        {hasPricing && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Pricing
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {card.pricing_tiers!.map((tier, i) => (
                <div
                  key={i}
                  className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-3"
                >
                  <div className="font-semibold text-zinc-200 text-sm mb-0.5">
                    {tier.tier_name}
                  </div>
                  <div className="text-indigo-400 font-bold text-base mb-2">
                    {tier.price}
                  </div>
                  {tier.features && tier.features.length > 0 && (
                    <ul className="space-y-1">
                      {tier.features.slice(0, 4).map((f, fi) => (
                        <li key={fi} className="text-xs text-zinc-400 flex items-start gap-1.5">
                          <span className="text-zinc-600 mt-0.5">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Strengths
              </h3>
            </div>
            <div className="space-y-2">
              {card.strengths.map((strength, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-green-500/5 border border-green-500/15 rounded-lg p-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                  <p className="text-sm text-zinc-300 leading-relaxed">{strength}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Weaknesses */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Weaknesses
              </h3>
            </div>
            <div className="space-y-2">
              {card.weaknesses.map((weakness, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/15 rounded-lg p-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                  <p className="text-sm text-zinc-300 leading-relaxed">{weakness}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Your Edge */}
        {card.how_you_beat_them && card.how_you_beat_them.length > 0 && (
          <section className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">
                Your Edge vs {card.competitor_name}
              </h3>
              <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full ml-auto">
                {productName}
              </span>
            </div>
            <div className="space-y-2">
              {card.how_you_beat_them.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent News */}
        {card.recent_news && card.recent_news !== 'No recent news found.' && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Recent News
              </h3>
            </div>
            <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3">
              <p className="text-sm text-zinc-300 leading-relaxed">{card.recent_news}</p>
            </div>
          </section>
        )}

        {/* Sources Accordion */}
        {card.sources && card.sources.length > 0 && (
          <section>
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-2 w-full text-left group"
            >
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
                Sources ({card.sources.length})
              </h3>
              {sourcesOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
              )}
            </button>

            {sourcesOpen && (
              <div className="mt-3 space-y-1.5 animate-fade-in">
                {card.sources.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 bg-zinc-800/30 rounded-lg p-2.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors break-all"
                      >
                        {source.url}
                      </a>
                      {source.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{source.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
