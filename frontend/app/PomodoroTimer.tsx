"use client";

import { useEffect, useMemo, useState } from "react";

type PomodoroMode =
  | "Focus"
  | "Short Break"
  | "Long Break";

const DEFAULT_DURATIONS: Record<
  PomodoroMode,
  number
> = {
  Focus: 25,
  "Short Break": 5,
  "Long Break": 15,
};

export default function PomodoroTimer() {
  const [mode, setMode] =
    useState<PomodoroMode>("Focus");

  const [focusMinutes, setFocusMinutes] =
    useState(25);

  const [shortBreakMinutes, setShortBreakMinutes] =
    useState(5);

  const [longBreakMinutes, setLongBreakMinutes] =
    useState(15);

  const [seconds, setSeconds] =
    useState(25 * 60);

  const [running, setRunning] =
    useState(false);

  const [session, setSession] =
    useState(1);

  const [showSettings, setShowSettings] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * Get current duration
   */
  const durationMinutes =
    mode === "Focus"
      ? focusMinutes
      : mode === "Short Break"
      ? shortBreakMinutes
      : longBreakMinutes;

  const durationSeconds =
    durationMinutes * 60;

  /*
   * Timer
   */
  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);

          if (mode === "Focus") {
            setSession(
              (currentSession) =>
                currentSession + 1
            );
          }

          setMessage(
            mode === "Focus"
              ? "Focus session complete. Great work!"
              : "Break complete. Ready to focus?"
          );

          return durationSeconds;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    running,
    mode,
    durationSeconds,
  ]);

  /*
   * Progress
   */
  const progress = useMemo(() => {
    if (durationSeconds <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        ((durationSeconds - seconds) /
          durationSeconds) *
          100
      )
    );
  }, [durationSeconds, seconds]);

  /*
   * Format timer
   */
  const formatTime = (
    value: number
  ) => {
    const minutes = Math.floor(
      value / 60
    );

    const remainingSeconds =
      value % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  /*
   * Change mode
   */
  const changeMode = (
    newMode: PomodoroMode
  ) => {
    setRunning(false);

    setMode(newMode);

    const newDuration =
      newMode === "Focus"
        ? focusMinutes
        : newMode === "Short Break"
        ? shortBreakMinutes
        : longBreakMinutes;

    setSeconds(newDuration * 60);

    setMessage("");
  };

  /*
   * Reset timer
   */
  const resetTimer = () => {
    setRunning(false);

    setSeconds(
      durationMinutes * 60
    );

    setMessage("");
  };

  /*
   * Skip session
   */
  const skipSession = () => {
    const nextMode: PomodoroMode =
      mode === "Focus"
        ? "Short Break"
        : mode === "Short Break"
        ? "Long Break"
        : "Focus";

    changeMode(nextMode);

    setMessage(
      `Switched to ${nextMode}.`
    );
  };

  /*
   * Apply custom settings
   */
  const applySettings = () => {
    const safeFocus = Math.min(
      120,
      Math.max(1, focusMinutes)
    );

    const safeShortBreak =
      Math.min(
        60,
        Math.max(1, shortBreakMinutes)
      );

    const safeLongBreak =
      Math.min(
        120,
        Math.max(1, longBreakMinutes)
      );

    setFocusMinutes(safeFocus);
    setShortBreakMinutes(
      safeShortBreak
    );
    setLongBreakMinutes(
      safeLongBreak
    );

    setRunning(false);

    const newDuration =
      mode === "Focus"
        ? safeFocus
        : mode === "Short Break"
        ? safeShortBreak
        : safeLongBreak;

    setSeconds(
      newDuration * 60
    );

    setShowSettings(false);

    setMessage(
      "Timer settings updated."
    );
  };

  return (
    <section className="focus-card rounded-3xl border border-white/10 bg-white/[0.03] p-5">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
            Focus Timer
          </p>

          <h2 className="mt-1 text-lg font-bold text-white">
            Pomodoro
          </h2>
        </div>

        <div className="flex items-center gap-2">

          <span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-400">
            Session {session}
          </span>

          <button
            onClick={() =>
              setShowSettings(
                (current) => !current
              )
            }
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white"
            title="Timer settings"
          >
            ⚙
          </button>

        </div>

      </div>

      {/* SETTINGS */}

      {showSettings && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">

          <p className="text-xs font-semibold text-white">
            Timer Settings
          </p>

          <p className="mt-1 text-[10px] text-gray-600">
            Set your preferred session durations in minutes.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">

            {/* FOCUS */}

            <div>
              <label className="text-[10px] text-gray-500">
                Focus
              </label>

              <input
                type="number"
                min={1}
                max={120}
                value={focusMinutes}
                onChange={(event) =>
                  setFocusMinutes(
                    Number(event.target.value)
                  )
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
              />
            </div>

            {/* SHORT BREAK */}

            <div>
              <label className="text-[10px] text-gray-500">
                Short Break
              </label>

              <input
                type="number"
                min={1}
                max={60}
                value={shortBreakMinutes}
                onChange={(event) =>
                  setShortBreakMinutes(
                    Number(event.target.value)
                  )
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
              />
            </div>

            {/* LONG BREAK */}

            <div>
              <label className="text-[10px] text-gray-500">
                Long Break
              </label>

              <input
                type="number"
                min={1}
                max={120}
                value={longBreakMinutes}
                onChange={(event) =>
                  setLongBreakMinutes(
                    Number(event.target.value)
                  )
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
              />
            </div>

          </div>

          <button
            onClick={applySettings}
            className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-cyan-300"
          >
            Apply Settings
          </button>

        </div>
      )}

      {/* MODE BUTTONS */}

      <div className="mt-5 grid grid-cols-3 gap-2">

        {(
          [
            "Focus",
            "Short Break",
            "Long Break",
          ] as PomodoroMode[]
        ).map((item) => (

          <button
            key={item}
            onClick={() =>
              changeMode(item)
            }
            className={`rounded-xl px-2 py-2 text-[10px] font-semibold transition ${
              mode === item
                ? "bg-cyan-400 text-black"
                : "border border-white/10 bg-white/[0.03] text-gray-500 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item}
          </button>

        ))}

      </div>

      {/* TIMER */}

      <div className="py-7 text-center">

        <div className="text-5xl font-black tracking-wider text-white">
          {formatTime(seconds)}
        </div>

        <p className="mt-2 text-xs text-gray-600">
          {mode === "Focus"
            ? "Stay focused"
            : "Take a break"}
        </p>

      </div>

      {/* PROGRESS */}

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      {/* MESSAGE */}

      {message && (
        <div className="mb-4 rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2 text-center text-[10px] text-cyan-400">
          {message}
        </div>
      )}

      {/* CONTROLS */}

      <div className="flex gap-2">

        <button
          onClick={() =>
            setRunning(
              (current) => !current
            )
          }
          className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-black shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-300 active:scale-[0.98]"
        >
          {running
            ? "Pause"
            : seconds < durationSeconds
            ? "Resume"
            : "Start"}
        </button>

        <button
          onClick={resetTimer}
          className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          Reset
        </button>

        <button
          onClick={skipSession}
          className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          Skip
        </button>

      </div>

    </section>
  );
}