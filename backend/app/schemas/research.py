from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ResearchCreate(BaseModel):
    topic: str = Field(min_length=3, max_length=300)


class AgentTimings(BaseModel):
    search: Optional[float] = None
    reading: Optional[float] = None
    writing: Optional[float] = None
    critic: Optional[float] = None


class ResearchListItem(BaseModel):
    id: str
    topic: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    rating: Optional[int] = None


class ResearchDetail(BaseModel):
    id: str
    topic: str
    status: str
    search_results: Optional[str] = None
    scraped_content: Optional[str] = None
    report: Optional[str] = None
    critic_feedback: Optional[str] = None
    sources: List[str] = []
    agent_timings: AgentTimings = AgentTimings()
    error: Optional[str] = None
    rating: Optional[int] = None
    comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ResearchStatus(BaseModel):
    id: str
    status: str
    agent_timings: AgentTimings = AgentTimings()
    error: Optional[str] = None


class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)
