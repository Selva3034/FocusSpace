from sqlalchemy import Boolean, Column, Integer, String

from database import Base


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