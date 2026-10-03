"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  project_id: number | null;
};

type Project = {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Completed" | "Paused";
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState("Personal");

  const [priority, setPriority] =
    useState<"High" | "Medium" | "Low">(
      "Medium"
    );

  const [projectId, setProjectId] =
    useState<number | null>(null);

  // ==================================================
  // LOAD TASKS
  // ==================================================

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/tasks`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load tasks."
        );
      }

      const data = await response.json();

      setTasks(data);
    } catch (error) {
      console.error("Tasks error:", error);

      setError(
        "We couldn't load your tasks. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD PROJECTS
  // ==================================================

  const loadProjects = async () => {
    try {
      setProjectsLoading(true);

      const response = await fetch(
        `${API_URL}/api/projects`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load projects."
        );
      }

      const data = await response.json();

      setProjects(data);
    } catch (error) {
      console.error(
        "Projects error:",
        error
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  // ==================================================
  // CREATE TASK
  // ==================================================

  const addTask = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError(
        "Please enter a task title."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            category,
            priority,
            completed: false,
            project_id: projectId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create task."
        );
      }

      const createdTask =
        await response.json();

      setTasks((currentTasks) => [
        ...currentTasks,
        createdTask,
      ]);

      setTitle("");
      setCategory("Personal");
      setPriority("Medium");
      setProjectId(null);

      setSuccess(
        "Task created successfully."
      );
    } catch (error) {
      console.error(
        "Create task error:",
        error
      );

      setError(
        "Unable to create the task. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // TOGGLE TASK
  // ==================================================

  const toggleTask = async (
    task: Task
  ) => {
    const updatedCompleted =
      !task.completed;

    // Optimistic UI update
    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed:
                updatedCompleted,
            }
          : item
      )
    );

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/tasks/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            completed:
              updatedCompleted,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update task."
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

      setSuccess(
        updatedCompleted
          ? "Task completed."
          : "Task marked as pending."
      );
    } catch (error) {
      console.error(
        "Toggle task error:",
        error
      );

      // Restore previous state
      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === task.id
            ? task
            : item
        )
      );

      setError(
        "Unable to update the task."
      );
    }
  };

  // ==================================================
  // DELETE TASK
  // ==================================================

  const deleteTask = async (
    task: Task
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${task.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/tasks/${task.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete task."
        );
      }

      setTasks((currentTasks) =>
        currentTasks.filter(
          (item) =>
            item.id !== task.id
        )
      );

      setSuccess(
        "Task deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete task error:",
        error
      );

      setError(
        "Unable to delete the task."
      );
    }
  };

  // ==================================================
  // HELPERS
  // ==================================================

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

  const getPriorityClasses = (
    taskPriority: Task["priority"]
  ) => {
    if (taskPriority === "High") {
      return "bg-red-400/10 text-red-400 border-red-400/20";
    }

    if (taskPriority === "Medium") {
      return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20";
    }

    return "bg-green-400/10 text-green-400 border-green-400/20";
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <section className="space-y-6">
      {/* Header */}

      <div>
        <h2 className="text-xl font-semibold text-white">
          Task Manager
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Create, organize, and track your
          tasks.
        </p>
      </div>

      {/* Messages */}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-400/20 bg-green-400/5 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* Create Task */}

      <div className="rounded-2xl border border-white/10 bg-[#0d1218] p-5">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-200">
            Add New Task
          </h3>

          <p className="mt-1 text-xs text-gray-600">
            Create a task and optionally
            assign it to a project.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Title */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Task Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  addTask();
                }
              }}
              placeholder="e.g. Complete JavaScript practice"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-cyan-400/40 focus:bg-white/[0.05]"
            />
          </div>

          {/* Category */}

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Category
            </label>

            <input
              type="text"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              placeholder="Personal"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-cyan-400/40 focus:bg-white/[0.05]"
            />
          </div>

          {/* Priority */}

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Priority
            </label>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value as Task["priority"]
                )
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
            >
              <option
                value="High"
                className="bg-[#0d1218]"
              >
                High
              </option>

              <option
                value="Medium"
                className="bg-[#0d1218]"
              >
                Medium
              </option>

              <option
                value="Low"
                className="bg-[#0d1218]"
              >
                Low
              </option>
            </select>
          </div>

          {/* Project */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Project
            </label>

            <select
              value={
                projectId === null
                  ? ""
                  : projectId
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                setProjectId(
                  value === ""
                    ? null
                    : Number(value)
                );
              }}
              disabled={projectsLoading}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option
                value=""
                className="bg-[#0d1218]"
              >
                Personal / No Project
              </option>

              {projects.map(
                (project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    className="bg-[#0d1218]"
                  >
                    {project.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Add Button */}

        <button
          type="button"
          onClick={addTask}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Creating..."
            : "Add Task"}
        </button>
      </div>

      {/* Task List */}

      <div className="rounded-2xl border border-white/10 bg-[#0d1218] p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              Your Tasks
            </h3>

            <p className="mt-1 text-xs text-gray-600">
              {tasks.length}{" "}
              {tasks.length === 1
                ? "task"
                : "tasks"}
            </p>
          </div>

          <button
            type="button"
            onClick={loadTasks}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {/* Loading */}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
                />
              )
            )}
          </div>
        )}

        {/* Empty */}

        {!loading &&
          tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-gray-500">
                +
              </div>

              <h4 className="mt-4 text-sm font-medium text-gray-300">
                No tasks yet
              </h4>

              <p className="mt-1 text-xs text-gray-600">
                Create your first task
                above to get started.
              </p>
            </div>
          )}

        {/* Task Items */}

        {!loading &&
          tasks.length > 0 && (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group rounded-xl border p-4 transition ${
                    task.completed
                      ? "border-white/5 bg-white/[0.015]"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleTask(task)
                      }
                      aria-label={
                        task.completed
                          ? "Mark task as pending"
                          : "Complete task"
                      }
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${
                        task.completed
                          ? "border-cyan-400 bg-cyan-400 text-black"
                          : "border-white/20 bg-white/[0.02] hover:border-cyan-400/50"
                      }`}
                    >
                      {task.completed
                        ? "✓"
                        : ""}
                    </button>

                    {/* Content */}

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-medium ${
                          task.completed
                            ? "text-gray-600 line-through"
                            : "text-gray-200"
                        }`}
                      >
                        {task.title}
                      </h4>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {/* Category */}

                        <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-gray-500">
                          {task.category}
                        </span>

                        {/* Priority */}

                        <span
                          className={`rounded-md border px-2 py-1 text-[10px] ${getPriorityClasses(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        {/* Project */}

                        <span className="rounded-md bg-cyan-400/5 px-2 py-1 text-[10px] text-cyan-400/70">
                          {getProjectName(
                            task.project_id
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}

                    <button
                      type="button"
                      onClick={() =>
                        deleteTask(task)
                      }
                      aria-label="Delete task"
                      className="rounded-lg px-2 py-1.5 text-xs text-gray-700 opacity-100 transition hover:bg-red-400/10 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </section>
  );
}
