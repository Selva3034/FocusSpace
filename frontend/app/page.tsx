"use client";

import { useEffect, useState } from "react";
import TaskManager from "./TaskManager";

const API_URL = "http://127.0.0.1:8000";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
};

export default function Home() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState("");

  const [newTask, setNewTask] = useState("");

  const [backendStatus, setBackendStatus] = useState(
    "Checking..."
  );

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // ==================================================
  // LOAD TASKS FROM BACKEND
  // ==================================================

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      setTaskError("");

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
      setTaskError("Unable to connect to task server");
    } finally {
      setLoadingTasks(false);
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

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      setBackendStatus("Online");
    } catch (error) {
      console.error(error);
      setBackendStatus("Offline");
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
  // RELOAD TASKS WHEN RETURNING TO DASHBOARD
  // ==================================================

  useEffect(() => {
    if (activeMenu === "Dashboard") {
      loadTasks();
    }
  }, [activeMenu]);

  // ==================================================
  // POMODORO TIMER
  // ==================================================

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 25 * 60;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  // ==================================================
  // FORMAT TIMER
  // ==================================================

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (secondsLeft % 60)
    .toString()
    .padStart(2, "0");

  // ==================================================
  // ADD TASK
  // ==================================================

  const addTask = async () => {
    if (!newTask.trim()) {
      return;
    }

    try {
      setTaskError("");

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
      setTaskError("Unable to create task");
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

      await loadTasks();

      setTaskError("Unable to update task");
    }
  };

  // ==================================================
  // STATISTICS
  // ==================================================

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = tasks.length - completedTasks;

  const completionPercentage =
    tasks.length > 0
      ? Math.round(
          (completedTasks / tasks.length) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">
      <div className="flex min-h-screen">

        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0d131c] p-6 lg:block">

          <div className="mb-10">
            <h1 className="text-2xl font-bold">
              Focus<span className="text-cyan-400">Space</span>
            </h1>

            <p className="mt-2 text-xs text-gray-500">
              Digital Workspace
            </p>
          </div>

          <nav className="space-y-2">

            <button
              onClick={() =>
                setActiveMenu("Dashboard")
              }
              className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                activeMenu === "Dashboard"
                  ? "bg-cyan-400 text-black"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                setActiveMenu("Tasks")
              }
              className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                activeMenu === "Tasks"
                  ? "bg-cyan-400 text-black"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Tasks
            </button>

          </nav>

          <div className="mt-10 border-t border-white/10 pt-6">

            <p className="mb-3 text-xs uppercase tracking-wider text-gray-600">
              System
            </p>

            <div className="flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === "Online"
                    ? "bg-green-400"
                    : backendStatus === "Offline"
                    ? "bg-red-400"
                    : "bg-yellow-400"
                }`}
              />

              <span className="text-gray-500">
                Backend {backendStatus}
              </span>
            </div>

          </div>

        </aside>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <div className="flex-1">

          {/* ==================================================
              MOBILE HEADER
          ================================================== */}

          <header className="border-b border-white/10 bg-[#0d131c] px-6 py-5 lg:hidden">

            <div className="flex items-center justify-between">

              <h1 className="text-xl font-bold">
                Focus<span className="text-cyan-400">
                  Space
                </span>
              </h1>

              <span className="text-xs text-gray-500">
                {backendStatus}
              </span>

            </div>

            <div className="mt-4 flex gap-2">

              <button
                onClick={() =>
                  setActiveMenu("Dashboard")
                }
                className={`rounded-lg px-3 py-2 text-xs ${
                  activeMenu === "Dashboard"
                    ? "bg-cyan-400 text-black"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() =>
                  setActiveMenu("Tasks")
                }
                className={`rounded-lg px-3 py-2 text-xs ${
                  activeMenu === "Tasks"
                    ? "bg-cyan-400 text-black"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                Tasks
              </button>

            </div>

          </header>

          {/* ==================================================
              TASK PAGE
          ================================================== */}

          {activeMenu === "Tasks" ? (
            <TaskManager />
          ) : (

            /* ==================================================
               DASHBOARD
            ================================================== */

            <div className="mx-auto max-w-7xl px-6 py-10">

              {/* HEADER */}

              <div className="mb-10">

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

              {/* ERROR */}

              {taskError && (
                <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
                  {taskError}
                </div>
              )}

              {/* ==================================================
                  STAT CARDS
              ================================================== */}

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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

              </section>

              {/* ==================================================
                  MAIN GRID
              ================================================== */}

              <div className="mt-8 grid gap-8 lg:grid-cols-3">

                {/* ==================================================
                    TASKS
                ================================================== */}

                <section className="lg:col-span-2">

                  <div className="mb-4 flex items-center justify-between">

                    <div>
                      <h2 className="text-xl font-bold">
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
                      className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      View all
                    </button>

                  </div>

                  <div className="space-y-3">

                    {loadingTasks ? (
                      <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-500">
                        Loading tasks...
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center">

                        <p className="text-gray-400">
                          No tasks yet.
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                          Add your first task below.
                        </p>

                      </div>
                    ) : (
                      tasks.slice(0, 5).map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={toggleTask}
                        />
                      ))
                    )}

                  </div>

                  {/* ADD TASK */}

                  <div className="mt-5 flex gap-3">

                    <input
                      type="text"
                      value={newTask}
                      onChange={(event) =>
                        setNewTask(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          addTask();
                        }
                      }}
                      placeholder="Add a quick task..."
                      className="flex-1 rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
                    />

                    <button
                      onClick={addTask}
                      className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
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

                  <h2 className="mt-2 text-xl font-bold">
                    Pomodoro Timer
                  </h2>

                  <div className="mt-8 text-center">

                    <div className="text-6xl font-bold tracking-tight text-cyan-400">
                      {minutes}:{seconds}
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                      {timerRunning
                        ? "Stay focused"
                        : "Ready when you are"}
                    </p>

                  </div>

                  <div className="mt-8 flex gap-3">

                    <button
                      onClick={() =>
                        setTimerRunning(
                          !timerRunning
                        )
                      }
                      className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-black hover:bg-cyan-300"
                    >
                      {timerRunning
                        ? "Pause"
                        : "Start"}
                    </button>

                    <button
                      onClick={() => {
                        setTimerRunning(false);
                        setSecondsLeft(25 * 60);
                      }}
                      className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
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

                <h2 className="text-xl font-bold">
                  Quick Actions
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <QuickAction
                    title="Manage Tasks"
                    description="View all tasks"
                    onClick={() =>
                      setActiveMenu("Tasks")
                    }
                  />

                  <QuickAction
                    title="Start Focus"
                    description="Begin a 25 minute session"
                    onClick={() => {
                      setSecondsLeft(25 * 60);
                      setTimerRunning(true);
                    }}
                  />

                  <QuickAction
                    title="Reset Timer"
                    description="Reset your focus session"
                    onClick={() => {
                      setTimerRunning(false);
                      setSecondsLeft(25 * 60);
                    }}
                  />

                  <QuickAction
                    title="Refresh Tasks"
                    description="Sync with database"
                    onClick={loadTasks}
                  />

                </div>

              </section>

              {/* ==================================================
                  WEEKLY FOCUS
              ================================================== */}

              <section className="mt-10 rounded-3xl border border-white/10 bg-[#101827] p-6">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-xl font-bold">
                      Weekly Focus
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Your productivity overview
                    </p>
                  </div>

                  <span className="text-sm text-gray-500">
                    This week
                  </span>

                </div>

                <div className="mt-8 flex h-48 items-end justify-between gap-4">

                  {[40, 65, 50, 80, 60, 90, 45].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex flex-1 flex-col items-center gap-3"
                      >

                        <div className="flex h-40 w-full items-end">

                          <div
                            className="w-full rounded-t-lg bg-cyan-400/60 transition hover:bg-cyan-400"
                            style={{
                              height: `${height}%`,
                            }}
                          />

                        </div>

                        <span className="text-xs text-gray-600">
                          {
                            [
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                              "Sun",
                            ][index]
                          }
                        </span>

                      </div>
                    )
                  )}

                </div>

              </section>

              {/* ==================================================
                  FOOTER
              ================================================== */}

              <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-gray-600">
                FocusSpace Digital Workspace
              </footer>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}


/* ==================================================
   STAT CARD
================================================== */

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
    <div className="rounded-2xl border border-white/10 bg-[#101827] p-5">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-600">
        {description}
      </p>

    </div>
  );
}


/* ==================================================
   TASK ITEM
================================================== */

function TaskItem({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (task: Task) => void;
}) {
  const priorityClass =
    task.priority === "High"
      ? "bg-red-400/10 text-red-400"
      : task.priority === "Medium"
      ? "bg-yellow-400/10 text-yellow-400"
      : "bg-green-400/10 text-green-400";

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-[#101827] p-4 transition hover:border-cyan-400/20 ${
        task.completed ? "opacity-60" : ""
      }`}
    >

      <button
        onClick={() => onToggle(task)}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
          task.completed
            ? "border-cyan-400 bg-cyan-400 text-black"
            : "border-gray-600 hover:border-cyan-400"
        }`}
        aria-label={
          task.completed
            ? "Mark task incomplete"
            : "Mark task complete"
        }
      >
        {task.completed && "✓"}
      </button>

      <div className="min-w-0 flex-1">

        <p
          className={`truncate text-sm font-semibold ${
            task.completed
              ? "text-gray-500 line-through"
              : "text-white"
          }`}
        >
          {task.title}
        </p>

        <p className="mt-1 text-xs text-gray-600">
          {task.category}
        </p>

      </div>

      <span
        className={`hidden rounded-full px-3 py-1 text-xs sm:block ${priorityClass}`}
      >
        {task.priority}
      </span>

    </div>
  );
}


/* ==================================================
   QUICK ACTION
================================================== */

function QuickAction({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-[#101827] p-5 text-left transition hover:border-cyan-400/30 hover:bg-[#121c2b]"
    >

      <h3 className="font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-xs text-gray-500">
        {description}
      </p>

    </button>
  );
}