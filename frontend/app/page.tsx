"use client";

import { useEffect, useState } from "react";
import TaskManager from "./TaskManager";
import ProjectsManager from "./ProjectsManager";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
};

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<
    "Dashboard" | "Tasks" | "Projects"
  >("Dashboard");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [backendOnline, setBackendOnline] = useState(false);

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
    checkBackend();
  }, []);

  // ==================================================
  // REFRESH TASKS WHEN DASHBOARD OPENS
  // ==================================================

  useEffect(() => {
    if (activeMenu === "Dashboard") {
      loadTasks();
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
        throw new Error("Failed to create task");
      }

      const createdTask = await response.json();

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
    const updatedCompleted = !task.completed;

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
      loadTasks();
    }
  };

  // ==================================================
  // POMODORO
  // ==================================================

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

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

  const minutes = Math.floor(timeLeft / 60)
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
  // STATISTICS
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
          (completedTasks / tasks.length) * 100
        );

  // ==================================================
  // SIDEBAR
  // ==================================================

  const menuItems: Array<
    "Dashboard" | "Tasks" | "Projects"
  > = [
    "Dashboard",
    "Tasks",
    "Projects",
  ];

  // ==================================================
  // DASHBOARD
  // ==================================================

  const renderDashboard = () => {
    return (
      <main className="min-h-screen bg-[#0b0f14] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">

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

          {/* STATS */}

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

          {/* MAIN DASHBOARD GRID */}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* TASKS */}

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

                  {tasks.slice(0, 5).map((task) => {

                    const priorityClass =
                      task.priority === "High"
                        ? "bg-red-400/10 text-red-400"
                        : task.priority === "Medium"
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
                          onClick={() =>
                            toggleTask(task)
                          }
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                            task.completed
                              ? "border-cyan-400 bg-cyan-400 text-black"
                              : "border-gray-600 hover:border-cyan-400"
                          }`}
                        >
                          {task.completed && "✓"}
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
                    setNewTask(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
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

            {/* POMODORO */}

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
                      (current) => !current
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

          {/* QUICK ACTIONS */}

          <section className="mt-10">

            <h2 className="text-2xl font-bold">
              Quick Actions
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">

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
                  setActiveMenu("Projects")
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
                onClick={() => setTimerRunning(true)}
                className="rounded-2xl border border-white/10 bg-[#101827] p-6 text-left transition hover:border-cyan-400/30"
              >
                <p className="font-bold">
                  Start Focus
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Start a 25-minute focus session.
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

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-68 border-r border-white/10 bg-[#0d131c] lg:block">

        <div className="p-6">

          <h1 className="text-2xl font-bold">
            Focus<span className="text-cyan-400">
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

      {/* CONTENT */}

      <div className="lg:pl-68">

        {activeMenu === "Dashboard" && (
          renderDashboard()
        )}

        {activeMenu === "Tasks" && (
          <TaskManager />
        )}

        {activeMenu === "Projects" && (
          <ProjectsManager />
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