"use client";

import { useEffect, useMemo, useState } from "react";

type PomodoroMode =
  | "Focus"
  | "Short Break"
  | "Long Break";

const DURATIONS: Record<PomodoroMode, number> = {
  Focus: 25 * 60,
  "Short Break": 5 * 60,
  "Long Break": 15 * 60,
};

export default function PomodoroTimer() {
  const [mode, setMode] =
    useState<PomodoroMode>("Focus");

  const [seconds, setSeconds] = useState(
    DURATIONS.Focus
  );

  const [running, setRunning] =
    useState(false);

  const [session, setSession] = useState(1);

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
            setSession((currentSession) => {
              return currentSession + 1;
            });
          }

          return DURATIONS[mode];
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, mode]);

  /*
   * Current duration
   */
  const duration = DURATIONS[mode];

  /*
   * Progress
   */
  const progress = useMemo(() => {
    return Math.min(
      100,
      Math.max(
        0,
        ((duration - seconds) / duration) * 100
      )
    );
  }, [duration, seconds]);

  /*
   * Format timer
   */
  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);

    const remainingSeconds = value % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  };

  /*
   * Change mode
   */
  const changeMode = (newMode: PomodoroMode) => {
    setRunning(false);

    setMode(newMode);

    setSeconds(DURATIONS[newMode]);
  };

  /*
   * Reset
   */
  const resetTimer = () => {
    setRunning(false);

    setSeconds(DURATIONS[mode]);
  };

  /*
   * Skip
   */
  const skipSession = () => {
    const nextMode: PomodoroMode =
      mode === "Focus"
        ? "Short Break"
        : mode === "Short Break"
        ? "Long Break"
        : "Focus";

    changeMode(nextMode);
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

        <span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-400">
          Session {session}
        </span>

      </div>

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

      {/* PROGRESS BAR */}

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      {/* CONTROLS */}

      <div className="flex gap-2">

        <button
          onClick={() =>
            setRunning((current) => !current)
          }
          className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-black shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-300 active:scale-[0.98]"
        >
          {running
            ? "Pause"
            : seconds < duration
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