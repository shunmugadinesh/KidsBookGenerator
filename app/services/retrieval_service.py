"""
Retrieval Service — Fast-path cache logic.

Flow:
  1. Build query from (topic, age, style, product_type)
  2. Search ChromaDB for similarity >= threshold
     → HIT:  load from PostgreSQL, personalise with LLM, return cached result
     → MISS: run full CrewAI pipeline, save to PG + Chroma, return result
"""
import json
import logging
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.db import chroma_client, crud

logger = logging.getLogger(__name__)


def build_chroma_doc_id(project_id: int) -> str:
    return f"project_{project_id}_{uuid.uuid4().hex[:8]}"


def check_similar_story(
    topic: str,
    age: int,
    style: str,
    product_type: str = "habit_book",
    threshold: Optional[float] = None
) -> Optional[dict]:
    """
    Checks ChromaDB for a semantically similar previously-generated story.

    Returns:
        {
            "found": True,
            "project_id": int,
            "story_text": str,
            "similarity_score": float,
            "metadata": dict
        }
        or {"found": False}
    """
    if not chroma_client.is_available():
        logger.info("ChromaDB not available — skipping cache check.")
        return {"found": False}

    result = chroma_client.search_similar_story(
        topic=topic,
        age=age,
        style=style,
        product_type=product_type,
        threshold=threshold
    )

    if result:
        return {
            "found": True,
            "project_id": result.get("project_id"),
            "story_text": result.get("story_text", ""),
            "similarity_score": result.get("similarity_score", 0.0),
            "metadata": result.get("metadata", {})
        }

    return {"found": False}


def save_project_to_knowledge_base(
    db: Session,
    project_id: int,
    topic: str,
    age: int,
    style: str,
    story_text: str,
    product_type: str = "habit_book"
) -> bool:
    """
    Called after a successful full agent run.
    Saves:
      1. Story to PostgreSQL stories table
      2. Story embedding to ChromaDB story_templates collection
      3. Updates project.chroma_doc_id for future reference
    """
    # 1. Save story text to PostgreSQL
    crud.save_story(db, project_id=project_id, story_text=story_text)

    # 2. Create ChromaDB embedding
    doc_id = build_chroma_doc_id(project_id)
    success = chroma_client.save_story_embedding(
        doc_id=doc_id,
        topic=topic,
        story_text=story_text,
        age=age,
        style=style,
        project_id=project_id,
        product_type=product_type
    )

    # 3. Update project with chroma doc id
    if success:
        crud.update_project_chroma_id(db, project_id=project_id, chroma_doc_id=doc_id)
        crud.update_project_status(db, project_id=project_id, status="completed")

    return success


def save_page_prompt_embedding(
    project_id: int,
    page_name: str,
    prompt_text: str,
    topic: str,
    product_type: str = "habit_book"
) -> None:
    """
    Saves an individual image prompt to ChromaDB image_prompts collection.
    Fire-and-forget — errors are logged but not raised.
    """
    if not chroma_client.is_available():
        return
    doc_id = f"prompt_{project_id}_{page_name.replace(' ', '_')}_{uuid.uuid4().hex[:6]}"
    chroma_client.save_prompt_embedding(
        doc_id=doc_id,
        prompt_text=prompt_text,
        project_id=project_id,
        page_name=page_name,
        topic=topic,
        product_type=product_type
    )
