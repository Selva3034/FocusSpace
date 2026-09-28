"use client";

import { useEffect, useState } from "react";
import TaskManager from "./TaskManager";
import ProjectsManager from "./ProjectsManager";
import NotesManager from "./NotesManager";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  project_id: number | null;
};

type ActiveMenu =
  | "Dashboard"
  | "Tasks"
  | "Projects"
  | "Notes";

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [activeMenu, setActiveMenu] =
    useState<ActiveMenu>("Dashboard");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // ==================================================
  // LOAD TASKS
  // ==================================================

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);

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
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // ==================================================
  // TIMER
  // ==================================================

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    if (timeLeft <= 0) {
      setTimerRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((currentTime) => currentTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

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
          (completedTasks / tasks.length) * 100
        );

  // ==================================================
  // MENU
  // ==================================================

  const menuItems: ActiveMenu[] = [
    "Dashboard",
    "Tasks",
    "Projects",
    "Notes",
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
              FocusSpace Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Organize your work, manage your projects,
              and stay focused.
            </p>

          </div>

          {/* STAT CARDS */}

          <div className="grid gap-4 md:grid-cols-3">

            {/* TOTAL TASKS */}

            <div className="rounded-2xl border border-white/10 bg-[#101827] p-6">

              <p className="text-sm text-gray-500">
                Total Tasks
              </p>

              <p className="mt-3 text-3xl font-bold">
                {loadingTasks
                  ? "..."
                  : tasks.length}
              </p>

              <p className="mt-2 text-xs text-gray-600">
                Tasks in your workspace
              </p>

            </div>

            {/* COMPLETED */}

            <div className="rounded-2xl border border-white/10 bg-[#101827] p-6">

              <p className="text-sm text-gray-500">
                Completed
              </p>

              <p className="mt-3 text-3xl font-bold text-cyan-400">
                {loadingTasks
                  ? "..."
                  : completedTasks}
              </p>

              <p className="mt-2 text-xs text-gray-600">
                Completed tasks
              </p>

            </div>

            {/* PENDING */}

            <div className="rounded-2xl border border-white/10 bg-[#101827] p-6">

              <p className="text-sm text-gray-500">
                Pending
              </p>

              <p className="mt-3 text-3xl font-bold">
                {loadingTasks
                  ? "..."
                  : pendingTasks}
              </p>

              <p className="mt-2 text-xs text-gray-600">
                Tasks remaining
              </p>

            </div>

          </div>

          {/* MAIN GRID */}

          <div className="mt-8 grid gap-6 lg:grid-cols-3">

            {/* PROGRESS */}

            <section className="rounded-3xl border border-white/10 bg-[#101827] p-6 lg:col-span-2">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Task completion
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Your Progress
                  </h2>

                </div>

                <span className="text-2xl font-bold text-cyan-400">
                  {completionPercentage}%
                </span>

              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">

                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                  style={{
                    width: `${completionPercentage}%`,
                  }}
                />

              </div>

              <p className="mt-3 text-sm text-gray-500">
                {completedTasks} of{" "}
                {tasks.length} tasks completed
              </p>

            </section>

            {/* FOCUS TIMER */}

            <section className="rounded-3xl border border-white/10 bg-[#101827] p-6">

              <p className="text-sm text-gray-500">
                Focus session
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Pomodoro
              </h2>

              <div className="mt-6 text-center">

                <div className="text-5xl font-bold tracking-wider text-cyan-400">
                  {formatTime(timeLeft)}
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  25 minute focus session
                </p>

              </div>

              <div className="mt-6 flex justify-center gap-3">

                <button
                  onClick={() =>
                    setTimerRunning(
                      (current) => !current
                    )
                  }
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
                >
                  {timerRunning
                    ? "Pause"
                    : "Start"}
                </button>

                <button
                  onClick={resetTimer}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                  Reset
                </button>

              </div>

            </section>

          </div>

          {/* RECENT TASKS */}

          <section className="mt-8 rounded-3xl border border-white/10 bg-[#101827] p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Your workload
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Recent Tasks
                </h2>

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

            <div className="mt-6">

              {loadingTasks ? (

                <p className="text-sm text-gray-500">
                  Loading tasks...
                </p>

              ) : tasks.length === 0 ? (

                <div className="rounded-xl border border-white/10 p-6 text-center">

                  <p className="text-gray-400">
                    No tasks yet.
                  </p>

                  <button
                    onClick={() =>
                      setActiveMenu("Tasks")
                    }
                    className="mt-3 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    Create your first task
                  </button>

                </div>

              ) : (

                <div className="space-y-3">

                  {tasks
                    .slice(-5)
                    .reverse()
                    .map((task) => (

                      <div
                        key={task.id}
                        className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0b0f14] p-4"
                      >

                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                            task.completed
                              ? "border-cyan-400 bg-cyan-400 text-black"
                              : "border-gray-600"
                          }`}
                        >
                          {task.completed && "✓"}
                        </div>

                        <div className="min-w-0 flex-1">

                          <p
                            className={`text-sm font-semibold ${
                              task.completed
                                ? "text-gray-500 line-through"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {task.category}
                          </p>

                        </div>

                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400">
                          {task.priority}
                        </span>

                      </div>

                    ))}

                </div>

              )}

            </div>

          </section>

          {/* QUICK ACTIONS */}

          <section className="mt-8">

            <h2 className="text-xl font-bold">
              Quick Actions
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">

              <button
                onClick={() =>
                  setActiveMenu("Tasks")
                }
                className="rounded-2xl border border-white/10 bg-[#101827] p-6 text-left transition hover:border-cyan-400/30 hover:bg-[#111d2d]"
              >

                <p className="font-bold">
                  Add Task
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Create and manage your tasks.
                </p>

              </button>

              <button
                onClick={() =>
                  setActiveMenu("Projects")
                }
                className="rounded-2xl border border-white/10 bg-[#101827] p-6 text-left transition hover:border-cyan-400/30 hover:bg-[#111d2d]"
              >

                <p className="font-bold">
                  Manage Projects
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Organize your work into projects.
                </p>

              </button>

              <button
                onClick={() =>
                  setActiveMenu("Notes")
                }
                className="rounded-2xl border border-white/10 bg-[#101827] p-6 text-left transition hover:border-cyan-400/30 hover:bg-[#111d2d]"
              >

                <p className="font-bold">
                  Create Note
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Capture ideas and important information.
                </p>

              </button>

            </div>

          </section>

        </div>
      </main>
    );
  };

  // ==================================================
  // MAIN LAYOUT
  // ==================================================

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-white/10 bg-[#0d131c] lg:block">

        <div className="flex h-full flex-col">

          {/* LOGO */}

          <div className="px-6 py-8">

            <h1 className="text-2xl font-bold">
              Focus<span className="text-cyan-400">
                Space
              </span>
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Digital Workspace
            </p>

          </div>

          {/* NAVIGATION */}

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

          {/* SYSTEM */}

          <div className="mt-auto border-t border-white/10 px-6 py-6">

            <p className="text-xs uppercase tracking-wider text-gray-600">
              System
            </p>

            <div className="mt-4 flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black text-xs">
                FS
              </div>

              <div>

                <p className="text-sm font-medium text-gray-400">
                  Backend
                </p>

                <p className="text-xs text-cyan-400">
                  Online
                </p>

              </div>

            </div>

          </div>

        </div>

      </aside>

      {/* MOBILE NAV */}

      <div className="border-b border-white/10 bg-[#0d131c] px-4 py-4 lg:hidden">

        <div className="flex items-center justify-between">

          <h1 className="text-xl font-bold">
            Focus<span className="text-cyan-400">
              Space
            </span>
          </h1>

          <select
            value={activeMenu}
            onChange={(event) =>
              setActiveMenu(
                event.target.value as ActiveMenu
              )
            }
            className="rounded-lg border border-white/10 bg-[#1d293b] px-3 py-2 text-sm text-white outline-none"
          >

            {menuItems.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}

          </select>

        </div>

      </div>

      {/* CONTENT */}

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

      </div>

    </div>
  );
}
