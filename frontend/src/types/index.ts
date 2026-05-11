export interface PricingTier {
  tier_name: string
  price: string
  features?: string[]
}

export interface Source {
  url: string
  description: string
}

export interface BattleCard {
  competitor_name: string
  website: string
  pricing_tiers?: PricingTier[]
  strengths: string[]
  weaknesses: string[]
  core_positioning: string
  how_you_beat_them?: string[]
  recent_news?: string
  sources: Source[]
}

export interface CompetitorInput {
  name: string
  url: string
}

export interface AnalysisFormData {
  product_name: string
}

export interface Analysis {
  id: number
  created_at: string
  your_product_name: string
  your_value_props: string[]
  competitors: CompetitorInput[]
  battle_cards: BattleCard[]
}

export interface AnalysisListItem {
  id: number
  created_at: string
  your_product_name: string
  competitors: CompetitorInput[]
  battle_cards_count: number
}

export interface SSEEvent {
  type: 'start' | 'progress' | 'complete' | 'error' | 'ping'
  message?: string
  analysis_id?: number
  battle_cards?: BattleCard[]
}
