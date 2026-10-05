from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(100), default="Personal")
    priority = Column(String(20), default="Medium")
    completed = Column(Boolean, default=False)
    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(String(500), default="")
    status = Column(String(30), default="Active")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False, default="")
    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True
    )


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500), default="")
    category = Column(String(100), default="Personal")
    target_date = Column(String(20), nullable=True)
    progress = Column(Integer, default=0)
    status = Column(String(30), default="Active")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(
        Integer,
        ForeignKey("tasks.id"),
        nullable=True
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True
    )

    mode = Column(
        String(30),
        default="Focus"
    )

    duration_minutes = Column(
        Integer,
        nullable=False
    )

    completed = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=True
    )