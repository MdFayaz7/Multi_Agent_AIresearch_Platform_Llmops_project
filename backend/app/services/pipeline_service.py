"""
This is your original pipeline.py, refactored so that:

  1. It reports progress into MongoDB after every step
     ("searching" -> "reading" -> "writing" -> "reviewing" -> "completed"/"failed"),
     which is what the frontend polls to show a live status bar.
  2. It records how long each agent took (agent_timings), for the
     "Agent Execution Details" feature.
  3. It extracts source URLs found during search/reading, for the
     "Source References" feature.
  4. It runs on a plain pymongo (sync) client because it executes inside
     FastAPI's background threadpool, not the asyncio event loop.

Your agent logic itself (buid_search_agent / build_reader_agent /
writer_chain / critic_chain) is untouched -- only the orchestration around
it changed.
"""
import re
import time
import traceback
from datetime import datetime, timezone

from app.prompts.versions import (
    CURRENT_WRITER_PROMPT,
    CURRENT_CRITIC_PROMPT,
)
from langchain_community.callbacks import get_openai_callback

# pyrefly: ignore [missing-import]
from bson import ObjectId
from app.core.logger import logger


from app.agents import buid_search_agent, build_reader_agent, writer_chain, critic_chain
from app.database import get_sync_collection

URL_RE = re.compile(r"https?://[^\s\)\]\"'>]+")


def _extract_sources(*texts: str, limit: int = 20) -> list[str]:
    found: list[str] = []
    seen = set()
    for text in texts:
        if not text:
            continue
        for url in URL_RE.findall(text):
            clean = url.rstrip(").,;:'\"")
            if clean not in seen:
                seen.add(clean)
                found.append(clean)
    return found[:limit]


def run_research_pipeline(research_id: str) -> None:
    collection = get_sync_collection("research")
    token_collection = get_sync_collection("token_usage")
    cost_collection = get_sync_collection("costs")
    oid = ObjectId(research_id)

    doc = collection.find_one({"_id": oid})
    if not doc:
        logger.warning("Pipeline execution aborted: Research ID not found", extra={"research_id": research_id})
        return
    topic = doc["topic"]
    user_id = str(doc["user_id"])

    timings: dict[str, float] = {}

    def update(status: str, **fields):
        fields["status"] = status
        fields["updated_at"] = datetime.now(timezone.utc)
        collection.update_one({"_id": oid}, {"$set": fields})

    logger.info(
        "Research pipeline initiated",
        extra={
            "research_id": research_id,
            "user_id": user_id,
            "topic": topic,
            "status": "queued"
        }
    )

    with get_openai_callback() as cb:
        try:
            # ---- Step 1: search agent ----
            logger.info(
                "Starting search agent step",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "searching"
                }
            )
            update("searching", agent_timings=timings)
            t0 = time.time()
            search_agent = buid_search_agent()
            search_result = search_agent.invoke(
                {"messages": [("user", f"Find recent, reliable and detailed information about: {topic}")]}
            )
            search_results_text = search_result["messages"][-1].content
            duration = round(time.time() - t0, 2)
            timings["search"] = duration
            
            logger.info(
                "Search agent step completed",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "searching",
                    "duration_sec": duration
                }
            )
            update("reading", search_results=search_results_text, agent_timings=timings)

            # ---- Step 2: reader agent ----
            logger.info(
                "Starting reader agent step",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "reading"
                }
            )
            t0 = time.time()
            reader_agent = build_reader_agent()
            reader_result = reader_agent.invoke(
                {
                    "messages": [
                        (
                            "user",
                            f"Based on the following search results about '{topic}', "
                            f"pick the most relevant URL and scrape it for deeper content.\n\n"
                            f"Search Results:\n{search_results_text[:800]}",
                        )
                    ]
                }
            )
            scraped_content = reader_result["messages"][-1].content
            duration = round(time.time() - t0, 2)
            timings["reading"] = duration
            
            logger.info(
                "Reader agent step completed",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "reading",
                    "duration_sec": duration
                }
            )
            update("writing", scraped_content=scraped_content, agent_timings=timings)

            # ---- Step 3: writer chain ----
            logger.info(
                "Starting writer chain step",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "writing"
                }
            )
            t0 = time.time()
            research_combined = (
                f"SEARCH RESULTS : \n {search_results_text} \n\n"
                f"DETAILED SCRAPED CONTENT : \n {scraped_content}"
            )
            report = writer_chain.invoke({"topic": topic, "research": research_combined})
            if not isinstance(report, str):
                report = getattr(report, "content", str(report))
            duration = round(time.time() - t0, 2)
            timings["writing"] = duration
            
            logger.info(
                "Writer chain step completed",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "writing",
                    "duration_sec": duration
                }
            )
            update("reviewing", report=report, agent_timings=timings)

            # ---- Step 4: critic chain ----
            logger.info(
                "Starting critic chain step",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "reviewing"
                }
            )
            t0 = time.time()
            feedback = critic_chain.invoke({"report": report})
            if not isinstance(feedback, str):
                feedback = getattr(feedback, "content", str(feedback))
            duration = round(time.time() - t0, 2)
            timings["critic"] = duration
            
            logger.info(
                "Critic chain step completed",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "reviewing",
                    "duration_sec": duration
                }
            )

            sources = _extract_sources(search_results_text, scraped_content)

            update(
                "completed",
                critic_feedback=feedback,
                agent_timings=timings,
                sources=sources,
                completed_at=datetime.now(timezone.utc),
                writer_prompt_version=CURRENT_WRITER_PROMPT,
                critic_prompt_version=CURRENT_CRITIC_PROMPT,
            )
            logger.info(
                "Research pipeline completed successfully",
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "completed",
                    "total_duration_sec": round(sum(timings.values()), 2),
                    "timings": timings
                }
            )

            # Record token usage
            token_collection.insert_one({
                "user_id": ObjectId(user_id),
                "query": topic,
                "model": "gpt-4.1",
                "input_tokens": cb.prompt_tokens,
                "output_tokens": cb.completion_tokens,
                "total_tokens": cb.total_tokens,
                "created_at": datetime.now(timezone.utc)
            })

            # Record cost monitoring
            input_cost = cb.prompt_tokens * (0.15 / 1_000_000)
            output_cost = cb.completion_tokens * (0.60 / 1_000_000)
            total_cost = input_cost + output_cost
            cost_collection.insert_one({
                "report_id": ObjectId(research_id),
                "user_id": ObjectId(user_id),
                "model": "gpt-4.1",
                "total_tokens": cb.total_tokens,
                "total_cost": total_cost,
                "created_at": datetime.now(timezone.utc)
            })

        except Exception as exc:  # noqa: BLE001
            traceback.print_exc()
            update("failed", error=str(exc), agent_timings=timings)
            logger.error(
                "Research pipeline failed",
                exc_info=True,
                extra={
                    "research_id": research_id,
                    "user_id": user_id,
                    "topic": topic,
                    "status": "failed",
                    "error": str(exc),
                    "timings": timings
                }
            )
            # Record token usage even on failure
            token_collection.insert_one({
                "user_id": ObjectId(user_id),
                "query": topic,
                "model": "gpt-4.1",
                "input_tokens": cb.prompt_tokens,
                "output_tokens": cb.completion_tokens,
                "total_tokens": cb.total_tokens,
                "created_at": datetime.now(timezone.utc)
            })
            # Record cost monitoring even on failure
            input_cost = cb.prompt_tokens * (0.15 / 1_000_000)
            output_cost = cb.completion_tokens * (0.60 / 1_000_000)
            total_cost = input_cost + output_cost
            cost_collection.insert_one({
                "report_id": ObjectId(research_id),
                "user_id": ObjectId(user_id),
                "model": "gpt-4.1",
                "total_tokens": cb.total_tokens,
                "total_cost": total_cost,
                "created_at": datetime.now(timezone.utc)
            })
