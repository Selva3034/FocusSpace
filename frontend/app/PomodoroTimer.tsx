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

  // ==================================================

  // TIMER SETTINGS

  // ==================================================



  const [focusMinutes, setFocusMinutes] = useState(25);

  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);

  const [longBreakMinutes, setLongBreakMinutes] = useState(15);



  // ==================================================

  // TIMER STATE

  // ==================================================



  const [mode, setMode] = useState<TimerMode>("Focus");

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const [isRunning, setIsRunning] = useState(false);

  const [sessionCount, setSessionCount] = useState(0);



  // ==================================================

  // SETTINGS UI

  // ==================================================



  const [showSettings, setShowSettings] = useState(false);



  // ==================================================

  // TASKS / PROJECTS

  // ==================================================



  const [tasks, setTasks] = useState<Task[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);



  const [selectedTaskId, setSelectedTaskId] =

    useState<number | null>(null);



  const [selectedProjectId, setSelectedProjectId] =

    useState<number | null>(null);



  const [loadingWorkItems, setLoadingWorkItems] =

    useState(true);



  // ==================================================

  // SESSION STATUS

  // ==================================================



  const [sessionMessage, setSessionMessage] = useState("");

  const [savingSession, setSavingSession] = useState(false);



  // ==================================================

  // LOAD TASKS + PROJECTS

  // ==================================================



  useEffect(() => {

    const loadWorkItems = async () => {

      try {

        setLoadingWorkItems(true);



        const [tasksResponse, projectsResponse] =

          await Promise.all([

            fetch(`${API_URL}/api/tasks`),

            fetch(`${API_URL}/api/projects`),

          ]);



        if (!tasksResponse.ok || !projectsResponse.ok) {

          throw new Error(

            "Failed to load tasks or projects"

          );

        }



        const tasksData = await tasksResponse.json();

        const projectsData = await projectsResponse.json();



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



  // ==================================================

  // FILTER TASKS

  // ==================================================



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



  // ==================================================

  // CURRENT DURATION

  // ==================================================



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



  // ==================================================

  // TIMER PROGRESS

  // ==================================================



  const progress =

    currentDurationSeconds === 0

      ? 0

      : Math.max(

          0,

          Math.min(

            100,

            ((currentDurationSeconds - secondsLeft) /

              currentDurationSeconds) *

              100

          )

        );



  const remainingProgress = 100 - progress;



  // ==================================================

  // CURRENT WORK

  // ==================================================



  const selectedTask = tasks.find(

    (task) => task.id === selectedTaskId

  );



  const selectedProject = projects.find(

    (project) => project.id === selectedProjectId

  );



  // ==================================================

  // SAVE FOCUS SESSION

  // ==================================================



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

            "Content-Type": "application/json",

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



      const savedSession = await response.json();



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



  // ==================================================

  // MOVE TO NEXT MODE

  // ==================================================



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



  // ==================================================

  // TIMER

  // ==================================================



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



  // ==================================================

  // HANDLE TIMER COMPLETION

  // ==================================================



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



  // ==================================================

  // FORMAT TIME

  // ==================================================



  const formatTime = (totalSeconds: number) => {

    const minutes = Math.floor(

      totalSeconds / 60

    );



    const seconds = totalSeconds % 60;



    return `${String(minutes).padStart(

      2,

      "0"

    )}:${String(seconds).padStart(2, "0")}`;

  };



  // ==================================================

  // START / PAUSE

  // ==================================================



  const toggleTimer = () => {

    setSessionMessage("");



    setIsRunning(

      (current) => !current

    );

  };



  // ==================================================

  // RESET

  // ==================================================



  const resetTimer = () => {

    setIsRunning(false);



    setSecondsLeft(

      currentDurationSeconds

    );



    setSessionMessage("");

  };



  // ==================================================

  // SKIP

  // ==================================================



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



  // ==================================================

  // CHANGE MODE

  // ==================================================



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



  // ==================================================

  // APPLY SETTINGS

  // ==================================================



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



  // ==================================================

  // PROJECT CHANGE

  // ==================================================



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



  // ==================================================

  // TASK CHANGE

  // ==================================================



  const handleTaskChange = (

    value: string

  ) => {

    const taskId =

      value === ""

        ? null

        : Number(value);



    setSelectedTaskId(taskId);



    if (taskId !== null) {

      const selectedTask = tasks.find(

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



  // ==================================================

  // MODE COLOR / LABEL

  // ==================================================



  const modeLabel =

    mode === "Focus"

      ? "Deep work"

      : mode === "Short Break"

      ? "Quick recharge"

      : "Long recharge";



  // ==================================================

  // UI

  // ==================================================



  return (

    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] via-[#101827] to-[#0b1220] p-5 shadow-2xl sm:p-6">



      {/* Background glow */}

      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />



      <div className="relative">



        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">



          <div>

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />



              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">

                Focus Timer

              </p>

            </div>



            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">

              Pomodoro

            </h2>



            <p className="mt-1 text-xs text-slate-500">

              Stay focused. Work intentionally.

            </p>

          </div>



          <button

            type="button"

            onClick={() =>

              setShowSettings(

                (current) => !current

              )

            }

            className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${

              showSettings

                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"

                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"

            }`}

          >

            <span className="text-base">

              ⚙

            </span>



            <span className="hidden sm:inline">

              Settings

            </span>

          </button>

        </div>



        {/* MODE BUTTONS */}

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-black/20 p-1.5">



          {(

            [

              "Focus",

              "Short Break",

              "Long Break",

            ] as TimerMode[]

          ).map((timerMode) => {

            const active =

              mode === timerMode;



            return (

              <button

                key={timerMode}

                type="button"

                onClick={() =>

                  changeMode(timerMode)

                }

                className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition-all ${

                  active

                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"

                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"

                }`}

              >

                {timerMode}

              </button>

            );

          })}

        </div>



        {/* WORK SELECTION */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">



          <div>

            <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">

              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />

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

              className="w-full rounded-xl border border-white/10 bg-[#0a1019] px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50"

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

            <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">

              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

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

              className="w-full rounded-xl border border-white/10 bg-[#0a1019] px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50"

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



        {/* CURRENT WORK */}

        {(selectedTaskId !== null ||

          selectedProjectId !== null) && (

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] px-4 py-3">



            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">

              ✓

            </div>



            <div className="min-w-0">

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">

                Current work

              </p>



              <p className="mt-0.5 truncate text-sm font-medium text-white">

                {selectedTask

                  ? selectedTask.title

                  : selectedProject

                  ? selectedProject.name

                  : "Selected work"}

              </p>

            </div>

          </div>

        )}



        {/* TIMER */}
        <div className="mt-8 flex flex-col items-center">
          {/* Premium circular timer */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl"
              aria-hidden="true"
            />

            <div
              className="relative flex h-64 w-64 items-center justify-center rounded-full p-[7px] shadow-[0_0_60px_rgba(34,211,238,0.12)] sm:h-72 sm:w-72"
              style={{
                background: `conic-gradient(
                  rgb(34 211 238) ${progress}%,
                  rgba(255,255,255,0.06) ${progress}% 100%
                )`,
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/5 bg-[#080f1a] shadow-2xl">
                <div
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                    isRunning
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      : "border-white/10 bg-white/5 text-slate-500"
                  }`}
                >
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
                  {mode}
                </div>

                <div className="mt-4 text-6xl font-black tracking-[-0.05em] text-white sm:text-7xl">
                  {formatTime(secondsLeft)}
                </div>

                <p className="mt-2 text-xs font-medium text-slate-500">
                  {modeLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Timer metadata */}
          <div className="mt-5 flex w-full max-w-xs items-center justify-between text-xs">
            <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
              <span className="font-semibold text-cyan-300">
                {Math.round(progress)}%
              </span>
              <span className="ml-1 text-slate-600">complete</span>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
              <span className="font-semibold text-white">{sessionCount}</span>
              <span className="ml-1 text-slate-600">
                {sessionCount === 1 ? "session" : "sessions"}
              </span>
            </div>
          </div>

          {/* Linear progress */}
          <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-3 text-center text-[11px] text-slate-600">
            {isRunning ? "Stay focused. You've got this." : "Ready when you are."}
          </p>
        </div>

        {/* CONTROLS */}

        <div className="mt-7 flex items-center justify-center gap-2 sm:gap-3">



          <button

            type="button"

            onClick={resetTimer}

            disabled={savingSession}

            className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-50"

          >

            ↻

            <span className="hidden sm:inline">

              Reset

            </span>

          </button>



          <button

            type="button"

            onClick={toggleTimer}

            disabled={savingSession}

            className="flex h-12 min-w-32 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 hover:shadow-cyan-400/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"

          >

            {isRunning ? (

              <>

                <span>Ⅱ</span>

                Pause

              </>

            ) : (

              <>

                <span>▶</span>

                Start

              </>

            )}

          </button>



          <button

            type="button"

            onClick={skipMode}

            disabled={savingSession}

            className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-50"

          >

            <span>→</span>

            <span className="hidden sm:inline">

              Skip

            </span>

          </button>

        </div>



        {/* SESSION MESSAGE */}

        {sessionMessage && (

          <div

            className={`mt-5 rounded-2xl border px-4 py-3 text-center text-sm ${

              sessionMessage.includes(

                "could not"

              )

                ? "border-red-400/20 bg-red-400/5 text-red-300"

                : "border-cyan-400/20 bg-cyan-400/5 text-cyan-300"

            }`}

          >

            {sessionMessage}

          </div>

        )}



        {/* SESSION STAT */}

        <div className="mt-5 grid grid-cols-2 gap-3">



          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">

            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">

              Completed

            </p>



            <p className="mt-1 text-xl font-bold text-white">

              {sessionCount}

            </p>



            <p className="text-[11px] text-slate-600">

              focus sessions

            </p>

          </div>



          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">

            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">

              Duration

            </p>



            <p className="mt-1 text-xl font-bold text-cyan-400">

              {mode === "Focus"

                ? focusMinutes

                : mode === "Short Break"

                ? shortBreakMinutes

                : longBreakMinutes}

              m

            </p>



            <p className="text-[11px] text-slate-600">

              current mode

            </p>

          </div>

        </div>



        {/* SETTINGS */}

        {showSettings && (

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">



            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-semibold text-white">

                  Timer Settings

                </h3>



                <p className="mt-1 text-xs text-slate-500">

                  Customize your focus cycle.

                </p>

              </div>



              <span className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">

                Minutes

              </span>

            </div>



            <div className="mt-5 grid gap-4 sm:grid-cols-3">



              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">

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

                  className="w-full rounded-xl border border-white/10 bg-[#0a1019] px-3 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"

                />

              </div>



              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">

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

                  className="w-full rounded-xl border border-white/10 bg-[#0a1019] px-3 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"

                />

              </div>



              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">

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

                  className="w-full rounded-xl border border-white/10 bg-[#0a1019] px-3 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"

                />

              </div>

            </div>



            <button

              type="button"

              onClick={applySettings}

              className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 active:scale-[0.99]"

            >

              Apply Settings

            </button>

          </div>

        )}

      </div>

    </section>

  );

}