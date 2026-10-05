from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from pydantic import BaseModel

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Task, Project, Note, Goal, FocusSession


# ==================================================
# DATABASE SETUP
# ==================================================

Base.metadata.create_all(bind=engine)

# ==================================================
# DATABASE MIGRATION — FOCUS SESSION TIMESTAMP
# ==================================================

try:
    inspector = inspect(engine)

    focus_session_columns = [
        column["name"]
        for column in inspector.get_columns("focus_sessions")
    ]

    if "created_at" not in focus_session_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    ALTER TABLE focus_sessions
                    ADD COLUMN created_at DATETIME
                    """
                )
            )

except Exception as migration_error:
    print(
        "FocusSession migration warning:",
        migration_error
    )
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
        # Local development
        "http://localhost:3000",
        "http://127.0.0.1:3000",

        # Production frontend
        "https://focus-space-lemon.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# PYDANTIC SCHEMAS
# ==================================================

# ------------------------------
# TASK SCHEMAS
# ------------------------------

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


# ------------------------------
# PROJECT SCHEMAS
# ------------------------------

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    status: str = "Active"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


# ------------------------------
# NOTE SCHEMAS
# ------------------------------

class NoteCreate(BaseModel):
    title: str
    content: str = ""
    project_id: int | None = None


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    project_id: int | None = None


# ------------------------------
# GOAL SCHEMAS
# ------------------------------

class GoalCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "Personal"
    target_date: str | None = None
    progress: int = 0
    status: str = "Active"


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    target_date: str | None = None
    progress: int | None = None
    status: str | None = None
class FocusSessionCreate(BaseModel):
    task_id: int | None = None
    project_id: int | None = None
    mode: str = "Focus"
    duration_minutes: int
    completed: bool = True

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

    # Unlink tasks from this project
    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .all()
    )

    for task in tasks:
        task.project_id = None

    # Unlink notes from this project
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


@app.post("/api/notes")
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db)
):

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


# ==================================================
# GOALS APIs
# ==================================================

@app.get("/api/goals")
def get_goals(
    db: Session = Depends(get_db)
):

    goals = (
        db.query(Goal)
        .order_by(Goal.id.desc())
        .all()
    )

    return goals


@app.get("/api/goals/{goal_id}")
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):

    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id)
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    return goal


@app.post("/api/goals")
def create_goal(
    goal_data: GoalCreate,
    db: Session = Depends(get_db)
):

    if (
        goal_data.progress < 0
        or goal_data.progress > 100
    ):
        raise HTTPException(
            status_code=400,
            detail="Progress must be between 0 and 100"
        )

    new_goal = Goal(
        title=goal_data.title,
        description=goal_data.description,
        category=goal_data.category,
        target_date=goal_data.target_date,
        progress=goal_data.progress,
        status=goal_data.status
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return new_goal


@app.put("/api/goals/{goal_id}")
def update_goal(
    goal_id: int,
    goal_data: GoalUpdate,
    db: Session = Depends(get_db)
):

    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id)
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    if (
        goal_data.progress is not None
        and (
            goal_data.progress < 0
            or goal_data.progress > 100
        )
    ):
        raise HTTPException(
            status_code=400,
            detail="Progress must be between 0 and 100"
        )

    update_data = goal_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)

    return goal


@app.delete("/api/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):

    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id)
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    db.delete(goal)
    db.commit()

    return {
        "message": "Goal deleted successfully"
    }
# ==================================================
# FOCUS SESSION ENDPOINTS
# ==================================================

@app.post("/api/focus-sessions")
def create_focus_session(
    session_data: FocusSessionCreate,
    db: Session = Depends(get_db)
):
    if session_data.duration_minutes <= 0:
        raise HTTPException(
            status_code=400,
            detail="Duration must be greater than 0"
        )

    focus_session = FocusSession(
        task_id=session_data.task_id,
        project_id=session_data.project_id,
        mode=session_data.mode,
        duration_minutes=session_data.duration_minutes,
        completed=session_data.completed,
    )

    db.add(focus_session)
    db.commit()
    db.refresh(focus_session)

    return {
        "id": focus_session.id,
        "task_id": focus_session.task_id,
        "project_id": focus_session.project_id,
        "mode": focus_session.mode,
        "duration_minutes": focus_session.duration_minutes,
        "completed": focus_session.completed,
    }


@app.get("/api/focus-sessions")
def get_focus_sessions(
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(FocusSession)
        .order_by(FocusSession.id.desc())
        .all()
    )

    return [
        {
            "id": session.id,
            "task_id": session.task_id,
            "project_id": session.project_id,
            "mode": session.mode,
            "duration_minutes": session.duration_minutes,
            "completed": session.completed,
        }
        for session in sessions
    ]


@app.get("/api/focus-sessions/stats")
def get_focus_session_stats(
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(FocusSession)
        .filter(
            FocusSession.mode == "Focus",
            FocusSession.completed == True
        )
        .all()
    )

    total_sessions = len(sessions)

    total_minutes = sum(
        session.duration_minutes
        for session in sessions
    )

    return {
        "total_sessions": total_sessions,
        "total_minutes": total_minutes,
    }
    # ==================================================
# WEEKLY FOCUS ANALYTICS
# ==================================================

@app.get("/api/focus-sessions/weekly")
def get_weekly_focus_analytics(
    db: Session = Depends(get_db)
):
    today = datetime.utcnow().date()

    # Monday = 0, Sunday = 6
    week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)

    sessions = (
        db.query(FocusSession)
        .filter(
            FocusSession.mode == "Focus",
            FocusSession.completed == True,
            FocusSession.created_at != None
        )
        .all()
    )

    daily_data = []

    total_sessions = 0
    total_minutes = 0

    for day_offset in range(7):
        current_date = week_start + timedelta(days=day_offset)

        day_sessions = [
            session
            for session in sessions
            if session.created_at.date() == current_date
        ]

        session_count = len(day_sessions)

        minutes = sum(
            session.duration_minutes
            for session in day_sessions
        )

        total_sessions += session_count
        total_minutes += minutes

        daily_data.append({
            "date": current_date.isoformat(),
            "day": current_date.strftime("%a"),
            "minutes": minutes,
            "sessions": session_count,
        })

    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "total_sessions": total_sessions,
        "total_minutes": total_minutes,
        "daily": daily_data,
    }