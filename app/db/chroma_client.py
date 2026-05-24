"""
ChromaDB client wrapper for KidsBookGenerator.

Collections:
  - story_templates  : full story embeddings (topic + story text)
  - image_prompts    : image prompt embeddings per page
  - habit_books      : habit-book specific embeddings

Docker-aware: uses CHROMA_HOST_DOCKER / CHROMA_PORT_DOCKER when
running inside a container, else CHROMA_HOST / CHROMA_PORT.
"""
import os
import json
import logging
from typing import Optional

import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_in_docker = os.path.exists("/.dockerenv")

CHROMA_HOST = os.getenv("CHROMA_HOST_DOCKER", "chromadb") if _in_docker else os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT_DOCKER", "8000") if _in_docker else os.getenv("CHROMA_PORT", "8005"))
SIMILARITY_THRESHOLD = float(os.getenv("CHROMA_SIMILARITY_THRESHOLD", "0.85"))

# ---------------------------------------------------------------------------
# Singleton client
# ---------------------------------------------------------------------------
_client: Optional[chromadb.HttpClient] = None


def _get_client() -> chromadb.HttpClient:
    global _client
    if _client is None:
        try:
            _client = chromadb.HttpClient(
                host=CHROMA_HOST,
                port=CHROMA_PORT,
                settings=Settings(anonymized_telemetry=False)
            )
            _client.heartbeat()
            logger.info(f"ChromaDB connected at {CHROMA_HOST}:{CHROMA_PORT}")
        except Exception as e:
            logger.warning(f"ChromaDB not reachable ({CHROMA_HOST}:{CHROMA_PORT}): {e}. Running without vector cache.")
            _client = None
    return _client


def _get_or_create_collection(name: str):
    client = _get_client()
    if client is None:
        return None
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"}
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def search_similar_story(
    topic: str,
    age: int,
    style: str,
    product_type: str = "habit_book",
    threshold: Optional[float] = None,
    n_results: int = 1
) -> Optional[dict]:
    """
    Searches the story_templates collection for a semantically similar story.

    Returns a dict with keys:
        project_id, story_text, metadata, similarity_score
    or None if no match above threshold is found.
    """
    if threshold is None:
        threshold = SIMILARITY_THRESHOLD

    collection = _get_or_create_collection("story_templates")
    if collection is None:
        return None

    query_text = f"{product_type} | topic: {topic} | age: {age} | style: {style}"

    try:
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )

        if not results or not results["ids"] or not results["ids"][0]:
            return None

        # ChromaDB cosine distance: 0 = identical, 1 = orthogonal
        # similarity = 1 - distance
        distance = results["distances"][0][0]
        similarity = 1.0 - distance

        if similarity < threshold:
            logger.info(f"ChromaDB: best match similarity {similarity:.3f} < threshold {threshold}. Regenerating.")
            return None

        metadata = results["metadatas"][0][0] if results["metadatas"][0] else {}
        story_text = metadata.get("story_text", "")

        logger.info(f"ChromaDB: cache HIT — similarity {similarity:.3f} for '{topic}'")
        return {
            "project_id": metadata.get("project_id"),
            "story_text": story_text,
            "metadata": metadata,
            "similarity_score": round(similarity, 4)
        }
    except Exception as e:
        logger.error(f"ChromaDB search error: {e}")
        return None


def save_story_embedding(
    doc_id: str,
    topic: str,
    story_text: str,
    age: int,
    style: str,
    project_id: int,
    product_type: str = "habit_book"
) -> bool:
    """
    Upserts a story embedding into the story_templates collection.
    Returns True on success, False if ChromaDB is unavailable.
    """
    collection = _get_or_create_collection("story_templates")
    if collection is None:
        return False

    document = f"{product_type} | topic: {topic} | age: {age} | style: {style}"
    metadata = {
        "topic": topic,
        "age": age,
        "style": style,
        "product_type": product_type,
        "project_id": project_id,
        "story_text": story_text
    }
    query_text = f"{product_type} | topic: {topic} | age: {age} | style: {style}"

    try:
        collection.upsert(
            ids=[doc_id],
            documents=[document],
            metadatas=[metadata]
        )
        logger.info(f"ChromaDB: saved story embedding id={doc_id} for project_id={project_id}")
        return True
    except Exception as e:
        logger.error(f"ChromaDB upsert error: {e}")
        return False


def save_prompt_embedding(
    doc_id: str,
    prompt_text: str,
    project_id: int,
    page_name: str,
    topic: str,
    product_type: str = "habit_book"
) -> bool:
    """
    Upserts an image prompt embedding into the image_prompts collection.
    """
    collection = _get_or_create_collection("image_prompts")
    if collection is None:
        return False

    metadata = {
        "project_id": project_id,
        "page_name": page_name,
        "topic": topic,
        "product_type": product_type
    }

    try:
        collection.upsert(
            ids=[doc_id],
            documents=[prompt_text],
            metadatas=[metadata]
        )
        return True
    except Exception as e:
        logger.error(f"ChromaDB prompt upsert error: {e}")
        return False


def is_available() -> bool:
    """Quick health check — returns True if ChromaDB is reachable."""
    client = _get_client()
    return client is not None
