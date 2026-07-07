from datetime import datetime, timezone, time
from typing import Optional
from app.database import db

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import Response

from app.core.deps import get_current_user
from app.database import research_collection
from app.schemas.research import FeedbackCreate, ResearchCreate
from app.services.export_service import build_markdown, build_pdf
from app.services.pipeline_service import run_research_pipeline

router = APIRouter(prefix="/api/research", tags=["research"])


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid research id")


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc["user_id"] = str(doc.get("user_id"))
    return doc


async def _get_owned_doc(research_id: str, user_id: ObjectId) -> dict:
    doc = await research_collection.find_one({"_id": _oid(research_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Research not found")
    return doc


@router.post("", status_code=201)
async def create_research(
    payload: ResearchCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": current_user["_id"],
        "topic": payload.topic,
        "status": "queued",
        "search_results": None,
        "scraped_content": None,
        "report": None,
        "critic_feedback": None,
        "sources": [],
        "agent_timings": {},
        "error": None,
        "rating": None,
        "comment": None,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }
    result = await research_collection.insert_one(doc)
    research_id = str(result.inserted_id)

    # Runs in FastAPI's threadpool (pipeline code is sync / blocking).
    background_tasks.add_task(run_research_pipeline, research_id)

    return {"id": research_id, "status": "queued"}


@router.get("")
async def list_research(
    current_user: dict = Depends(get_current_user),
    search: Optional[str] = Query(default=None, description="Search within topic"),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    query: dict = {"user_id": current_user["_id"]}
    if search:
        query["topic"] = {"$regex": search, "$options": "i"}
    if status_filter:
        query["status"] = status_filter

    allowed_sort_fields = {"created_at", "updated_at", "topic", "status", "rating"}
    if sort_by not in allowed_sort_fields:
        sort_by = "created_at"
    direction = -1 if sort_dir == "desc" else 1

    total = await research_collection.count_documents(query)
    cursor = (
        research_collection.find(query)
        .sort(sort_by, direction)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = [_serialize(doc) async for doc in cursor]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/token-stats")
async def get_token_stats(current_user: dict = Depends(get_current_user)):
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
    cursor = db["token_usage"].find({
        "user_id": current_user["_id"],
        "created_at": {"$gte": today_start}
    })
    input_tokens = 0
    output_tokens = 0
    total_tokens = 0
    async for record in cursor:
        input_tokens += record.get("input_tokens", 0)
        output_tokens += record.get("output_tokens", 0)
        total_tokens += record.get("total_tokens", 0)
    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens
    }


@router.get("/cost-stats")
async def get_cost_stats(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    month_start = datetime.combine(now.date().replace(day=1), time.min, tzinfo=timezone.utc)
    user_id = current_user["_id"]
    today_cursor = db["costs"].find({
        "user_id": user_id,
        "created_at": {"$gte": today_start}
    })
    today_cost = 0.0
    async for record in today_cursor:
        today_cost += record.get("total_cost", 0.0)
    month_cursor = db["costs"].find({
        "user_id": user_id,
        "created_at": {"$gte": month_start}
    })
    month_cost = 0.0
    async for record in month_cursor:
        month_cost += record.get("total_cost", 0.0)
    all_cursor = db["costs"].find({
        "user_id": user_id
    })
    total_cost_all = 0.0
    count_all = 0
    async for record in all_cursor:
        total_cost_all += record.get("total_cost", 0.0)
        count_all += 1
    average_cost = (total_cost_all / count_all) if count_all > 0 else 0.0
    return {
        "today_cost": round(today_cost, 4),
        "month_cost": round(month_cost, 4),
        "average_cost": round(average_cost, 4)
    }


@router.get("/{research_id}")
async def get_research(research_id: str, current_user: dict = Depends(get_current_user)):
    doc = await _get_owned_doc(research_id, current_user["_id"])
    return _serialize(doc)


@router.get("/{research_id}/status")
async def get_research_status(research_id: str, current_user: dict = Depends(get_current_user)):
    doc = await _get_owned_doc(research_id, current_user["_id"])
    return {
        "id": str(doc["_id"]),
        "status": doc["status"],
        "agent_timings": doc.get("agent_timings", {}),
        "error": doc.get("error"),
    }


@router.delete("/{research_id}", status_code=204)
async def delete_research(research_id: str, current_user: dict = Depends(get_current_user)):
    result = await research_collection.delete_one(
        {"_id": _oid(research_id), "user_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Research not found")
    return Response(status_code=204)


@router.post("/{research_id}/feedback")
async def submit_feedback(
    research_id: str, payload: FeedbackCreate, current_user: dict = Depends(get_current_user)
):
    doc = await _get_owned_doc(research_id, current_user["_id"])
    await research_collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"rating": payload.rating, "comment": payload.comment,
                   "updated_at": datetime.now(timezone.utc)}},
    )
    return {"detail": "Feedback saved"}


@router.get("/{research_id}/export")
async def export_research(
    research_id: str,
    fmt: str = Query(default="pdf", pattern="^(pdf|markdown|md)$"),
    current_user: dict = Depends(get_current_user),
):
    doc = await _get_owned_doc(research_id, current_user["_id"])
    safe_topic = "".join(c if c.isalnum() else "_" for c in doc["topic"])[:50]

    if fmt in ("markdown", "md"):
        content = build_markdown(doc)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{safe_topic}.md"'},
        )

    pdf_bytes = build_pdf(doc)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_topic}.pdf"'},
    )
