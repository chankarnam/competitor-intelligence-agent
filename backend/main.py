import asyncio
import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agent import run_agent, generate_edge_sections
from database import Analysis, SessionLocal, create_tables

load_dotenv()

app = FastAPI(title="Competitor Intelligence Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    create_tables()


class AnalysisRequest(BaseModel):
    product_name: str


class EdgeRequest(BaseModel):
    edge: str


@app.post("/api/analyze")
async def analyze(request: AnalysisRequest):
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not set.")

    async def generate():
        db: Session = SessionLocal()
        queue: asyncio.Queue = asyncio.Queue()

        async def progress_cb(message: str) -> None:
            await queue.put({"type": "progress", "message": message})

        async def run() -> None:
            try:
                cards = await run_agent(
                    request.product_name,
                    progress_cb,
                )
                await queue.put({"type": "_complete", "cards": cards})
            except Exception as e:
                await queue.put({"type": "_error", "message": str(e)})

        task = asyncio.create_task(run())

        try:
            yield f"data: {json.dumps({'type': 'start', 'message': 'Analysis started. Initializing AI agent...'})}\n\n"

            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=1.5)
                except asyncio.TimeoutError:
                    if task.done():
                        break
                    yield ": keepalive\n\n"
                    continue

                if event["type"] == "_complete":
                    battle_cards = event["cards"]

                    if not battle_cards:
                        yield f"data: {json.dumps({'type': 'error', 'message': 'The agent completed but generated no battle cards. Try again or check your competitor URLs.'})}\n\n"
                        return

                    discovered = [
                        {"name": c.get("competitor_name", ""), "url": c.get("website", "")}
                        for c in battle_cards
                    ]
                    analysis = Analysis(
                        your_product_name=request.product_name,
                        your_value_props=json.dumps([]),
                        competitors_json=json.dumps(discovered),
                        battle_cards_json=json.dumps(battle_cards),
                    )
                    db.add(analysis)
                    db.commit()
                    db.refresh(analysis)

                    yield f"data: {json.dumps({'type': 'complete', 'analysis_id': analysis.id, 'battle_cards': battle_cards})}\n\n"
                    return

                elif event["type"] == "_error":
                    yield f"data: {json.dumps({'type': 'error', 'message': event['message']})}\n\n"
                    return

                else:
                    yield f"data: {json.dumps(event)}\n\n"

        finally:
            db.close()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/analyses")
async def list_analyses():
    db: Session = SessionLocal()
    try:
        analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
        return [
            {
                "id": a.id,
                "created_at": a.created_at.isoformat(),
                "your_product_name": a.your_product_name,
                "competitors": json.loads(a.competitors_json),
                "battle_cards_count": len(json.loads(a.battle_cards_json)),
            }
            for a in analyses
        ]
    finally:
        db.close()


@app.get("/api/analyses/{analysis_id}")
async def get_analysis(analysis_id: int):
    db: Session = SessionLocal()
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {
            "id": analysis.id,
            "created_at": analysis.created_at.isoformat(),
            "your_product_name": analysis.your_product_name,
            "your_value_props": json.loads(analysis.your_value_props),
            "competitors": json.loads(analysis.competitors_json),
            "battle_cards": json.loads(analysis.battle_cards_json),
        }
    finally:
        db.close()


@app.delete("/api/analyses/{analysis_id}")
async def delete_analysis(analysis_id: int):
    db: Session = SessionLocal()
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        db.delete(analysis)
        db.commit()
        return {"status": "deleted"}
    finally:
        db.close()


@app.post("/api/analyze/{analysis_id}/edge")
async def add_edge(analysis_id: int, request: EdgeRequest):
    db: Session = SessionLocal()
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        battle_cards = json.loads(analysis.battle_cards_json)
        updated_cards = await generate_edge_sections(
            analysis.your_product_name,
            request.edge,
            battle_cards,
        )

        analysis.battle_cards_json = json.dumps(updated_cards)
        db.commit()

        return {"battle_cards": updated_cards}
    finally:
        db.close()


@app.get("/api/health")
async def health():
    return {"status": "ok"}
