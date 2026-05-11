import asyncio
import anthropic
import json
from typing import Callable, Awaitable, Any
from scraper import fetch_webpage, search_reviews, google_search

TOOLS: list[dict[str, Any]] = [
    {
        "name": "google_search",
        "description": (
            "Searches the web and returns the top 10 results with titles, URLs, and snippets. "
            "Use this first to discover who the top competitors are for a given product, "
            "and later to find specific pages you need."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query, e.g. 'Notion competitors 2026 alternatives'",
                }
            },
            "required": ["query"],
        },
    },
    {
        "name": "fetch_webpage",
        "description": (
            "Fetches and returns the cleaned text content of any URL. "
            "Use this to read competitor homepages, pricing pages (/pricing, /plans, /price), "
            "and other relevant pages."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The full URL to fetch (must include https://)",
                }
            },
            "required": ["url"],
        },
    },
    {
        "name": "search_reviews",
        "description": (
            "Searches for customer reviews of a competitor on Trustpilot and G2. "
            "Returns review snippets, ratings, and common themes. "
            "Use this to discover competitor weaknesses and customer pain points."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "competitor_name": {
                    "type": "string",
                    "description": "The name of the competitor to find reviews for",
                }
            },
            "required": ["competitor_name"],
        },
    },
    {
        "name": "generate_battle_card",
        "description": (
            "Structures and saves the final battle card for a competitor. "
            "Call this ONCE per competitor after gathering all available information."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "competitor_name": {
                    "type": "string",
                    "description": "Full name of the competitor",
                },
                "website": {
                    "type": "string",
                    "description": "Competitor's main website URL",
                },
                "pricing_tiers": {
                    "type": "array",
                    "description": (
                        "List of pricing tiers. If pricing is not publicly listed, "
                        "use a single tier with price 'Contact for pricing'."
                    ),
                    "items": {
                        "type": "object",
                        "properties": {
                            "tier_name": {"type": "string"},
                            "price": {
                                "type": "string",
                                "description": "e.g. '$29/month', 'Free', 'Custom pricing'",
                            },
                            "features": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": ["tier_name", "price"],
                    },
                },
                "strengths": {
                    "type": "array",
                    "description": "Top 3 strengths — specific and evidence-based",
                    "items": {"type": "string"},
                },
                "weaknesses": {
                    "type": "array",
                    "description": "Top 3 weaknesses — cite customer complaints when possible",
                    "items": {"type": "string"},
                },
                "core_positioning": {
                    "type": "string",
                    "description": "Their main tagline or positioning statement (quote directly if possible)",
                },
                "recent_news": {
                    "type": "string",
                    "description": (
                        "Recent news, updates, funding, or notable changes. "
                        "Use 'No recent news found.' if nothing was discovered."
                    ),
                },
                "sources": {
                    "type": "array",
                    "description": "All URLs used — cite every source",
                    "items": {
                        "type": "object",
                        "properties": {
                            "url": {"type": "string"},
                            "description": {"type": "string"},
                        },
                        "required": ["url", "description"],
                    },
                },
            },
            "required": [
                "competitor_name",
                "website",
                "pricing_tiers",
                "strengths",
                "weaknesses",
                "core_positioning",
                "recent_news",
                "sources",
            ],
        },
    },
]

SYSTEM_PROMPT = """You are an expert Competitive Intelligence Analyst. Your job is to discover and analyze the top competitors for a given product.

## Workflow

### Phase 1: Discover Competitors
1. Call google_search("{product name} competitors 2026 alternatives")
2. From the results, identify the top 5 direct SaaS/software competitors
3. Infer the product category from context — do not ask for it

### Phase 2: Analyze Each Competitor (all 5)

**Step A — Homepage:** fetch_webpage the main URL; note tagline, features, target audience

**Step B — Pricing:** fetch /pricing, /plans, /price, /buy, or /get-started; extract tiers and prices

**Step C — Reviews:** search_reviews to find praise and complaints

**Step D — Battle Card:** call generate_battle_card with everything gathered

### Guidelines
- If a page fails: note "Data unavailable — manual review recommended" and continue
- Analyze ALL 5 competitors
- Cite every claim with a source URL
- Be specific — no vague generalities"""


async def run_agent(
    product_name: str,
    progress_callback: Callable[[str], Awaitable[None]],
) -> list[dict]:
    client = anthropic.AsyncAnthropic()

    user_message = f"""Discover and analyze the top competitors for: **{product_name}**

Steps:
1. Search for "{product_name} competitors 2026 alternatives"
2. Pick the 5 most relevant direct competitors
3. For each: fetch their homepage, pricing page, and reviews
4. Generate a battle card for each

Start with google_search now."""

    messages: list[dict] = [{"role": "user", "content": user_message}]
    battle_cards: list[dict] = []
    max_iterations = 70

    for _ in range(max_iterations):
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=8096,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=TOOLS,
            messages=messages,
        )

        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            break
        if response.stop_reason != "tool_use":
            break

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            name = block.name
            inp = block.input

            if name == "google_search":
                await progress_callback(f"Searching: {inp.get('query', '')}...")
                result = await google_search(inp.get("query", ""))

            elif name == "fetch_webpage":
                url = inp.get("url", "")
                await progress_callback(f"Fetching {url}...")
                result = await fetch_webpage(url)

            elif name == "search_reviews":
                competitor = inp.get("competitor_name", "competitor")
                await progress_callback(f"Reading reviews for {competitor}...")
                result = await search_reviews(competitor)

            elif name == "generate_battle_card":
                competitor = inp.get("competitor_name", "competitor")
                await progress_callback(f"Generating battle card for {competitor}...")
                battle_cards.append(inp)
                result = json.dumps({"status": "saved", "competitor": competitor})

            else:
                result = f"Unknown tool: {name}"

            tool_results.append(
                {"type": "tool_result", "tool_use_id": block.id, "content": result}
            )

        messages.append({"role": "user", "content": tool_results})

    return battle_cards


async def generate_edge_sections(
    product_name: str,
    edge: str,
    battle_cards: list[dict],
) -> list[dict]:
    """Re-runs only the 'Your Edge' section for each card in parallel."""
    client = anthropic.AsyncAnthropic()

    async def update_one(card: dict) -> dict:
        competitor = card.get("competitor_name", "this competitor")
        weaknesses = card.get("weaknesses", [])
        positioning = card.get("core_positioning", "")

        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Generate 3 sharp sales talking points for why {product_name} beats {competitor}.\n\n"
                        f"What makes {product_name} different: {edge}\n\n"
                        f"{competitor}'s positioning: {positioning}\n"
                        f"{competitor}'s key weaknesses: {'; '.join(weaknesses)}\n\n"
                        f"Rules: exactly 3 points, one sentence each, specific to this competitor's weaknesses, "
                        f"directly connecting our differentiator. "
                        f"Return one point per line, no bullets or numbers."
                    ),
                }
            ],
        )

        text = response.content[0].text.strip()
        points = [
            ln.strip().lstrip("•–-· ").strip()
            for ln in text.splitlines()
            if ln.strip() and len(ln.strip()) > 15
        ]

        updated = dict(card)
        updated["how_you_beat_them"] = points[:4]
        return updated

    updated = await asyncio.gather(*[update_one(c) for c in battle_cards])
    return list(updated)
