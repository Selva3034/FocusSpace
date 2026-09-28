from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Task, Project


# ==================================================
# DATABASE SETUP
# ==================================================

Base.metadata.create_all(bind=engine)


# ==================================================
# DATABASE MIGRATION
# ==================================================

# Add project_id to the existing tasks table
# if the column does not already exist.

inspector = inspect(engine)

task_columns = [
    column["name"]
    for column in inspector.get_columns("tasks")
]

if "project_id" not in task_columns:
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE tasks "
                "ADD COLUMN project_id INTEGER"
            )
        )


# ==================================================
# FASTAPI APP
# ==================================================

app = FastAPI(
    title="FocusSpace API",
    version="1.0.0"
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# PYDANTIC SCHEMAS
# ==================================================

class TaskCreate(BaseModel):
    title: str
    category: str = "Personal"
    priority: str = "Medium"
    project_id: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    priority: str | None = None
    completed: bool | None = None
    project_id: int | None = None


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    status: str = "Active"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():
    return {
        "message": "FocusSpace Backend is running!"
    }


# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "FocusSpace API is connected"
    }


# ==================================================
# TASK APIs
# ==================================================

# GET ALL TASKS
@app.get("/api/tasks")
def get_tasks(
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).all()

    return tasks


# CREATE TASK
@app.post("/api/tasks")
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db)
):
    # Check project if project_id is provided
    if task_data.project_id is not None:

        project = (
            db.query(Project)
            .filter(
                Project.id == task_data.project_id
            )
            .first()
        )

        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

    new_task = Task(
        title=task_data.title,
        category=task_data.category,
        priority=task_data.priority,
        completed=False,
        project_id=task_data.project_id
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


# UPDATE TASK
@app.put("/api/tasks/{task_id}")
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db)
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Check project if project_id is being changed
    if task_data.project_id is not None:

        project = (
            db.query(Project)
            .filter(
                Project.id == task_data.project_id
            )
            .first()
        )

        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

    update_data = task_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


# DELETE TASK
@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }


# ==================================================
# PROJECT APIs
# ==================================================

# GET ALL PROJECTS
@app.get("/api/projects")
def get_projects(
    db: Session = Depends(get_db)
):
    projects = db.query(Project).all()

    return projects


# CREATE PROJECT
@app.post("/api/projects")
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        status=project_data.status
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


# UPDATE PROJECT
@app.put("/api/projects/{project_id}")
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    update_data = project_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return project


# DELETE PROJECT
@app.delete("/api/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Remove project association from its tasks
    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .all()
    )

    for task in tasks:
        task.project_id = None

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }