import asyncio
import httpx
from bs4 import BeautifulSoup
import re

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
}


def clean_html(html_content: str, max_chars: int = 5000) -> str:
    soup = BeautifulSoup(html_content, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "noscript", "iframe", "svg", "img", "head"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)
    lines = [line.strip() for line in text.splitlines() if line.strip() and len(line.strip()) > 3]
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text[:max_chars]


async def fetch_webpage(url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=HEADERS) as client:
            response = await client.get(url)
            response.raise_for_status()
            cleaned = clean_html(response.text)
            if len(cleaned) < 50:
                return f"Page at {url} was fetched but returned minimal content (may be blocked or require JavaScript)."
            return f"[Source: {url}]\n\n{cleaned}"
    except httpx.HTTPStatusError as e:
        return f"HTTP {e.response.status_code} error fetching {url} — page may not exist or requires authentication."
    except httpx.TimeoutException:
        return f"Timeout fetching {url} — the page took too long to respond. Data unavailable — manual review recommended."
    except Exception as e:
        return f"Could not fetch {url}: {str(e)}. Data unavailable — manual review recommended."


async def search_reviews(competitor_name: str) -> str:
    results = []
    safe_name = competitor_name.lower().strip().replace(" ", "-").replace(".", "").replace(",", "")

    # Trustpilot search
    tp_search_url = f"https://www.trustpilot.com/search?query={competitor_name.replace(' ', '+')}"
    tp_result = await fetch_webpage(tp_search_url)
    if "Data unavailable" not in tp_result and "error" not in tp_result.lower()[:50]:
        results.append(f"[Trustpilot Search for '{competitor_name}']\n{tp_result[:2000]}")

    # Trustpilot direct company page
    tp_direct_url = f"https://www.trustpilot.com/review/{safe_name}"
    tp_direct = await fetch_webpage(tp_direct_url)
    if "Data unavailable" not in tp_direct and "404" not in tp_direct[:100] and len(tp_direct) > 300:
        results.append(f"[Trustpilot Reviews - Direct Page]\n{tp_direct[:2000]}")

    if results:
        return "\n\n---\n\n".join(results)
    return (
        f"Could not retrieve reviews for '{competitor_name}' from Trustpilot. "
        "Data unavailable — manual review recommended. "
        f"Try visiting: https://www.trustpilot.com/search?query={competitor_name.replace(' ', '+')} "
        f"or https://www.g2.com/search?query={competitor_name.replace(' ', '+')}"
    )


def _ddg_search_sync(query: str) -> list[dict]:
    from duckduckgo_search import DDGS  # imported lazily so startup isn't slowed

    with DDGS() as ddgs:
        return list(ddgs.text(query, max_results=10))


async def google_search(query: str) -> str:
    """Runs a web search and returns top 10 results with titles, URLs, and snippets."""
    try:
        loop = asyncio.get_running_loop()
        results = await loop.run_in_executor(None, _ddg_search_sync, query)

        if not results:
            return f"No search results found for: {query}"

        parts = []
        for i, r in enumerate(results, 1):
            parts.append(
                f"{i}. {r.get('title', '(no title)')}\n"
                f"   URL: {r.get('href', '')}\n"
                f"   {r.get('body', '')[:220]}"
            )
        return f"Search results for '{query}':\n\n" + "\n\n".join(parts)

    except Exception as e:
        return (
            f"Search failed: {str(e)}. "
            "Try fetching competitor pages directly using known URLs."
        )
