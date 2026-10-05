"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type DailyFocus = {
  date: string;
  day: string;
  minutes: number;
  sessions: number;
};

type WeeklyAnalytics = {
  week_start: string;
  week_end: string;
  total_sessions: number;
  total_minutes: number;
  daily: DailyFocus[];
};

export default function FocusAnalytics() {
  const [analytics, setAnalytics] =
    useState<WeeklyAnalytics | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/focus-sessions/weekly`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load weekly analytics"
        );
      }

      const data = await response.json();

      setAnalytics(data);
    } catch (error) {
      console.error(
        "Weekly analytics error:",
        error
      );

      setError(
        "Unable to load weekly analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(() => {
      loadAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const maxMinutes = useMemo(() => {
    if (!analytics?.daily?.length) {
      return 1;
    }

    const highest = Math.max(
      ...analytics.daily.map(
        (day) => day.minutes
      )
    );

    return Math.max(highest, 1);
  }, [analytics]);

  const averageMinutes = useMemo(() => {
    if (!analytics) {
      return 0;
    }

    if (analytics.total_sessions === 0) {
      return 0;
    }

    return Math.round(
      analytics.total_minutes /
        analytics.total_sessions
    );
  }, [analytics]);

  const formatDate = (date: string) => {
    const value = new Date(
      `${date}T00:00:00`
    );

    return value.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }

    return `${remainingMinutes}m`;
  };

  return (
    <section className="focus-card mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1422] via-[#0b111d] to-[#080d17] p-5 shadow-2xl sm:p-6">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Analytics
            </p>
          </div>

          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Weekly Focus
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            See how consistently you are building
            focused work time.
          </p>
        </div>

        {analytics && (
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2">
            <p className="text-xs text-slate-500">
              This week
            </p>

            <p className="mt-0.5 text-xs font-semibold text-cyan-400">
              {formatDate(
                analytics.week_start
              )}{" "}
              —{" "}
              {formatDate(
                analytics.week_end
              )}
            </p>
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs text-slate-500">
            Focus Time
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <p className="mt-2 text-2xl font-black text-cyan-400">
              {formatTotalTime(
                analytics?.total_minutes || 0
              )}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs text-slate-500">
            Sessions
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <p className="mt-2 text-2xl font-black text-white">
              {analytics?.total_sessions || 0}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs text-slate-500">
            Average
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <p className="mt-2 text-2xl font-black text-white">
              {averageMinutes}m
            </p>
          )}
        </div>
      </div>

      {/* CHART */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Daily Focus
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              Minutes focused each day
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-[11px] text-slate-500">
              Focus minutes
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-52 items-end justify-between gap-2">
            {Array.from({ length: 7 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex h-full flex-1 items-end"
                >
                  <div
                    className="w-full animate-pulse rounded-t-xl bg-white/10"
                    style={{
                      height: `${
                        25 +
                        index * 7
                      }%`,
                    }}
                  />
                </div>
              )
            )}
          </div>
        ) : (
          <div className="flex h-52 items-end gap-2 sm:gap-3">

            {analytics?.daily.map(
              (day) => {
                const height =
                  day.minutes === 0
                    ? 4
                    : Math.max(
                        (day.minutes /
                          maxMinutes) *
                          100,
                        8
                      );

                return (
                  <div
                    key={day.date}
                    className="group flex h-full flex-1 flex-col items-center justify-end"
                  >

                    <div className="relative flex h-full w-full items-end">

                      {day.minutes > 0 && (
                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#111827] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xl group-hover:block">
                          {day.minutes}m
                          <span className="ml-1 text-slate-500">
                            · {day.sessions}{" "}
                            session
                            {day.sessions !==
                            1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      )}

                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-cyan-500/50 to-cyan-300/90 transition-all duration-500 group-hover:from-cyan-400/70 group-hover:to-cyan-200"
                        style={{
                          height: `${height}%`,
                          minHeight:
                            "4px",
                        }}
                      />
                    </div>

                    <div className="mt-3 text-center">
                      <p className="text-[11px] font-semibold text-slate-400">
                        {day.day}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-700">
                        {day.minutes}m
                      </p>
                    </div>
                  </div>
                );
              }
            )}

          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-5 flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-xs text-slate-600">
          Complete focus sessions to build your
          weekly analytics.
        </p>

        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

          <span className="text-xs text-slate-500">
            Updates automatically
          </span>
        </div>
      </div>

    </section>
  );
}
