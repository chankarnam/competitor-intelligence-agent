# Competitor Intelligence Agent

An AI-powered web app that autonomously discovers your top competitors and generates sales-ready battle cards — no manual research required. Enter your product name, and a Claude-powered agent searches the web, scrapes competitor websites, reads customer reviews, and produces structured competitive intelligence in minutes.

> **Screenshot:** Dark-themed results page showing five auto-discovered competitor battle cards, each with pricing tiers, color-coded strengths (green) and weaknesses (red), a collapsible sources accordion, and a "Your Edge" section populated after the user describes their differentiator.

---

## How It Works

1. **Enter your product name** — just one field, nothing else
2. The AI agent autonomously:
   - Searches the web for your top 5 competitors
   - Fetches each competitor's homepage and pricing page
   - Reads customer reviews on Trustpilot
3. Generates a **battle card** per competitor with:
   - Pricing tiers (extracted from their pricing page)
   - Top 3 strengths and weaknesses (evidence-based, sourced)
   - Core positioning / tagline
   - Recent news or notable changes
   - All claims cited with source URLs
4. **(Optional)** Add your differentiator — describe what makes your product different and the agent instantly generates a **"Your Edge"** section for every card without re-scraping

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18 + TypeScript + Vite |
| Styling   | Tailwind CSS (dark mode) |
| Backend   | FastAPI (Python) |
| Database  | SQLite via SQLAlchemy |
| AI        | Anthropic Claude `claude-sonnet-4-6` with tool-use |
| Search    | DuckDuckGo Search (via `duckduckgo-search`) |
| Scraping  | httpx + BeautifulSoup4 |

---

## Project Structure

```
competitor-intelligence-agent/
├── backend/
│   ├── main.py           # FastAPI routes + SSE streaming
│   ├── agent.py          # Anthropic tool-use agent + edge generation
│   ├── scraper.py        # Web fetching, HTML cleaning, search
│   ├── database.py       # SQLite models (SQLAlchemy)
│   ├── requirements.txt
│   └── .env.example      # ← copy this to .env
├── frontend/
│   ├── src/
│   │   ├── pages/        # Home, Results, History
│   │   ├── components/   # BattleCard, LoadingProgress, Navbar
│   │   └── types/        # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example      # ← copy this to .env (optional)
├── .gitignore
├── .env.example          # points to backend/.env.example
└── README.md
```

---

## Setup

> **Security note:** Never commit your `.env` files. They are listed in `.gitignore` but double-check before pushing.

### 1. Clone the repo

```bash
git clone https://github.com/your-username/competitor-intelligence-agent.git
cd competitor-intelligence-agent
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get a key at [console.anthropic.com](https://console.anthropic.com/).

### 3. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Open it in your browser.

---

## Usage

| Page | What it does |
|------|-------------|
| **Home** | Enter your product name — the agent discovers competitors automatically |
| **Results** | Watch real-time progress, then view battle cards. Use "Add My Edge" to personalize the "Your Edge" section. Export to PDF. |
| **History** | All past analyses are saved to SQLite and re-viewable at any time |

---

## Environment Variables

| Variable | Location | Required | Description |
|----------|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | `backend/.env` | Yes | Your Anthropic API key |
| `VITE_API_URL` | `frontend/.env` | No | Backend URL (defaults to `http://localhost:8000` via Vite proxy) |

---

## Notes

- Analysis takes roughly 3–6 minutes (5 competitors × homepage + pricing + reviews)
- If a page cannot be scraped (JS-heavy sites, bot protection), the agent notes "data unavailable — manual review recommended" and continues
- The SQLite database (`backend/competitor_intelligence.db`) is created automatically on first run and is excluded from version control
- The frontend proxies `/api/*` to the backend via Vite, so no CORS issues in development
