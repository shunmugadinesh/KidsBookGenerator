"""
SQLAlchemy ORM models for KidsBookGenerator Phase 3.
Tables:
  - users         : app users
  - projects      : one project per generation run
  - stories       : full story text per project
  - agent_outputs : raw + edited per-agent output for each page
  - images        : image prompt + file path per page
  - videos        : compiled video path per page / project
  - ratings       : per-page 1-5 star ratings + optional book-level
"""
import json
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    ForeignKey, Boolean, Float
)
from sqlalchemy.orm import relationship

from app.db.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255))
    project_type = Column(String(100), default="habit_book")   # habit_book | abcd_book | rhyme | etc.
    status = Column(String(50), default="in_progress")         # in_progress | completed | archived
    config_json = Column(Text, nullable=True)                   # serialised ChildProfile dict
    chroma_doc_id = Column(String(255), nullable=True)          # ID used in ChromaDB collection
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="projects")
    stories = relationship("Story", back_populates="project")
    agent_outputs = relationship("AgentOutput", back_populates="project")
    images = relationship("Image", back_populates="project")
    videos = relationship("Video", back_populates="project")
    ratings = relationship("Rating", back_populates="project")


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    story_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="stories")


class AgentOutput(Base):
    """
    Stores the raw output from each CrewAI agent per page, plus any
    user edits made through the review panel.
    """
    __tablename__ = "agent_outputs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    page_name = Column(String(100))          # "Page 1" / "character_sheet" / "scene_plan"
    agent_role = Column(String(100))         # "Planner Agent" / "Character Sheet Agent" / etc.
    raw_output = Column(Text)               # JSON string from agent
    edited_output = Column(Text, nullable=True)  # JSON string after user edits
    was_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="agent_outputs")

    def get_effective_output(self) -> dict:
        """Returns edited_output if present, else raw_output, as dict."""
        src = self.edited_output if self.was_edited and self.edited_output else self.raw_output
        try:
            return json.loads(src) if src else {}
        except Exception:
            return {}


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    page_name = Column(String(100))
    image_prompt = Column(Text)
    image_path = Column(Text, nullable=True)   # local file path or URL
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="images")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    page_name = Column(String(100), nullable=True)   # null = full book video
    video_path = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="videos")


class Rating(Base):
    """
    Per-page 1-5 star ratings.
    When is_book_level=True it represents a bulk rating for the entire project.
    """
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    page_name = Column(String(100))          # specific page or "all"
    score = Column(Integer)                  # 1-5
    feedback_text = Column(Text, nullable=True)
    is_book_level = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="ratings")
