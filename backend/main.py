from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Task, Project, Note


# ==================================================
# DATABASE SETUP
# ==================================================

Base.metadata.create_all(bind=engine)


# ==================================================
# DATABASE MIGRATION
# ==================================================

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


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    project_id: int | None = None


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    project_id: int | None = None


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

@app.get("/api/tasks")
def get_tasks(
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).all()

    return tasks


@app.post("/api/tasks")
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db)
):
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

@app.get("/api/projects")
def get_projects(
    db: Session = Depends(get_db)
):
    projects = db.query(Project).all()

    return projects


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

    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .all()
    )

    for task in tasks:
        task.project_id = None

    notes = (
        db.query(Note)
        .filter(Note.project_id == project_id)
        .all()
    )

    for note in notes:
        note.project_id = None

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }


# ==================================================
# PROJECT PROGRESS
# ==================================================

@app.get("/api/projects/{project_id}/progress")
def get_project_progress(
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

    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .all()
    )

    total_tasks = len(tasks)

    completed_tasks = sum(
        1
        for task in tasks
        if task.completed
    )

    if total_tasks == 0:
        progress = 0
    else:
        progress = round(
            (completed_tasks / total_tasks) * 100
        )

    return {
        "project_id": project.id,
        "project_name": project.name,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "progress": progress
    }


@app.get("/api/projects-progress")
def get_all_projects_progress(
    db: Session = Depends(get_db)
):
    projects = db.query(Project).all()

    results = []

    for project in projects:

        tasks = (
            db.query(Task)
            .filter(
                Task.project_id == project.id
            )
            .all()
        )

        total_tasks = len(tasks)

        completed_tasks = sum(
            1
            for task in tasks
            if task.completed
        )

        if total_tasks == 0:
            progress = 0
        else:
            progress = round(
                (completed_tasks / total_tasks) * 100
            )

        results.append({
            "project_id": project.id,
            "project_name": project.name,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "progress": progress
        })

    return results


# ==================================================
# NOTES APIs
# ==================================================

# GET ALL NOTES
@app.get("/api/notes")
def get_notes(
    db: Session = Depends(get_db)
):
    notes = (
        db.query(Note)
        .order_by(Note.id.desc())
        .all()
    )

    return notes


# GET SINGLE NOTE
@app.get("/api/notes/{note_id}")
def get_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    note = (
        db.query(Note)
        .filter(Note.id == note_id)
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    return note


# CREATE NOTE
@app.post("/api/notes")
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db)
):
    # Check project if supplied
    if note_data.project_id is not None:

        project = (
            db.query(Project)
            .filter(
                Project.id == note_data.project_id
            )
            .first()
        )

        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

    new_note = Note(
        title=note_data.title,
        content=note_data.content,
        project_id=note_data.project_id
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note


# UPDATE NOTE
@app.put("/api/notes/{note_id}")
def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db)
):
    note = (
        db.query(Note)
        .filter(Note.id == note_id)
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    if note_data.project_id is not None:

        project = (
            db.query(Project)
            .filter(
                Project.id == note_data.project_id
            )
            .first()
        )

        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

    update_data = note_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(note, field, value)

    db.commit()
    db.refresh(note)

    return note


# DELETE NOTE
@app.delete("/api/notes/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    note = (
        db.query(Note)
        .filter(Note.id == note_id)
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    db.delete(note)
    db.commit()

    return {
        "message": "Note deleted successfully"
    }   

# ==================================================
# PROJECT NOTES API
# ==================================================

@app.get("/api/projects/{project_id}/notes")
def get_project_notes(
    project_id: int,
    db: Session = Depends(get_db)
):
    # Check whether project exists
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

    notes = (
        db.query(Note)
        .filter(
            Note.project_id == project_id
        )
        .order_by(Note.id.desc())
        .all()
    )

    return notes    