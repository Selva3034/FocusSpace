"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
};

const API_URL = "http://127.0.0.1:8000";

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState<
    "High" | "Medium" | "Low"
  >("Medium");

  const [error, setError] = useState("");

  // ==================================================
  // LOAD TASKS
  // ==================================================

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/tasks`);

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();

      setTasks(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD TASKS WHEN PAGE OPENS
  // ==================================================

  useEffect(() => {
    loadTasks();
  }, []);

  // ==================================================
  // ADD TASK
  // ==================================================

  const addTask = async () => {
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const newTask = await response.json();

      setTasks((currentTasks) => [
        ...currentTasks,
        newTask,
      ]);

      setTitle("");
      setCategory("Personal");
      setPriority("Medium");
    } catch (error) {
      console.error(error);
      setError("Unable to create task");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // TOGGLE TASK
  // ==================================================

  const toggleTask = async (task: Task) => {
    try {
      setSaving(true);
      setError("");

      const updatedCompleted = !task.completed;

      // Update UI immediately
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
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );
    } catch (error) {
      console.error(error);

      // Reload from database if something failed
      await loadTasks();

      setError("Unable to update task");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // DELETE TASK
  // ==================================================

  const deleteTask = async (id: number) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/tasks/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== id)
      );
    } catch (error) {
      console.error(error);
      setError("Unable to delete task");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // COMPLETED TASKS
  // ==================================================

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HEADER */}

        <div className="mb-8">
          <p className="text-sm text-gray-500">
            Your workload
          </p>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Tasks
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {completedTasks} of {tasks.length} tasks completed
              </p>
            </div>

            {saving && (
              <span className="text-xs text-cyan-400">
                Saving...
              </span>
            )}
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ADD TASK */}

        <section className="rounded-3xl border border-white/10 bg-[#101827] p-6">

          <h2 className="mb-5 text-xl font-bold">
            Add New Task
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            {/* TITLE */}

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addTask();
                }
              }}
              placeholder="Task title"
              className="rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
            />

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none focus:border-cyan-400"
            >
              <option value="Personal">
                Personal
              </option>

              <option value="Learning">
                Learning
              </option>

              <option value="Project">
                Project
              </option>

              <option value="Work">
                Work
              </option>

              <option value="Health">
                Health
              </option>
            </select>

            {/* PRIORITY */}

            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value as
                    | "High"
                    | "Medium"
                    | "Low"
                )
              }
              className="rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none focus:border-cyan-400"
            >
              <option value="High">
                High
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Low">
                Low
              </option>
            </select>
          </div>

          <button
            onClick={addTask}
            disabled={saving}
            className="mt-5 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "+ Add Task"}
          </button>
        </section>

        {/* TASK LIST */}

        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Your Tasks
            </h2>

            <span className="text-sm text-gray-500">
              {tasks.length} total
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-500">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center">
              <p className="text-gray-400">
                No tasks yet.
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Create your first task above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {tasks.map((task) => {

                const priorityClass =
                  task.priority === "High"
                    ? "bg-red-400/10 text-red-400"
                    : task.priority === "Medium"
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "bg-green-400/10 text-green-400";

                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-[#101827] p-5 transition hover:border-cyan-400/20 ${
                      task.completed
                        ? "opacity-70"
                        : ""
                    }`}
                  >

                    {/* CHECK BUTTON */}

                    <button
                      onClick={() => toggleTask(task)}
                      aria-label={
                        task.completed
                          ? "Mark task incomplete"
                          : "Mark task complete"
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        task.completed
                          ? "border-cyan-400 bg-cyan-400 text-black"
                          : "border-gray-600 hover:border-cyan-400"
                      }`}
                    >
                      {task.completed && "✓"}
                    </button>

                    {/* TASK DETAILS */}

                    <div className="min-w-0 flex-1">

                      <h3
                        className={`text-base font-semibold ${
                          task.completed
                            ? "text-gray-500 line-through"
                            : "text-white"
                        }`}
                      >
                        {task.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-400">
                        {task.category}
                      </p>

                    </div>

                    {/* PRIORITY */}

                    <span
                      className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:block ${priorityClass}`}
                    >
                      {task.priority}
                    </span>

                    {/* ID */}

                    <span className="text-xs text-gray-600">
                      #{task.id}
                    </span>

                    {/* DELETE */}

                    <button
                      onClick={() =>
                        deleteTask(task.id)
                      }
                      className="rounded-lg px-3 py-2 text-xs text-gray-500 transition hover:bg-red-400/10 hover:text-red-400"
                    >
                      Delete
                    </button>

                  </div>
                );
              })}

            </div>
          )}
        </section>

      </div>
    </main>
  );
}