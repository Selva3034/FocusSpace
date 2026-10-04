"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  project_id: number | null;
};

type Project = {
  id: number;
  name: string;
  status: string;
};

type TimerMode = "Focus" | "Short Break" | "Long Break";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function PomodoroTimer() {
  /* =========================
     TIMER SETTINGS
  ========================= */

  const [focusMinutes, setFocusMinutes] =
    useState(25);

  const [shortBreakMinutes, setShortBreakMinutes] =
    useState(5);

  const [longBreakMinutes, setLongBreakMinutes] =
    useState(15);

  /* =========================
     TIMER STATE
  ========================= */

  const [mode, setMode] =
    useState<TimerMode>("Focus");

  const [secondsLeft, setSecondsLeft] =
    useState(25 * 60);

  const [isRunning, setIsRunning] =
    useState(false);

  const [sessionCount, setSessionCount] =
    useState(0);

  /* =========================
     SETTINGS UI
  ========================= */

  const [showSettings, setShowSettings] =
    useState(false);

  /* =========================
     TASKS / PROJECTS
  ========================= */

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedTaskId, setSelectedTaskId] =
    useState<number | null>(null);

  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);

  const [loadingWorkItems, setLoadingWorkItems] =
    useState(true);

  /* =========================
     SESSION STATUS
  ========================= */

  const [sessionMessage, setSessionMessage] =
    useState("");

  const [savingSession, setSavingSession] =
    useState(false);

  /* =========================
     LOAD TASKS + PROJECTS
  ========================= */

  useEffect(() => {
    const loadWorkItems = async () => {
      try {
        setLoadingWorkItems(true);

        const [
          tasksResponse,
          projectsResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/tasks`),
          fetch(`${API_URL}/api/projects`),
        ]);

        if (
          !tasksResponse.ok ||
          !projectsResponse.ok
        ) {
          throw new Error(
            "Failed to load tasks or projects"
          );
        }

        const tasksData =
          await tasksResponse.json();

        const projectsData =
          await projectsResponse.json();

        setTasks(tasksData);
        setProjects(projectsData);
      } catch (error) {
        console.error(
          "Failed to load work items:",
          error
        );
      } finally {
        setLoadingWorkItems(false);
      }
    };

    loadWorkItems();
  }, []);

  /* =========================
     FILTER TASKS
  ========================= */

  const availableTasks = useMemo(() => {
    const incompleteTasks = tasks.filter(
      (task) => !task.completed
    );

    if (selectedProjectId === null) {
      return incompleteTasks;
    }

    return incompleteTasks.filter(
      (task) =>
        task.project_id === selectedProjectId
    );
  }, [tasks, selectedProjectId]);

  /* =========================
     CURRENT DURATION
  ========================= */

  const currentDurationSeconds = useMemo(() => {
    if (mode === "Focus") {
      return focusMinutes * 60;
    }

    if (mode === "Short Break") {
      return shortBreakMinutes * 60;
    }

    return longBreakMinutes * 60;
  }, [
    mode,
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
  ]);

  /* =========================
     TIMER PROGRESS
  ========================= */

  const progress =
    currentDurationSeconds === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            ((currentDurationSeconds -
              secondsLeft) /
              currentDurationSeconds) *
              100
          )
        );

  /* =========================
     SAVE FOCUS SESSION
  ========================= */

  const saveFocusSession = async () => {
    if (mode !== "Focus") {
      return;
    }

    try {
      setSavingSession(true);

      const response = await fetch(
        `${API_URL}/api/focus-sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            task_id: selectedTaskId,
            project_id: selectedProjectId,
            mode: "Focus",
            duration_minutes: focusMinutes,
            completed: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save focus session"
        );
      }

      const savedSession =
        await response.json();

      console.log(
        "Focus session saved:",
        savedSession
      );

      setSessionMessage(
        `Focus session saved — ${focusMinutes} minutes`
      );

      setSessionCount(
        (current) => current + 1
      );
    } catch (error) {
      console.error(
        "Failed to save focus session:",
        error
      );

      setSessionMessage(
        "Session finished, but could not be saved."
      );
    } finally {
      setSavingSession(false);
    }
  };

  /* =========================
     MOVE TO NEXT MODE
  ========================= */

  const moveToNextMode = () => {
    if (mode === "Focus") {
      const nextSessionCount =
        sessionCount + 1;

      if (nextSessionCount % 4 === 0) {
        setMode("Long Break");
        setSecondsLeft(
          longBreakMinutes * 60
        );
      } else {
        setMode("Short Break");
        setSecondsLeft(
          shortBreakMinutes * 60
        );
      }

      return;
    }

    setMode("Focus");
    setSecondsLeft(focusMinutes * 60);
  };

  /* =========================
     TIMER
  ========================= */

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  /* =========================
     HANDLE TIMER COMPLETION
  ========================= */

  useEffect(() => {
    if (
      secondsLeft !== 0 ||
      isRunning
    ) {
      return;
    }

    const finishTimer = async () => {
      if (mode === "Focus") {
        await saveFocusSession();
      } else {
        setSessionMessage(
          `${mode} finished.`
        );
      }

      moveToNextMode();
    };

    finishTimer();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isRunning]);

  /* =========================
     FORMAT TIME
  ========================= */

  const formatTime = (
    totalSeconds: number
  ) => {
    const minutes = Math.floor(
      totalSeconds / 60
    );

    const seconds =
      totalSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  /* =========================
     START / PAUSE
  ========================= */

  const toggleTimer = () => {
    setSessionMessage("");
    setIsRunning(
      (current) => !current
    );
  };

  /* =========================
     RESET
  ========================= */

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(
      currentDurationSeconds
    );
    setSessionMessage("");
  };

  /* =========================
     SKIP
  ========================= */

  const skipMode = () => {
    setIsRunning(false);
    setSessionMessage("");

    if (mode === "Focus") {
      setMode("Short Break");
      setSecondsLeft(
        shortBreakMinutes * 60
      );
    } else {
      setMode("Focus");
      setSecondsLeft(
        focusMinutes * 60
      );
    }
  };

  /* =========================
     CHANGE MODE
  ========================= */

  const changeMode = (
    newMode: TimerMode
  ) => {
    setIsRunning(false);
    setMode(newMode);
    setSessionMessage("");

    if (newMode === "Focus") {
      setSecondsLeft(
        focusMinutes * 60
      );
    } else if (
      newMode === "Short Break"
    ) {
      setSecondsLeft(
        shortBreakMinutes * 60
      );
    } else {
      setSecondsLeft(
        longBreakMinutes * 60
      );
    }
  };

  /* =========================
     APPLY SETTINGS
  ========================= */

  const applySettings = () => {
    setIsRunning(false);

    if (mode === "Focus") {
      setSecondsLeft(
        focusMinutes * 60
      );
    } else if (
      mode === "Short Break"
    ) {
      setSecondsLeft(
        shortBreakMinutes * 60
      );
    } else {
      setSecondsLeft(
        longBreakMinutes * 60
      );
    }

    setShowSettings(false);
    setSessionMessage("");
  };

  /* =========================
     PROJECT CHANGE
  ========================= */

  const handleProjectChange = (
    value: string
  ) => {
    const projectId =
      value === ""
        ? null
        : Number(value);

    setSelectedProjectId(projectId);

    setSelectedTaskId(null);
  };

  /* =========================
     TASK CHANGE
  ========================= */

  const handleTaskChange = (
    value: string
  ) => {
    const taskId =
      value === ""
        ? null
        : Number(value);

    setSelectedTaskId(taskId);

    if (taskId !== null) {
      const selectedTask =
        tasks.find(
          (task) => task.id === taskId
        );

      if (
        selectedTask &&
        selectedTask.project_id !== null
      ) {
        setSelectedProjectId(
          selectedTask.project_id
        );
      }
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#101827] p-6 shadow-xl">
      {/* HEADER */}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Focus Timer
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            Pomodoro
          </h2>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowSettings(
              (current) => !current
            )
          }
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10"
        >
          Settings
        </button>
      </div>

      {/* MODE BUTTONS */}

      <div className="mt-6 grid grid-cols-3 gap-2">
        {(
          [
            "Focus",
            "Short Break",
            "Long Break",
          ] as TimerMode[]
        ).map((timerMode) => (
          <button
            key={timerMode}
            type="button"
            onClick={() =>
              changeMode(timerMode)
            }
            className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
              mode === timerMode
                ? "bg-cyan-500 text-black"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {timerMode}
          </button>
        ))}
      </div>

      {/* WORK SELECTION */}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Project
          </label>

          <select
            value={
              selectedProjectId ?? ""
            }
            onChange={(event) =>
              handleProjectChange(
                event.target.value
              )
            }
            disabled={loadingWorkItems}
            className="w-full rounded-xl border border-white/10 bg-[#0b0f14] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="">
              No project
            </option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Task
          </label>

          <select
            value={
              selectedTaskId ?? ""
            }
            onChange={(event) =>
              handleTaskChange(
                event.target.value
              )
            }
            disabled={loadingWorkItems}
            className="w-full rounded-xl border border-white/10 bg-[#0b0f14] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="">
              No task
            </option>

            {availableTasks.map((task) => (
              <option
                key={task.id}
                value={task.id}
              >
                {task.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SELECTED WORK */}

      {(selectedTaskId !== null ||
        selectedProjectId !== null) && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">
            Current work
          </p>

          <p className="mt-1 text-sm text-white">
            {selectedTaskId !== null
              ? tasks.find(
                  (task) =>
                    task.id ===
                    selectedTaskId
                )?.title ||
                "Selected task"
              : "Project focus"}
          </p>
        </div>
      )}

      {/* TIMER */}

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          {mode}
        </p>

        <div className="mt-3 text-6xl font-bold tracking-tight text-white sm:text-7xl">
          {formatTime(secondsLeft)}
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Focus sessions completed:{" "}
          {sessionCount}
        </p>
      </div>

      {/* CONTROLS */}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={toggleTimer}
          disabled={savingSession}
          className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning
            ? "Pause"
            : "Start"}
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-300 transition hover:bg-white/10"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={skipMode}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-300 transition hover:bg-white/10"
        >
          Skip
        </button>
      </div>

      {/* SESSION MESSAGE */}

      {sessionMessage && (
        <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-center text-sm text-cyan-300">
          {sessionMessage}
        </div>
      )}

      {/* SETTINGS */}

      {showSettings && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="font-semibold text-white">
            Timer Settings
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs text-gray-400">
                Focus
              </label>

              <input
                type="number"
                min="1"
                max="180"
                value={focusMinutes}
                onChange={(event) =>
                  setFocusMinutes(
                    Math.max(
                      1,
                      Number(
                        event.target.value
                      )
                    )
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b0f14] px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-gray-400">
                Short Break
              </label>

              <input
                type="number"
                min="1"
                max="60"
                value={shortBreakMinutes}
                onChange={(event) =>
                  setShortBreakMinutes(
                    Math.max(
                      1,
                      Number(
                        event.target.value
                      )
                    )
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b0f14] px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-gray-400">
                Long Break
              </label>

              <input
                type="number"
                min="1"
                max="60"
                value={longBreakMinutes}
                onChange={(event) =>
                  setLongBreakMinutes(
                    Math.max(
                      1,
                      Number(
                        event.target.value
                      )
                    )
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b0f14] px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={applySettings}
            className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            Apply Settings
          </button>
        </div>
      )}
    </section>
  );
}