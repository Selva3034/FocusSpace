"use client";

import { useEffect, useState } from "react";

import TaskManager from "./TaskManager";
import ProjectsManager from "./ProjectsManager";
import NotesManager from "./NotesManager";
import GoalsManager from "./GoalsManager";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
};

type Goal = {
  id: number;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  progress: number;
  status: "Active" | "Completed" | "Paused";
};

type Project = {
  id: number;
  name: string;
  description: string;
  status: string;
};

type ProjectProgress = {
  project_id: number;
  project_name: string;
  total_tasks: number;
  completed_tasks: number;
  progress: number;
};

type Note = {
  id: number;
  title: string;
  content: string;
  project_id: number | null;
};

type ActiveMenu =
  | "Dashboard"
  | "Tasks"
  | "Projects"
  | "Notes"
  | "Goals";

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [activeMenu, setActiveMenu] =
    useState<ActiveMenu>("Dashboard");

  // ==================================================
  // TASK STATE
  // ==================================================

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // GOAL STATE
  // ==================================================

  const [goals, setGoals] = useState<Goal[]>([]);

  // ==================================================
  // PROJECT STATE
  // ==================================================

  const [projects, setProjects] = useState<Project[]>(
    []
  );

  const [projectProgress, setProjectProgress] =
    useState<ProjectProgress[]>([]);

  const [projectsLoading, setProjectsLoading] =
    useState(true);

  // ==================================================
  // NOTE STATE
  // ==================================================

  const [notes, setNotes] = useState<Note[]>([]);

  const [notesLoading, setNotesLoading] =
    useState(true);

  // ==================================================
  // BACKEND STATE
  // ==================================================

  const [backendOnline, setBackendOnline] =
    useState(false);

  // ==================================================
  // QUICK TASK
  // ==================================================

  const [newTask, setNewTask] = useState("");

  // ==================================================
  // LOAD TASKS
  // ==================================================

  const loadTasks = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/tasks`
      );

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();

      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD GOALS
  // ==================================================

  const loadGoals = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/goals`
      );

      if (!response.ok) {
        throw new Error("Failed to load goals");
      }

      const data = await response.json();

      setGoals(data);
    } catch (error) {
      console.error(error);
    }
  };

  // ==================================================
  // LOAD PROJECTS
  // ==================================================

  const loadProjects = async () => {
    try {
      setProjectsLoading(true);

      const [
        projectsResponse,
        progressResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/projects`),
        fetch(`${API_URL}/api/projects-progress`),
      ]);

      if (!projectsResponse.ok) {
        throw new Error(
          "Failed to load projects"
        );
      }

      if (!progressResponse.ok) {
        throw new Error(
          "Failed to load project progress"
        );
      }

      const projectsData =
        await projectsResponse.json();

      const progressData =
        await progressResponse.json();

      setProjects(projectsData);
      setProjectProgress(progressData);
    } catch (error) {
      console.error(error);
    } finally {
      setProjectsLoading(false);
    }
  };

  // ==================================================
  // LOAD NOTES
  // ==================================================

  const loadNotes = async () => {
    try {
      setNotesLoading(true);

      const response = await fetch(
        `${API_URL}/api/notes`
      );

      if (!response.ok) {
        throw new Error("Failed to load notes");
      }

      const data = await response.json();

      setNotes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setNotesLoading(false);
    }
  };

  // ==================================================
  // CHECK BACKEND
  // ==================================================

  const checkBackend = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/health`
      );

      setBackendOnline(response.ok);
    } catch {
      setBackendOnline(false);
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadTasks();
    loadGoals();
    loadProjects();
    loadNotes();
    checkBackend();
  }, []);

  // ==================================================
  // REFRESH DATA WHEN DASHBOARD OPENS
  // ==================================================

  useEffect(() => {
    if (activeMenu === "Dashboard") {
      loadTasks();
      loadGoals();
      loadProjects();
      loadNotes();
    }
  }, [activeMenu]);

  // ==================================================
  // ADD QUICK TASK
  // ==================================================

  const addQuickTask = async () => {
    if (!newTask.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: newTask.trim(),
            category: "Personal",
            priority: "Medium",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create task"
        );
      }

      const createdTask =
        await response.json();

      setTasks((currentTasks) => [
        ...currentTasks,
        createdTask,
      ]);

      setNewTask("");
    } catch (error) {
      console.error(error);
    }
  };

  // ==================================================
  // TOGGLE TASK
  // ==================================================

  const toggleTask = async (task: Task) => {
    const updatedCompleted =
      !task.completed;

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed: updatedCompleted,
            }
          : item
      )
    );

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: updatedCompleted,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update task"
        );
      }

      const updatedTask =
        await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );

      await loadProjects();
    } catch (error) {
      console.error(error);

      await loadTasks();
      await loadProjects();
    }
  };

  // ==================================================
  // POMODORO
  // ==================================================

  const [timeLeft, setTimeLeft] =
    useState(25 * 60);

  const [timerRunning, setTimerRunning] =
    useState(false);

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          setTimerRunning(false);

          return 25 * 60;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning]);

  const minutes = Math.floor(
    timeLeft / 60
  )
    .toString()
    .padStart(2, "0");

  const seconds = (timeLeft % 60)
    .toString()
    .padStart(2, "0");

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(25 * 60);
  };

  // ==================================================
  // TASK STATISTICS
  // ==================================================

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks =
    tasks.length - completedTasks;

  const completionPercentage =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedTasks /
            tasks.length) *
            100
        );

  // ==================================================
  // GOAL STATISTICS
  // ==================================================

  const activeGoals = goals.filter(
    (goal) => goal.status === "Active"
  ).length;

  const completedGoals = goals.filter(
    (goal) => goal.status === "Completed"
  ).length;

  const goalProgress =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce(
            (total, goal) =>
              total + goal.progress,
            0
          ) / goals.length
        );

  // ==================================================
  // PROJECT STATISTICS
  // ==================================================

  const activeProjects =
    projects.filter(
      (project) =>
        project.status === "Active"
    ).length;

  const completedProjects =
    projects.filter(
      (project) =>
        project.status === "Completed"
    ).length;

  const overallProjectProgress =
    projectProgress.length === 0
      ? 0
      : Math.round(
          projectProgress.reduce(
            (total, project) =>
              total + project.progress,
            0
          ) / projectProgress.length
        );

  // ==================================================
  // PROJECT HELPERS
  // ==================================================

  const getProjectProgress = (
    projectId: number
  ) => {
    return (
      projectProgress.find(
        (item) =>
          item.project_id === projectId
      ) || {
        project_id: projectId,
        project_name: "",
        total_tasks: 0,
        completed_tasks: 0,
        progress: 0,
      }
    );
  };

  const getProjectStatusClass = (
    status: string
  ) => {
    if (status === "Completed") {
      return "bg-green-400/10 text-green-400";
    }

    if (status === "Paused") {
      return "bg-yellow-400/10 text-yellow-400";
    }

    return "bg-cyan-400/10 text-cyan-400";
  };

  // ==================================================
  // GOAL HELPERS
  // ==================================================

  const formatGoalDate = (
    date: string | null
  ) => {
    if (!date) {
      return "No target date";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getGoalStatusClass = (
    status: Goal["status"]
  ) => {
    if (status === "Completed") {
      return "bg-green-400/10 text-green-400";
    }

    if (status === "Paused") {
      return "bg-yellow-400/10 text-yellow-400";
    }

    return "bg-cyan-400/10 text-cyan-400";
  };

  // ==================================================
  // SIDEBAR MENU
  // ==================================================

  const menuItems: ActiveMenu[] = [
    "Dashboard",
    "Tasks",
    "Projects",
    "Notes",
    "Goals",
  ];

  // ==================================================
  // DASHBOARD
  // ==================================================

  const renderDashboard = () => {
    return (
      <main className="min-h-screen bg-[#0b0f14] text-white">

        <div className="mx-auto max-w-7xl px-6 py-10">

          {/* HEADER */}

          <div className="mb-8">

            <p className="text-sm text-gray-500">
              Welcome back
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage your work, tasks and focus.
            </p>

          </div>

          {/* ==================================================
              TASK STATISTICS
          ================================================== */}

          <div className="grid gap-4 md:grid-cols-4">

            <StatCard
              title="Total Tasks"
              value={tasks.length}
              description="All your tasks"
            />

            <StatCard
              title="Completed"
              value={completedTasks}
              description="Tasks finished"
            />

            <StatCard
              title="Pending"
              value={pendingTasks}
              description="Tasks remaining"
            />

            <StatCard
              title="Completion"
              value={`${completionPercentage}%`}
              description="Overall progress"
            />

          </div>

          {/* ==================================================
              PROJECT STATISTICS
          ================================================== */}

          <div className="mt-4 grid gap-4 md:grid-cols-4">

            <StatCard
              title="Total Projects"
              value={projects.length}
              description="All your projects"
            />

            <StatCard
              title="Active Projects"
              value={activeProjects}
              description="Projects in progress"
            />

            <StatCard
              title="Completed Projects"
              value={completedProjects}
              description="Projects finished"
            />

            <StatCard
              title="Project Progress"
              value={`${overallProjectProgress}%`}
              description="Overall project progress"
            />

          </div>

          {/* ==================================================
              GOAL STATISTICS
          ================================================== */}

          <div className="mt-4 grid gap-4 md:grid-cols-4">

            <StatCard
              title="Total Goals"
              value={goals.length}
              description="All your goals"
            />

            <StatCard
              title="Active Goals"
              value={activeGoals}
              description="Goals in progress"
            />

            <StatCard
              title="Completed Goals"
              value={completedGoals}
              description="Goals achieved"
            />

            <StatCard
              title="Goal Progress"
              value={`${goalProgress}%`}
              description="Overall goal progress"
            />

          </div>

          {/* ==================================================
              NOTES STATISTICS
          ================================================== */}

          <div className="mt-4">

            <StatCard
              title="Total Notes"
              value={notes.length}
              description="All your notes"
            />

          </div>

          {/* ==================================================
              RECENT PROJECTS
          ================================================== */}

          <section className="mt-8">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  Recent Projects
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Track your projects and their progress.
                </p>

              </div>

              <button
                onClick={() =>
                  setActiveMenu("Projects")
                }
                className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
              >
                View all
              </button>

            </div>

            {projectsLoading ? (

              <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-500">
                Loading projects...
              </div>

            ) : projects.length === 0 ? (

              <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center">

                <p className="text-gray-400">
                  No projects yet.
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Create your first project to start tracking progress.
                </p>

                <button
                  onClick={() =>
                    setActiveMenu("Projects")
                  }
                  className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
                >
                  Create Project
                </button>

              </div>

            ) : (

              <div className="grid gap-4 md:grid-cols-2">

                {projects
                  .slice(0, 4)
                  .map((project) => {

                    const progress =
                      getProjectProgress(
                        project.id
                      );

                    return (
                      <div
                        key={project.id}
                        className="rounded-2xl border border-white/10 bg-[#101827] p-5 transition hover:border-cyan-400/20"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">

                            <h3 className="truncate font-bold">
                              {project.name}
                            </h3>

                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {project.description ||
                                "No description provided."}
                            </p>

                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getProjectStatusClass(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>

                        </div>

                        <div className="mt-5">

                          <div className="mb-2 flex items-center justify-between">

                            <span className="text-sm text-gray-400">
                              Progress
                            </span>

                            <span className="text-sm font-semibold text-cyan-400">
                              {progress.progress}%
                            </span>

                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-white/10">

                            <div
                              className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                              style={{
                                width: `${progress.progress}%`,
                              }}
                            />

                          </div>

                        </div>

                        <div className="mt-4 flex items-center justify-between">

                          <span className="text-xs text-gray-500">
                            {progress.completed_tasks}{" "}
                            /{" "}
                            {progress.total_tasks}{" "}
                            tasks completed
                          </span>

                          <button
                            onClick={() =>
                              setActiveMenu(
                                "Projects"
                              )
                            }
                            className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                          >
                            Manage
                          </button>

                        </div>

                      </div>
                    );
                  })}

              </div>

            )}

          </section>

          {/* ==================================================
              RECENT GOALS
          ================================================== */}

          <section className="mt-8">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  Recent Goals
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Track your latest goals and progress.
                </p>

              </div>

              <button
                onClick={() =>
                  setActiveMenu("Goals")
                }
                className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
              >
                View all
              </button>

            </div>

            {goals.length === 0 ? (

              <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center">

                <p className="text-gray-400">
                  No goals yet.
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Create your first goal to start tracking progress.
                </p>

                <button
                  onClick={() =>
                    setActiveMenu("Goals")
                  }
                  className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
                >
                  Create Goal
                </button>

              </div>

            ) : (

              <div className="grid gap-4 md:grid-cols-2">

                {goals
                  .slice(0, 4)
                  .map((goal) => (

                    <div
                      key={goal.id}
                      className="rounded-2xl border border-white/10 bg-[#101827] p-5 transition hover:border-cyan-400/20"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <h3 className="truncate font-bold">
                            {goal.title}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {goal.category}
                          </p>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getGoalStatusClass(
                            goal.status
                          )}`}
                        >
                          {goal.status}
                        </span>

                      </div>

                      <div className="mt-5">

                        <div className="mb-2 flex items-center justify-between">

                          <span className="text-sm text-gray-400">
                            Progress
                          </span>

                          <span className="text-sm font-semibold text-cyan-400">
                            {goal.progress}%
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/10">

                          <div
                            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                            style={{
                              width: `${goal.progress}%`,
                            }}
                          />

                        </div>

                      </div>

                      <div className="mt-4 flex items-center justify-between">

                        <span className="text-xs text-gray-500">
                          Target:{" "}
                          {formatGoalDate(
                            goal.target_date
                          )}
                        </span>

                        <button
                          onClick={() =>
                            setActiveMenu(
                              "Goals"
                            )
                          }
                          className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                        >
                          Manage
                        </button>

                      </div>

                    </div>

                  ))}

              </div>

            )}

          </section>

          {/* ==================================================
              RECENT NOTES
          ================================================== */}

          <section className="mt-8">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  Recent Notes
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your latest notes and ideas.
                </p>

              </div>

              <button
                onClick={() =>
                  setActiveMenu("Notes")
                }
                className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
              >
                View all
              </button>

            </div>

            {notesLoading ? (

              <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-500">
                Loading notes...
              </div>

            ) : notes.length === 0 ? (

              <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center">

                <p className="text-gray-400">
                  No notes yet.
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Create your first note to save your ideas.
                </p>

                <button
                  onClick={() =>
                    setActiveMenu("Notes")
                  }
                  className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
                >
                  Create Note
                </button>

              </div>

            ) : (

              <div className="grid gap-4 md:grid-cols-2">

                {notes
                  .slice(0, 4)
                  .map((note) => {

                    const linkedProject =
                      projects.find(
                        (project) =>
                          project.id ===
                          note.project_id
                      );

                    return (
                      <div
                        key={note.id}
                        className="rounded-2xl border border-white/10 bg-[#101827] p-5 transition hover:border-cyan-400/20"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">

                            <h3 className="truncate font-bold">
                              {note.title}
                            </h3>

                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-400">
                              {note.content ||
                                "No content available."}
                            </p>

                          </div>

                          <span className="shrink-0 rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                            {linkedProject
                              ? linkedProject.name
                              : "Personal"}
                          </span>

                        </div>

                        <div className="mt-5 flex items-center justify-end">

                          <button
                            onClick={() =>
                              setActiveMenu(
                                "Notes"
                              )
                            }
                            className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                          >
                            Open Notes
                          </button>

                        </div>

                      </div>
                    );
                  })}

              </div>

            )}

          </section>

          {/* ==================================================
              MAIN DASHBOARD GRID
          ================================================== */}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* ==================================================
                TASKS
            ================================================== */}

            <section>

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-bold">
                    Today's Tasks
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Your current workload
                  </p>

                </div>

                <button
                  onClick={() =>
                    setActiveMenu("Tasks")
                  }
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                >
                  View all
                </button>

              </div>

              {loading ? (

                <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-500">
                  Loading tasks...
                </div>

              ) : tasks.length === 0 ? (

                <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-500">
                  No tasks yet.
                </div>

              ) : (

                <div className="space-y-4">

                  {tasks
                    .slice(0, 5)
                    .map((task) => {

                      const priorityClass =
                        task.priority ===
                        "High"
                          ? "bg-red-400/10 text-red-400"
                          : task.priority ===
                            "Medium"
                          ? "bg-yellow-400/10 text-yellow-400"
                          : "bg-green-400/10 text-green-400";

                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-[#101827] p-5 ${
                            task.completed
                              ? "opacity-60"
                              : ""
                          }`}
                        >

                          <button
                            type="button"
                            onClick={() =>
                              toggleTask(
                                task
                              )
                            }
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                              task.completed
                                ? "border-cyan-400 bg-cyan-400 text-black"
                                : "border-gray-600 hover:border-cyan-400"
                            }`}
                            aria-label={
                              task.completed
                                ? "Mark task as incomplete"
                                : "Mark task as complete"
                            }
                          >
                            {task.completed &&
                              "✓"}
                          </button>

                          <div className="min-w-0 flex-1">

                            <h3
                              className={`font-semibold ${
                                task.completed
                                  ? "text-gray-500 line-through"
                                  : "text-white"
                              }`}
                            >
                              {task.title}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {task.category}
                            </p>

                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${priorityClass}`}
                          >
                            {task.priority}
                          </span>

                        </div>
                      );
                    })}

                </div>

              )}

              {/* QUICK ADD */}

              <div className="mt-4 flex gap-3">

                <input
                  type="text"
                  value={newTask}
                  onChange={(event) =>
                    setNewTask(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      addQuickTask();
                    }
                  }}
                  placeholder="Add a quick task..."
                  className="flex-1 rounded-xl border border-white/10 bg-[#101827] px-4 py-4 text-white outline-none placeholder:text-gray-500 focus:border-cyan-400"
                />

                <button
                  onClick={addQuickTask}
                  className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-black transition hover:bg-cyan-300"
                >
                  Add
                </button>

              </div>

            </section>

            {/* ==================================================
                POMODORO
            ================================================== */}

            <section className="rounded-3xl border border-white/10 bg-[#101827] p-6">

              <p className="text-sm text-gray-500">
                Focus session
              </p>

              <h2 className="mt-3 text-xl font-bold">
                Pomodoro Timer
              </h2>

              <div className="mt-8 text-center">

                <div className="text-6xl font-bold text-cyan-400">
                  {minutes}:{seconds}
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  {timerRunning
                    ? "Focus mode active"
                    : "Ready when you are"}
                </p>

              </div>

              <div className="mt-8 flex gap-3">

                <button
                  onClick={() =>
                    setTimerRunning(
                      (current) =>
                        !current
                    )
                  }
                  className="flex-1 rounded-xl bg-cyan-400 px-6 py-4 font-bold text-black hover:bg-cyan-300"
                >
                  {timerRunning
                    ? "Pause"
                    : "Start"}
                </button>

                <button
                  onClick={resetTimer}
                  className="rounded-xl border border-white/10 px-5 py-4 text-sm text-gray-400 hover:bg-white/5"
                >
                  Reset
                </button>

              </div>

            </section>

          </div>

          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <section className="mt-10">

            <h2 className="text-2xl font-bold">
              Quick Actions
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-4">

              <button
                onClick={() =>
                  setActiveMenu("Tasks")
                }
                className="rounded-2xl border border-white/10 bg-[#101827] p-6 text-left transition hover:border-cyan-400/30"
              >

                <p className="font-bold">
                  Manage Tasks
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Create and organize your tasks.
                </p>

              </button>

              <button
                onClick={() =>
                  setActiveMenu(
                    "Projects"
                  )
                }
                className="rounded-2xl border border-white/10 bg-[#101827] p-6 text-left transition hover:border-cyan-400/30"
              >

                <p className="font-bold">
                  Manage Projects
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Track your projects and progress.
                </p>

              </button>

              <button
                onClick={() =>
                  setActiveMenu("Notes")
                }
                className="rounded-2xl border border-white/10 bg-[#101827] p-6 text-left transition hover:border-cyan-400/30"
              >

                <p className="font-bold">
                  Manage Notes
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Create and organize your notes.
                </p>

              </button>

              <button
                onClick={() =>
                  setActiveMenu("Goals")
                }
                className="rounded-2xl border border-white/10 bg-[#101827] p-6 text-left transition hover:border-cyan-400/30"
              >

                <p className="font-bold">
                  Manage Goals
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Set goals and track your progress.
                </p>

              </button>

            </div>

          </section>

        </div>

      </main>
    );
  };

  // ==================================================
  // MAIN RETURN
  // ==================================================

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 border-r border-white/10 bg-[#0d131c] lg:block">

        <div className="p-6">

          <h1 className="text-2xl font-bold">

            Focus
            <span className="text-cyan-400">
              Space
            </span>

          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Digital Workspace
          </p>

        </div>

        <nav className="px-4">

          {menuItems.map((item) => (

            <button
              key={item}
              onClick={() =>
                setActiveMenu(item)
              }
              className={`mb-2 w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                activeMenu === item
                  ? "bg-cyan-400 text-black"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item}
            </button>

          ))}

        </nav>

        {/* SYSTEM STATUS */}

        <div className="absolute bottom-8 left-6 right-6 border-t border-white/10 pt-6">

          <p className="text-xs uppercase tracking-wider text-gray-600">
            System
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">

            <span
              className={`h-2 w-2 rounded-full ${
                backendOnline
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />

            {backendOnline
              ? "Backend Online"
              : "Backend Offline"}

          </div>

        </div>

      </aside>

      {/* ==================================================
          MOBILE NAVIGATION
      ================================================== */}

      <div className="flex gap-2 overflow-x-auto border-b border-white/10 bg-[#0d131c] p-4 lg:hidden">

        {menuItems.map((item) => (

          <button
            key={item}
            onClick={() =>
              setActiveMenu(item)
            }
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition ${
              activeMenu === item
                ? "bg-cyan-400 text-black"
                : "bg-white/5 text-gray-400"
            }`}
          >
            {item}
          </button>

        ))}

      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="lg:pl-64">

        {activeMenu === "Dashboard" && (
          renderDashboard()
        )}

        {activeMenu === "Tasks" && (
          <TaskManager />
        )}

        {activeMenu === "Projects" && (
          <ProjectsManager />
        )}

        {activeMenu === "Notes" && (
          <NotesManager />
        )}

        {activeMenu === "Goals" && (
          <GoalsManager />
        )}

      </div>

    </div>
  );
}

// ==================================================
// STAT CARD
// ==================================================

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101827] p-6">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-4 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-sm text-gray-600">
        {description}
      </p>

    </div>
  );
}