"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type StreakData = {
  current_streak: number;
  best_streak: number;
  today_completed: boolean;
  focus_dates: string[];
};

export default function FocusStreak() {
  const [streak, setStreak] =
    useState<StreakData>({
      current_streak: 0,
      best_streak: 0,
      today_completed: false,
      focus_dates: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadStreak = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/focus-sessions/streak`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load focus streak"
        );
      }

      const data = await response.json();

      setStreak({
        current_streak:
          data.current_streak || 0,
        best_streak:
          data.best_streak || 0,
        today_completed:
          data.today_completed || false,
        focus_dates:
          data.focus_dates || [],
      });
    } catch (error) {
      console.error(
        "Focus streak error:",
        error
      );

      setError(
        "Unable to load focus streak."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreak();

    const interval = setInterval(() => {
      loadStreak();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const currentStreakText =
    streak.current_streak === 1
      ? "day"
      : "days";

  const bestStreakText =
    streak.best_streak === 1
      ? "day"
      : "days";

  return (
    <section className="focus-card mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] via-[#0b111d] to-[#080d17] p-5 shadow-2xl sm:p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-start justify-between gap-4">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.8)]" />

            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400">
              Consistency
            </p>
          </div>

          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Focus Streak
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Build a daily habit of focused work.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-orange-400/10 bg-orange-400/5 px-3 py-2 sm:block">
          <span className="text-xs text-slate-400">
            Daily goal
          </span>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* MAIN STREAK */}
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">

        <div className="relative overflow-hidden rounded-2xl border border-orange-400/10 bg-gradient-to-br from-orange-400/[0.08] to-white/[0.02] p-6">

          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative">

            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-400/10 bg-orange-400/10 text-2xl">
                🔥
              </div>

              {streak.today_completed && (
                <span className="rounded-full border border-emerald-400/10 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                  Today complete
                </span>
              )}
            </div>

            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Current streak
            </p>

            {loading ? (
              <div className="mt-2 h-12 w-32 animate-pulse rounded-xl bg-white/10" />
            ) : (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight text-white">
                  {streak.current_streak}
                </span>

                <span className="text-sm font-medium text-orange-400">
                  {currentStreakText}
                </span>
              </div>
            )}

            <p className="mt-2 text-xs text-slate-600">
              {streak.today_completed
                ? "Great work. Keep the streak alive tomorrow."
                : "Complete a focus session today to start or maintain your streak."}
            </p>
          </div>
        </div>

        {/* BEST STREAK */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">

          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 text-xl">
            ★
          </div>

          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Best streak
          </p>

          {loading ? (
            <div className="mt-2 h-10 w-24 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-black text-cyan-400">
                {streak.best_streak}
              </span>

              <span className="text-sm text-slate-500">
                {bestStreakText}
              </span>
            </div>
          )}

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-400 transition-all duration-700"
              style={{
                width:
                  streak.best_streak > 0
                    ? `${Math.min(
                        (streak.current_streak /
                          streak.best_streak) *
                          100,
                        100
                      )}%`
                    : "0%",
              }}
            />
          </div>

          <p className="mt-2 text-[11px] text-slate-600">
            Current progress toward your best
          </p>
        </div>
      </div>

      {/* WEEKLY DAYS */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Keep the streak alive
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              Focus every day to build consistency.
            </p>
          </div>

          <span className="text-xs text-slate-600">
            {streak.focus_dates.length} total days
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map(
            (_, index) => {
              const date = new Date();

              date.setDate(
                date.getDate() -
                  (6 - index)
              );

              const dateString =
                date.toISOString().split("T")[0];

              const completed =
                streak.focus_dates.includes(
                  dateString
                );

              const isToday =
                dateString ===
                new Date()
                  .toISOString()
                  .split("T")[0];

              return (
                <div
                  key={dateString}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-[10px] font-semibold text-slate-600">
                    {date.toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "short",
                      }
                    )}
                  </span>

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition ${
                      completed
                        ? "border-orange-400/20 bg-orange-400/10 text-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.12)]"
                        : isToday
                        ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-400"
                        : "border-white/5 bg-white/[0.02] text-slate-700"
                    }`}
                  >
                    {completed
                      ? "✓"
                      : "·"}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">

        <p className="text-xs text-slate-600">
          One focused session is enough to keep
          building momentum.
        </p>

        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />

          <span className="text-xs text-slate-500">
            Live
          </span>
        </div>
      </div>

    </section>
  );
}