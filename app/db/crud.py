"""
CRUD helpers — thin layer between FastAPI endpoints and SQLAlchemy models.
All functions accept a db: Session parameter (injected via FastAPI Depends).
"""
import json
import logging
from typing import Optional, List

from sqlalchemy.orm import Session

from app.db.models import (
    User, Project, Story, AgentOutput, Image, Video, Rating
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

def create_project(
    db: Session,
    title: str,
    project_type: str = "habit_book",
    config_dict: Optional[dict] = None,
    user_id: Optional[int] = None
) -> Project:
    project = Project(
        title=title,
        project_type=project_type,
        status="in_progress",
        config_json=json.dumps(config_dict) if config_dict else None,
        user_id=user_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info(f"Created project id={project.id} title='{title}'")
    return project


def get_project(db: Session, project_id: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()


def update_project_status(db: Session, project_id: int, status: str) -> None:
    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        project.status = status
        db.commit()


def update_project_chroma_id(db: Session, project_id: int, chroma_doc_id: str) -> None:
    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        project.chroma_doc_id = chroma_doc_id
        db.commit()


# ---------------------------------------------------------------------------
# Story
# ---------------------------------------------------------------------------

def save_story(db: Session, project_id: int, story_text: str) -> Story:
    story = Story(project_id=project_id, story_text=story_text)
    db.add(story)
    db.commit()
    db.refresh(story)
    return story


# ---------------------------------------------------------------------------
# Agent Outputs
# ---------------------------------------------------------------------------

def save_agent_output(
    db: Session,
    project_id: int,
    page_name: str,
    agent_role: str,
    raw_output: dict
) -> AgentOutput:
    output = AgentOutput(
        project_id=project_id,
        page_name=page_name,
        agent_role=agent_role,
        raw_output=json.dumps(raw_output),
        was_edited=False
    )
    db.add(output)
    db.commit()
    db.refresh(output)
    return output


def update_agent_output_edited(
    db: Session,
    output_id: int,
    edited_output: dict
) -> Optional[AgentOutput]:
    output = db.query(AgentOutput).filter(AgentOutput.id == output_id).first()
    if output:
        output.edited_output = json.dumps(edited_output)
        output.was_edited = True
        db.commit()
        db.refresh(output)
    return output


def get_agent_outputs_for_project(db: Session, project_id: int) -> List[AgentOutput]:
    return (
        db.query(AgentOutput)
        .filter(AgentOutput.project_id == project_id)
        .order_by(AgentOutput.created_at)
        .all()
    )


def get_agent_output_by_id(db: Session, output_id: int) -> Optional[AgentOutput]:
    return db.query(AgentOutput).filter(AgentOutput.id == output_id).first()


# ---------------------------------------------------------------------------
# Images
# ---------------------------------------------------------------------------

def save_image_record(
    db: Session,
    project_id: int,
    page_name: str,
    image_prompt: str,
    image_path: Optional[str] = None
) -> Image:
    img = Image(
        project_id=project_id,
        page_name=page_name,
        image_prompt=image_prompt,
        image_path=image_path
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


# ---------------------------------------------------------------------------
# Videos
# ---------------------------------------------------------------------------

def save_video_record(
    db: Session,
    project_id: int,
    video_path: str,
    page_name: Optional[str] = None
) -> Video:
    video = Video(
        project_id=project_id,
        page_name=page_name,
        video_path=video_path
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video


# ---------------------------------------------------------------------------
# Ratings
# ---------------------------------------------------------------------------

def save_rating(
    db: Session,
    project_id: int,
    page_name: str,
    score: int,
    feedback_text: Optional[str] = None,
    is_book_level: bool = False
) -> Rating:
    """
    Upsert-style: if a rating for the same project+page already exists,
    update it instead of inserting a duplicate.
    """
    existing = (
        db.query(Rating)
        .filter(Rating.project_id == project_id, Rating.page_name == page_name)
        .first()
    )
    if existing:
        existing.score = score
        existing.feedback_text = feedback_text
        existing.is_book_level = is_book_level
        db.commit()
        db.refresh(existing)
        return existing

    rating = Rating(
        project_id=project_id,
        page_name=page_name,
        score=max(1, min(5, score)),   # clamp 1-5
        feedback_text=feedback_text,
        is_book_level=is_book_level
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


def save_book_level_rating(
    db: Session,
    project_id: int,
    score: int,
    feedback_text: Optional[str] = None
) -> List[Rating]:
    """
    Applies the same score to ALL existing page-level outputs for the project,
    plus one book-level record (page_name='all').
    """
    # Get all distinct page names with agent outputs for this project
    from app.db.models import AgentOutput
    page_names = [
        row.page_name for row in
        db.query(AgentOutput.page_name)
        .filter(AgentOutput.project_id == project_id)
        .distinct()
        .all()
        if row.page_name not in ("character_sheet", "scene_plan")
    ]

    results = []
    for page_name in page_names:
        results.append(save_rating(db, project_id, page_name, score))

    # Book-level summary record
    results.append(save_rating(db, project_id, "all", score, feedback_text, is_book_level=True))
    return results
