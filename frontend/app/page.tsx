"use client";

import { useEffect, useMemo, useState } from "react";

import TaskManager from "./TaskManager";
import ProjectsManager from "./ProjectsManager";
import NotesManager from "./NotesManager";
import GoalsManager from "./GoalsManager";

const API_URL = "http://127.0.0.1:8000";

/* =========================
   TYPES
========================= */

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  project_id: number | null;
};

type GoalStatus = "Active" | "Completed" | "Paused";

type Goal = {
  id: number;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  progress: number;
  status: GoalStatus;
};

type Project = {
  id: number;
  name: string;
  description: string;
  status: string;
};

type ProjectProgress = {
  project_id: number;
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

type SearchResult = {
  type: "Task" | "Project" | "Note" | "Goal";
  id: number;
  title: string;
  subtitle: string;
};

type TaskFilter =
  | "All"
  | "Pending"
  | "Completed"
  | "High"
  | "Medium"
  | "Low";

type TaskSort =
  | "Newest"
  | "Oldest"
  | "Priority"
  | "Completed";

type ToastType =
  | "success"
  | "error"
  | "info";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

/* =========================
   NAVIGATION ITEMS
========================= */

const navigationItems: {
  name: ActiveMenu;
  icon: string;
  description: string;
}[] = [
  {
    name: "Dashboard",
    icon: "⌂",
    description: "Overview",
  },
  {
    name: "Tasks",
    icon: "✓",
    description: "Your tasks",
  },
  {
    name: "Projects",
    icon: "▣",
    description: "Workspaces",
  },
  {
    name: "Notes",
    icon: "✎",
    description: "Your notes",
  },
  {
    name: "Goals",
    icon: "◎",
    description: "Track goals",
  },
];

/* =========================
   MAIN COMPONENT
========================= */

export default function Home() {
  const [activeMenu, setActiveMenu] =
    useState<ActiveMenu>("Dashboard");

  /* TASKS */

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] =
    useState(true);

  const [taskFilter, setTaskFilter] =
    useState<TaskFilter>("All");

  const [taskSort, setTaskSort] =
    useState<TaskSort>("Newest");

  /* GOALS */

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] =
    useState(true);

  /* PROJECTS */

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [projectProgress, setProjectProgress] =
    useState<ProjectProgress[]>([]);

  const [projectsLoading, setProjectsLoading] =
    useState(true);

  /* NOTES */

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] =
    useState(true);

  /* BACKEND */

  const [backendOnline, setBackendOnline] =
    useState(false);

  /* QUICK TASK */

  const [newTask, setNewTask] =
    useState("");

  /* SEARCH */

  const [searchQuery, setSearchQuery] =
    useState("");

  /* TOAST */

  const [toasts, setToasts] =
    useState<Toast[]>([]);

  /* POMODORO */

  const [pomodoroSeconds, setPomodoroSeconds] =
    useState(25 * 60);

  const [pomodoroRunning, setPomodoroRunning] =
    useState(false);

  /* =========================
     TOAST
  ========================= */

  const showToast = (
    type: ToastType,
    title: string,
    message: string
  ) => {
    const id = Date.now();

    setToasts((current) => [
      ...current,
      {
        id,
        type,
        title,
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((current) =>
        current.filter(
          (toast) => toast.id !== id
        )
      );
    }, 3500);
  };

  /* =========================
     LOAD TASKS
  ========================= */

  const loadTasks = async () => {
    try {
      setTasksLoading(true);

      const response = await fetch(
        `${API_URL}/api/tasks`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load tasks"
        );
      }

      const data = await response.json();

      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setTasksLoading(false);
    }
  };

  /* =========================
     LOAD GOALS
  ========================= */

  const loadGoals = async () => {
    try {
      setGoalsLoading(true);

      const response = await fetch(
        `${API_URL}/api/goals`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load goals"
        );
      }

      const data = await response.json();

      setGoals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setGoalsLoading(false);
    }
  };

  /* =========================
     LOAD PROJECTS
  ========================= */

  const loadProjects = async () => {
    try {
      setProjectsLoading(true);

      const [
        projectsResponse,
        progressResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/projects`),
        fetch(
          `${API_URL}/api/projects-progress`
        ),
      ]);

      if (
        !projectsResponse.ok ||
        !progressResponse.ok
      ) {
        throw new Error(
          "Failed to load projects"
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

  /* =========================
     LOAD NOTES
  ========================= */

  const loadNotes = async () => {
    try {
      setNotesLoading(true);

      const response = await fetch(
        `${API_URL}/api/notes`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load notes"
        );
      }

      const data = await response.json();

      setNotes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setNotesLoading(false);
    }
  };

  /* =========================
     BACKEND
  ========================= */

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

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    loadTasks();
    loadGoals();
    loadProjects();
    loadNotes();
    checkBackend();
  }, []);

  /* =========================
     DASHBOARD REFRESH
  ========================= */

  useEffect(() => {
    if (activeMenu === "Dashboard") {
      loadTasks();
      loadGoals();
      loadProjects();
      loadNotes();
      checkBackend();
    }
  }, [activeMenu]);

  /* =========================
     POMODORO
  ========================= */

  useEffect(() => {
    if (!pomodoroRunning) {
      return;
    }

    const timer = setInterval(() => {
      setPomodoroSeconds((current) => {
        if (current <= 1) {
          setPomodoroRunning(false);

          showToast(
            "info",
            "Pomodoro complete",
            "Your focus session has finished."
          );

          return 25 * 60;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pomodoroRunning]);

  /* =========================
     CREATE TASK
  ========================= */

  const handleCreateTask = async () => {
    const title = newTask.trim();

    if (!title) {
      showToast(
        "info",
        "Task title required",
        "Please enter a task title."
      );

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title,
            category: "Personal",
            priority: "Medium",
            completed: false,
            project_id: null,
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

      setTasks((current) => [
        createdTask,
        ...current,
      ]);

      setNewTask("");

      showToast(
        "success",
        "Task created",
        `"${title}" was added successfully.`
      );
    } catch (error) {
      console.error(error);

      showToast(
        "error",
        "Task creation failed",
        "Unable to create the task."
      );
    }
  };

  /* =========================
     TOGGLE TASK
  ========================= */

  const toggleTask = async (
    task: Task
  ) => {
    const newCompleted =
      !task.completed;

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed: newCompleted,
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: task.title,
            category: task.category,
            priority: task.priority,
            completed: newCompleted,
            project_id: task.project_id,
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

      setTasks((current) =>
        current.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );

      await loadProjects();

      showToast(
        "success",
        newCompleted
          ? "Task completed"
          : "Task reopened",
        newCompleted
          ? `"${task.title}" is completed.`
          : `"${task.title}" is back in progress.`
      );
    } catch (error) {
      console.error(error);

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? task
            : item
        )
      );

      showToast(
        "error",
        "Update failed",
        "Unable to update the task."
      );
    }
  };

  /* =========================
     DELETE TASK
  ========================= */

  const deleteTask = async (
    task: Task
  ) => {
    const confirmed = window.confirm(
      `Delete "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${task.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete task"
        );
      }

      setTasks((current) =>
        current.filter(
          (item) =>
            item.id !== task.id
        )
      );

      await loadProjects();

      showToast(
        "success",
        "Task deleted",
        `"${task.title}" was removed.`
      );
    } catch (error) {
      console.error(error);

      showToast(
        "error",
        "Delete failed",
        "Unable to delete the task."
      );
    }
  };

  /* =========================
     TASK FILTER + SORT
  ========================= */

  const filteredAndSortedTasks =
    useMemo(() => {
      let result = [...tasks];

      if (taskFilter === "Pending") {
        result = result.filter(
          (task) => !task.completed
        );
      }

      if (taskFilter === "Completed") {
        result = result.filter(
          (task) => task.completed
        );
      }

      if (
        taskFilter === "High" ||
        taskFilter === "Medium" ||
        taskFilter === "Low"
      ) {
        result = result.filter(
          (task) =>
            task.priority ===
            taskFilter
        );
      }

      if (taskSort === "Newest") {
        result.sort(
          (a, b) => b.id - a.id
        );
      }

      if (taskSort === "Oldest") {
        result.sort(
          (a, b) => a.id - b.id
        );
      }

      if (taskSort === "Priority") {
        const priorityWeight = {
          High: 3,
          Medium: 2,
          Low: 1,
        };

        result.sort(
          (a, b) =>
            priorityWeight[b.priority] -
            priorityWeight[a.priority]
        );
      }

      if (taskSort === "Completed") {
        result.sort(
          (a, b) =>
            Number(a.completed) -
            Number(b.completed)
        );
      }

      return result;
    }, [
      tasks,
      taskFilter,
      taskSort,
    ]);

  /* =========================
     HELPERS
  ========================= */

  const getProjectName = (
    projectId: number | null
  ) => {
    if (!projectId) {
      return "Personal";
    }

    return (
      projects.find(
        (project) =>
          project.id === projectId
      )?.name ||
      "Unknown Project"
    );
  };

  const getProjectProgress = (
    projectId: number
  ) => {
    return (
      projectProgress.find(
        (item) =>
          item.project_id === projectId
      ) || {
        project_id: projectId,
        total_tasks: 0,
        completed_tasks: 0,
        progress: 0,
      }
    );
  };

  /* =========================
     GLOBAL SEARCH
  ========================= */

  const searchResults =
    useMemo<SearchResult[]>(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return [];
      }

      const results: SearchResult[] =
        [];

      tasks.forEach((task) => {
        const projectName =
          getProjectName(
            task.project_id
          );

        if (
          task.title
            .toLowerCase()
            .includes(query) ||
          task.category
            .toLowerCase()
            .includes(query) ||
          task.priority
            .toLowerCase()
            .includes(query) ||
          projectName
            .toLowerCase()
            .includes(query)
        ) {
          results.push({
            type: "Task",
            id: task.id,
            title: task.title,
            subtitle: `Task • ${projectName}`,
          });
        }
      });

      projects.forEach((project) => {
        if (
          project.name
            .toLowerCase()
            .includes(query) ||
          project.description
            .toLowerCase()
            .includes(query)
        ) {
          results.push({
            type: "Project",
            id: project.id,
            title: project.name,
            subtitle: "Project",
          });
        }
      });

      notes.forEach((note) => {
        const projectName =
          getProjectName(
            note.project_id
          );

        if (
          note.title
            .toLowerCase()
            .includes(query) ||
          note.content
            .toLowerCase()
            .includes(query) ||
          projectName
            .toLowerCase()
            .includes(query)
        ) {
          results.push({
            type: "Note",
            id: note.id,
            title: note.title,
            subtitle: `Note • ${projectName}`,
          });
        }
      });

      goals.forEach((goal) => {
        if (
          goal.title
            .toLowerCase()
            .includes(query) ||
          goal.description
            .toLowerCase()
            .includes(query) ||
          goal.category
            .toLowerCase()
            .includes(query) ||
          goal.status
            .toLowerCase()
            .includes(query)
        ) {
          results.push({
            type: "Goal",
            id: goal.id,
            title: goal.title,
            subtitle: "Goal",
          });
        }
      });

      return results.slice(0, 10);
    }, [
      searchQuery,
      tasks,
      projects,
      notes,
      goals,
    ]);

  /* =========================
     SEARCH NAVIGATION
  ========================= */

  const openSearchResult = (
    result: SearchResult
  ) => {
    setActiveMenu(
      result.type === "Task"
        ? "Tasks"
        : result.type === "Project"
        ? "Projects"
        : result.type === "Note"
        ? "Notes"
        : "Goals"
    );

    setSearchQuery("");
  };

  /* =========================
     STATS
  ========================= */

  const totalTasks = tasks.length;

  const completedTasks =
    tasks.filter(
      (task) => task.completed
    ).length;

  const pendingTasks =
    tasks.filter(
      (task) => !task.completed
    ).length;

  const highPriorityTasks =
    tasks.filter(
      (task) =>
        task.priority === "High" &&
        !task.completed
    ).length;

  const activeProjects =
    projects.filter(
      (project) =>
        project.status === "Active"
    ).length;

  const activeGoals =
    goals.filter(
      (goal) =>
        goal.status === "Active"
    ).length;

  /* =========================
     POMODORO FORMAT
  ========================= */

  const formatPomodoro = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(seconds / 60);

    const remaining =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remaining).padStart(
      2,
      "0"
    )}`;
  };

  /* =========================
     NAVIGATION
  ========================= */

  const handleNavigation = (
    menu: ActiveMenu
  ) => {
    setActiveMenu(menu);
    setSearchQuery("");
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="min-h-screen bg-[#070b14] text-white">

      {/* =========================
          DESKTOP SIDEBAR
      ========================= */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 bg-[#0a0f1c] lg:block">

        <div className="flex h-full flex-col">

          {/* BRAND */}

          <div className="border-b border-white/10 px-5 py-6">

            <div className="flex items-center gap-3">

              <div className="relative">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 font-black text-black shadow-lg shadow-cyan-400/10">
                  F
                </div>

                <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0a0f1c] bg-green-400" />

              </div>

              <div className="min-w-0">

                <h1 className="truncate text-lg font-black tracking-tight">
                  FocusSpace
                </h1>

                <p className="text-xs text-gray-500">
                  Digital Workspace
                </p>

              </div>

            </div>

          </div>

          {/* WORKSPACE */}

          <div className="px-4 pt-5">

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">

              <div className="flex min-w-0 items-center gap-2">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-xs font-bold text-cyan-400">
                  S
                </div>

                <div className="min-w-0">

                  <p className="truncate text-xs font-semibold text-gray-300">
                    Personal Space
                  </p>

                  <p className="text-[9px] text-gray-600">
                    Workspace
                  </p>

                </div>

              </div>

              <span className="text-xs text-gray-600">
                ⋮
              </span>

            </div>

          </div>

          {/* NAVIGATION */}

          <nav className="flex-1 overflow-y-auto px-4 py-6">

            <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600">
              Workspace
            </p>

            <div className="space-y-1.5">

              {navigationItems.map(
                (item) => {

                  const active =
                    activeMenu ===
                    item.name;

                  return (
                    <button
                      key={item.name}
                      onClick={() =>
                        handleNavigation(
                          item.name
                        )
                      }
                      className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200 ${
                        active
                          ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/10"
                          : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >

                      {active && (
                        <span className="absolute -left-4 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400" />
                      )}

                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                          active
                            ? "bg-black/10"
                            : "bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-cyan-400"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-semibold">
                          {item.name}
                        </p>

                        <p
                          className={`mt-0.5 text-[10px] ${
                            active
                              ? "text-black/60"
                              : "text-gray-600 group-hover:text-gray-500"
                          }`}
                        >
                          {
                            item.description
                          }
                        </p>

                      </div>

                      {item.name ===
                        "Tasks" &&
                        pendingTasks >
                          0 && (
                          <span
                            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-bold ${
                              active
                                ? "bg-black/10 text-black"
                                : "bg-cyan-400/10 text-cyan-400"
                            }`}
                          >
                            {
                              pendingTasks
                            }
                          </span>
                        )}

                      {item.name ===
                        "Goals" &&
                        activeGoals >
                          0 && (
                          <span
                            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-bold ${
                              active
                                ? "bg-black/10 text-black"
                                : "bg-cyan-400/10 text-cyan-400"
                            }`}
                          >
                            {
                              activeGoals
                            }
                          </span>
                        )}

                    </button>
                  );
                }
              )}

            </div>

          </nav>

          {/* BOTTOM SIDEBAR */}

          <div className="space-y-3 border-t border-white/10 p-4">

            {/* BACKEND STATUS */}

            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      backendOnline
                        ? "bg-green-400 shadow-lg shadow-green-400/30"
                        : "bg-red-400 shadow-lg shadow-red-400/30"
                    }`}
                  />

                  <span className="text-[10px] font-medium text-gray-500">
                    Backend
                  </span>

                </div>

                <span
                  className={`text-[9px] font-semibold ${
                    backendOnline
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {backendOnline
                    ? "ONLINE"
                    : "OFFLINE"}
                </span>

              </div>

            </div>

            {/* PROFILE */}

            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-black text-black">
                S
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-xs font-semibold text-gray-300">
                  Developer
                </p>

                <p className="truncate text-[9px] text-gray-600">
                  FocusSpace User
                </p>

              </div>

              <span className="text-xs text-gray-600">
                ⋮
              </span>

            </div>

          </div>

        </div>

      </aside>

      {/* =========================
          MOBILE HEADER
      ========================= */}

      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/95 backdrop-blur-xl lg:hidden">

        <div className="flex items-center justify-between px-4 py-3">

          <div className="flex items-center gap-3">

            <div className="relative">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 font-black text-black">
                F
              </div>

              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070b14] bg-green-400" />

            </div>

            <div>

              <p className="text-sm font-bold">
                FocusSpace
              </p>

              <p className="text-[9px] text-gray-600">
                Digital Workspace
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2">

            <span
              className={`h-2 w-2 rounded-full ${
                backendOnline
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />

            <span className="text-[9px] text-gray-500">
              {backendOnline
                ? "Online"
                : "Offline"}
            </span>

          </div>

        </div>

      </div>

      {/* =========================
          MOBILE NAVIGATION
      ========================= */}

      <div className="sticky top-[65px] z-30 overflow-x-auto border-b border-white/10 bg-[#070b14]/95 backdrop-blur-xl lg:hidden">

        <div className="flex min-w-max gap-2 px-4 py-3">

          {navigationItems.map(
            (item) => {

              const active =
                activeMenu ===
                item.name;

              return (
                <button
                  key={item.name}
                  onClick={() =>
                    handleNavigation(
                      item.name
                    )
                  }
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    active
                      ? "bg-cyan-400 text-black"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white"
                  }`}
                >

                  <span>
                    {item.icon}
                  </span>

                  <span>
                    {item.name}
                  </span>

                  {item.name ===
                    "Tasks" &&
                    pendingTasks >
                      0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[8px] ${
                          active
                            ? "bg-black/10"
                            : "bg-cyan-400/10 text-cyan-400"
                        }`}
                      >
                        {
                          pendingTasks
                        }
                      </span>
                    )}

                </button>
              );
            }
          )}

        </div>

      </div>

      {/* =========================
          TOASTS
      ========================= */}

      <div className="fixed bottom-6 right-6 z-[100] flex w-[calc(100%-3rem)] max-w-sm flex-col gap-3">

        {toasts.map((toast) => {

          const typeClass =
            toast.type === "success"
              ? "border-green-400/20 bg-green-400/10"
              : toast.type === "error"
              ? "border-red-400/20 bg-red-400/10"
              : "border-cyan-400/20 bg-cyan-400/10";

          const iconClass =
            toast.type === "success"
              ? "bg-green-400/20 text-green-400"
              : toast.type === "error"
              ? "bg-red-400/20 text-red-400"
              : "bg-cyan-400/20 text-cyan-400";

          const icon =
            toast.type === "success"
              ? "✓"
              : toast.type === "error"
              ? "!"
              : "i";

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${typeClass}`}
            >

              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${iconClass}`}
              >
                {icon}
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-sm font-semibold text-white">
                  {toast.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-400">
                  {toast.message}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setToasts((current) =>
                    current.filter(
                      (item) =>
                        item.id !==
                        toast.id
                    )
                  )
                }
                className="text-gray-500 transition hover:text-white"
              >
                ✕
              </button>

            </div>
          );
        })}

      </div>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="lg:pl-72">

        <main className="min-h-screen p-4 sm:p-6 lg:p-8">

          {/* =========================
              DASHBOARD
          ========================= */}

          {activeMenu ===
            "Dashboard" && (

            <div className="mx-auto max-w-7xl">

              {/* HEADER */}

              <div className="mb-8">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <p className="mb-2 text-sm font-medium text-cyan-400">
                      Welcome back
                    </p>

                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                      Dashboard
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                      Organize your work,
                      goals and ideas.
                    </p>

                  </div>

                  {/* SEARCH */}

                  <div className="relative w-full max-w-md">

                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-cyan-400/30">

                      <span className="text-gray-500">
                        ⌕
                      </span>

                      <input
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(
                            event.target.value
                          )
                        }
                        placeholder="Search everything..."
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                      />

                      {searchQuery && (
                        <button
                          onClick={() =>
                            setSearchQuery("")
                          }
                          className="text-gray-500 hover:text-white"
                        >
                          ✕
                        </button>
                      )}

                    </div>

                    {searchQuery &&
                      searchResults.length >
                        0 && (

                        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#101624] shadow-2xl">

                          {searchResults.map(
                            (result) => (

                              <button
                                key={`${result.type}-${result.id}`}
                                onClick={() =>
                                  openSearchResult(
                                    result
                                  )
                                }
                                className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/5"
                              >

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                                  {result.type ===
                                    "Task" &&
                                    "✓"}

                                  {result.type ===
                                    "Project" &&
                                    "▣"}

                                  {result.type ===
                                    "Note" &&
                                    "✎"}

                                  {result.type ===
                                    "Goal" &&
                                    "◎"}
                                </div>

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-medium text-white">
                                    {
                                      result.title
                                    }
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {
                                      result.subtitle
                                    }
                                  </p>

                                </div>

                              </button>

                            )
                          )}

                        </div>
                      )}

                    {searchQuery &&
                      searchResults.length ===
                        0 && (

                        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-[#101624] p-5 text-center shadow-2xl">

                          <p className="text-sm text-gray-400">
                            No results found
                          </p>

                        </div>
                      )}

                  </div>

                </div>

              </div>

              {/* STATS */}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <StatCard
                  title="Total Tasks"
                  value={totalTasks}
                  subtitle={`${completedTasks} completed`}
                  icon="✓"
                />

                <StatCard
                  title="Pending Tasks"
                  value={pendingTasks}
                  subtitle={`${highPriorityTasks} high priority`}
                  icon="◷"
                />

                <StatCard
                  title="Projects"
                  value={projects.length}
                  subtitle={`${activeProjects} active`}
                  icon="▣"
                />

                <StatCard
                  title="Goals"
                  value={goals.length}
                  subtitle={`${activeGoals} active`}
                  icon="◎"
                />

              </div>

              {/* QUICK ADD */}

              <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">

                <div className="mb-4">

                  <h2 className="text-lg font-bold">
                    Quick Add Task
                  </h2>

                  <p className="text-xs text-gray-500">
                    Add a task without leaving
                    the dashboard.
                  </p>

                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <input
                    value={newTask}
                    onChange={(event) =>
                      setNewTask(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        handleCreateTask();
                      }
                    }}
                    placeholder="What do you need to do?"
                    className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400/50"
                  />

                  <button
                    onClick={
                      handleCreateTask
                    }
                    className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
                  >
                    Add Task
                  </button>

                </div>

              </section>

              {/* MAIN GRID */}

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">

                {/* TASKS */}

                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">

                  <div className="flex flex-col gap-4">

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <h2 className="text-lg font-bold">
                          Today&apos;s Tasks
                        </h2>

                        <p className="text-xs text-gray-500">
                          Showing{" "}
                          {
                            filteredAndSortedTasks.length
                          }{" "}
                          of {tasks.length} tasks
                        </p>

                      </div>

                      <button
                        onClick={() =>
                          setActiveMenu(
                            "Tasks"
                          )
                        }
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                      >
                        View all →
                      </button>

                    </div>

                    {/* FILTERS */}

                    <div className="flex gap-2 overflow-x-auto pb-1">

                      {(
                        [
                          "All",
                          "Pending",
                          "Completed",
                          "High",
                          "Medium",
                          "Low",
                        ] as TaskFilter[]
                      ).map(
                        (filter) => (

                          <button
                            key={filter}
                            onClick={() =>
                              setTaskFilter(
                                filter
                              )
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition ${
                              taskFilter ===
                              filter
                                ? "bg-cyan-400 text-black"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {filter}
                          </button>

                        )
                      )}

                    </div>

                    {/* SORT */}

                    <div className="flex items-center justify-between">

                      <span className="text-xs text-gray-500">
                        Sort by
                      </span>

                      <select
                        value={taskSort}
                        onChange={(event) =>
                          setTaskSort(
                            event.target
                              .value as TaskSort
                          )
                        }
                        className="rounded-xl border border-white/10 bg-[#101624] px-3 py-2 text-xs text-gray-300 outline-none"
                      >

                        <option value="Newest">
                          Newest
                        </option>

                        <option value="Oldest">
                          Oldest
                        </option>

                        <option value="Priority">
                          Priority
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                      </select>

                    </div>

                  </div>

                  {/* TASK LOADING */}

                  {tasksLoading ? (

                    <div className="mt-5 space-y-3">

                      {Array.from({
                        length: 5,
                      }).map((_, index) => (
                        <TaskSkeleton
                          key={index}
                        />
                      ))}

                    </div>

                  ) : filteredAndSortedTasks.length ===
                    0 ? (

                    <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center">

                      <div className="text-2xl">
                        ✓
                      </div>

                      <p className="mt-3 text-sm font-medium text-gray-300">
                        No tasks found
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        Try changing the
                        filter.
                      </p>

                    </div>

                  ) : (

                    <div className="mt-5 space-y-3">

                      {filteredAndSortedTasks
                        .slice(0, 10)
                        .map(
                          (task) => (

                            <div
                              key={task.id}
                              className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/10 hover:bg-white/[0.04]"
                            >

                              <button
                                onClick={() =>
                                  toggleTask(
                                    task
                                  )
                                }
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs transition ${
                                  task.completed
                                    ? "border-green-400 bg-green-400 text-black"
                                    : "border-gray-600 hover:border-cyan-400"
                                }`}
                              >
                                {task.completed
                                  ? "✓"
                                  : ""}
                              </button>

                              <div className="min-w-0 flex-1">

                                <p
                                  className={`truncate text-sm font-medium ${
                                    task.completed
                                      ? "text-gray-600 line-through"
                                      : "text-gray-200"
                                  }`}
                                >
                                  {
                                    task.title
                                  }
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-2">

                                  <span className="text-[10px] text-gray-600">
                                    {
                                      task.category
                                    }
                                  </span>

                                  <span className="text-[10px] text-gray-700">
                                    •
                                  </span>

                                  <span className="text-[10px] text-gray-600">
                                    {getProjectName(
                                      task.project_id
                                    )}
                                  </span>

                                </div>

                              </div>

                              <span
                                className={`hidden rounded-lg px-2 py-1 text-[10px] font-semibold sm:block ${
                                  task.priority ===
                                  "High"
                                    ? "bg-red-400/10 text-red-400"
                                    : task.priority ===
                                      "Medium"
                                    ? "bg-yellow-400/10 text-yellow-400"
                                    : "bg-green-400/10 text-green-400"
                                }`}
                              >
                                {
                                  task.priority
                                }
                              </span>

                              <button
                                onClick={() =>
                                  deleteTask(
                                    task
                                  )
                                }
                                className="text-xs text-gray-700 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                              >
                                ✕
                              </button>

                            </div>

                          )
                        )}

                    </div>
                  )}

                </section>

                {/* RIGHT COLUMN */}

                <div className="space-y-6">

                  {/* POMODORO */}

                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                          Focus Timer
                        </p>

                        <h2 className="mt-1 text-lg font-bold">
                          Pomodoro
                        </h2>

                      </div>

                      <span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-400">
                        25 min
                      </span>

                    </div>

                    <div className="py-8 text-center">

                      <div className="text-5xl font-black tracking-wider">
                        {formatPomodoro(
                          pomodoroSeconds
                        )}
                      </div>

                    </div>

                    <div className="flex gap-3">

                      <button
                        onClick={() =>
                          setPomodoroRunning(
                            (current) =>
                              !current
                          )
                        }
                        className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-black"
                      >
                        {pomodoroRunning
                          ? "Pause"
                          : "Start"}
                      </button>

                      <button
                        onClick={() => {
                          setPomodoroRunning(
                            false
                          );
                          setPomodoroSeconds(
                            25 * 60
                          );
                        }}
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
                      >
                        Reset
                      </button>

                    </div>

                  </section>

                  {/* QUICK ACTIONS */}

                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">

                    <h2 className="text-lg font-bold">
                      Quick Actions
                    </h2>

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <QuickAction
                        icon="✓"
                        title="Tasks"
                        subtitle="Manage tasks"
                        onClick={() =>
                          setActiveMenu(
                            "Tasks"
                          )
                        }
                      />

                      <QuickAction
                        icon="▣"
                        title="Projects"
                        subtitle="Manage projects"
                        onClick={() =>
                          setActiveMenu(
                            "Projects"
                          )
                        }
                      />

                      <QuickAction
                        icon="✎"
                        title="Notes"
                        subtitle="Capture ideas"
                        onClick={() =>
                          setActiveMenu(
                            "Notes"
                          )
                        }
                      />

                      <QuickAction
                        icon="◎"
                        title="Goals"
                        subtitle="Track goals"
                        onClick={() =>
                          setActiveMenu(
                            "Goals"
                          )
                        }
                      />

                    </div>

                  </section>

                </div>

              </div>

              {/* PROJECTS */}

              <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-lg font-bold">
                      Recent Projects
                    </h2>

                    <p className="text-xs text-gray-500">
                      Project progress overview
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setActiveMenu(
                        "Projects"
                      )
                    }
                    className="text-xs font-semibold text-cyan-400"
                  >
                    View all →
                  </button>

                </div>

                {projectsLoading ? (

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {Array.from({
                      length: 3,
                    }).map((_, index) => (
                      <ProjectSkeleton
                        key={index}
                      />
                    ))}

                  </div>

                ) : projects.length ===
                  0 ? (

                  <EmptyState text="No projects yet." />

                ) : (

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {projects
                      .slice(0, 6)
                      .map(
                        (project) => {

                          const progress =
                            getProjectProgress(
                              project.id
                            );

                          return (
                            <div
                              key={
                                project.id
                              }
                              className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                            >

                              <div className="flex items-start justify-between gap-3">

                                <div className="min-w-0">

                                  <h3 className="truncate text-sm font-semibold">
                                    {
                                      project.name
                                    }
                                  </h3>

                                  <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                    {
                                      project.description
                                    }
                                  </p>

                                </div>

                                <span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-400">
                                  {
                                    progress.progress
                                  }
                                  %
                                </span>

                              </div>

                              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">

                                <div
                                  className="h-full rounded-full bg-cyan-400 transition-all"
                                  style={{
                                    width: `${progress.progress}%`,
                                  }}
                                />

                              </div>

                              <p className="mt-2 text-[10px] text-gray-600">
                                {
                                  progress.completed_tasks
                                }{" "}
                                of{" "}
                                {
                                  progress.total_tasks
                                }{" "}
                                tasks completed
                              </p>

                            </div>
                          );
                        }
                      )}

                  </div>
                )}

              </section>

              {/* GOALS */}

              <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-lg font-bold">
                      Recent Goals
                    </h2>

                    <p className="text-xs text-gray-500">
                      Track your progress
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setActiveMenu(
                        "Goals"
                      )
                    }
                    className="text-xs font-semibold text-cyan-400"
                  >
                    View all →
                  </button>

                </div>

                {goalsLoading ? (

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {Array.from({
                      length: 3,
                    }).map((_, index) => (
                      <GoalSkeleton
                        key={index}
                      />
                    ))}

                  </div>

                ) : goals.length === 0 ? (

                  <EmptyState text="No goals yet." />

                ) : (

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {goals
                      .slice(0, 6)
                      .map((goal) => (

                        <div
                          key={goal.id}
                          className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <h3 className="truncate text-sm font-semibold">
                                {
                                  goal.title
                                }
                              </h3>

                              <p className="mt-1 text-xs text-gray-600">
                                {
                                  goal.category
                                }
                              </p>

                            </div>

                            <span className="text-xs font-bold text-cyan-400">
                              {
                                goal.progress
                              }
                              %
                            </span>

                          </div>

                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">

                            <div
                              className="h-full rounded-full bg-cyan-400"
                              style={{
                                width: `${goal.progress}%`,
                              }}
                            />

                          </div>

                          <div className="mt-3 flex items-center justify-between">

                            <span className="text-[10px] text-gray-600">
                              {goal.status}
                            </span>

                            {goal.target_date && (
                              <span className="text-[10px] text-gray-600">
                                Target:{" "}
                                {
                                  goal.target_date
                                }
                              </span>
                            )}

                          </div>

                        </div>

                      ))}

                  </div>
                )}

              </section>

              {/* NOTES */}

              <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-lg font-bold">
                      Recent Notes
                    </h2>

                    <p className="text-xs text-gray-500">
                      Your latest ideas and notes
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setActiveMenu(
                        "Notes"
                      )
                    }
                    className="text-xs font-semibold text-cyan-400"
                  >
                    View all →
                  </button>

                </div>

                {notesLoading ? (

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {Array.from({
                      length: 3,
                    }).map((_, index) => (
                      <NoteSkeleton
                        key={index}
                      />
                    ))}

                  </div>

                ) : notes.length === 0 ? (

                  <EmptyState text="No notes yet." />

                ) : (

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {notes
                      .slice(0, 6)
                      .map((note) => (

                        <div
                          key={note.id}
                          className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                        >

                          <h3 className="truncate text-sm font-semibold">
                            {note.title}
                          </h3>

                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-500">
                            {note.content}
                          </p>

                          <div className="mt-4 flex items-center justify-between">

                            <span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-400">
                              {getProjectName(
                                note.project_id
                              )}
                            </span>

                            <span className="text-[10px] text-gray-700">
                              Note
                            </span>

                          </div>

                        </div>

                      ))}

                  </div>
                )}

              </section>

            </div>
          )}

          {/* OTHER PAGES */}

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

        </main>

      </div>

    </div>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/20 hover:bg-white/[0.04]">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-gray-600">
            {subtitle}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================
   QUICK ACTION
========================= */

function QuickAction({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-white/5 p-4 text-left transition hover:bg-white/10"
    >

      <div className="text-cyan-400">
        {icon}
      </div>

      <p className="mt-2 text-sm font-semibold">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-gray-600">
        {subtitle}
      </p>

    </button>
  );
}

/* =========================
   SKELETON BASE
========================= */

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/10 ${className}`}
    />
  );
}

/* =========================
   TASK SKELETON
========================= */

function TaskSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">

      <SkeletonBlock className="h-6 w-6 shrink-0 rounded-lg" />

      <div className="flex-1 space-y-2">

        <SkeletonBlock className="h-3 w-3/5" />

        <SkeletonBlock className="h-2.5 w-2/5" />

      </div>

      <SkeletonBlock className="hidden h-6 w-14 sm:block" />

    </div>
  );
}

/* =========================
   PROJECT SKELETON
========================= */

function ProjectSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">

      <div className="flex items-start justify-between gap-3">

        <div className="flex-1 space-y-2">

          <SkeletonBlock className="h-4 w-3/5" />

          <SkeletonBlock className="h-3 w-4/5" />

          <SkeletonBlock className="h-3 w-2/5" />

        </div>

        <SkeletonBlock className="h-6 w-12" />

      </div>

      <SkeletonBlock className="mt-5 h-2 w-full" />

      <SkeletonBlock className="mt-3 h-2.5 w-2/5" />

    </div>
  );
}

/* =========================
   GOAL SKELETON
========================= */

function GoalSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">

      <div className="flex items-start justify-between gap-3">

        <div className="flex-1 space-y-2">

          <SkeletonBlock className="h-4 w-3/5" />

          <SkeletonBlock className="h-3 w-2/5" />

        </div>

        <SkeletonBlock className="h-4 w-10" />

      </div>

      <SkeletonBlock className="mt-5 h-2 w-full" />

      <div className="mt-3 flex justify-between">

        <SkeletonBlock className="h-2.5 w-1/4" />

        <SkeletonBlock className="h-2.5 w-1/3" />

      </div>

    </div>
  );
}

/* =========================
   NOTE SKELETON
========================= */

function NoteSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">

      <SkeletonBlock className="h-4 w-3/5" />

      <div className="mt-3 space-y-2">

        <SkeletonBlock className="h-2.5 w-full" />

        <SkeletonBlock className="h-2.5 w-5/6" />

        <SkeletonBlock className="h-2.5 w-4/6" />

      </div>

      <div className="mt-5 flex justify-between">

        <SkeletonBlock className="h-5 w-20" />

        <SkeletonBlock className="h-2.5 w-10" />

      </div>

    </div>
  );
}

/* =========================
   EMPTY STATE
========================= */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center">

      <p className="text-sm text-gray-500">
        {text}
      </p>

    </div>
  );
}