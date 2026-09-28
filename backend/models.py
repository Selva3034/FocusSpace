from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text

from database import Base


# ==================================================
# TASK MODEL
# ==================================================

class Task(Base):
    __tablename__ = "tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    category = Column(
        String(100),
        default="Personal"
    )

    priority = Column(
        String(20),
        default="Medium"
    )

    completed = Column(
        Boolean,
        default=False
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True
    )


# ==================================================
# PROJECT MODEL
# ==================================================

class Project(Base):
    __tablename__ = "projects"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(200),
        nullable=False
    )

    description = Column(
        String(500),
        default=""
    )

    status = Column(
        String(30),
        default="Active"
    )


# ==================================================
# NOTE MODEL
# ==================================================

class Note(Base):
    __tablename__ = "notes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    content = Column(
        Text,
        nullable=False,
        default=""
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True
    )