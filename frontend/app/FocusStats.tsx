"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type FocusStatsData = {
  total_sessions: number;
  total_minutes: number;
};

export default function FocusStats() {
  const [stats, setStats] = useState<FocusStatsData>({
    total_sessions: 0,
    total_minutes: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/focus-sessions/stats`
      );

      if (!response.ok) {
        throw new Error("Failed to load focus statistics");
      }

      const data = await response.json();

      setStats({
        total_sessions: data.total_sessions || 0,
        total_minutes: data.total_minutes || 0,
      });
    } catch (error) {
      console.error("Focus statistics error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(
    stats.total_minutes / 60
  );

  const minutes = stats.total_minutes % 60;

  const timeDisplay =
    hours > 0
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;

  return (
    <section className="focus-card mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1422] via-[#0b111d] to-[#080d17] p-5 shadow-2xl sm:p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-start justify-between gap-4">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Productivity
            </p>
          </div>

          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Focus Statistics
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track your completed focus sessions.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2 sm:block">
          <span className="text-xs text-slate-400">
            All time
          </span>
        </div>

      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* SESSIONS */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.03]">

          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/20" />

          <div className="relative">

            <div className="mb-4 flex items-center justify-between">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-lg">
                ⏱
              </div>

              <span className="text-xs font-medium text-slate-600">
                Sessions
              </span>

            </div>

            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded-lg bg-white/10" />
            ) : (
              <p className="text-4xl font-black tracking-tight text-white">
                {stats.total_sessions}
              </p>
            )}

            <p className="mt-1 text-xs text-slate-500">
              completed focus sessions
            </p>

          </div>
        </div>

        {/* TIME */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.03]">

          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/20" />

          <div className="relative">

            <div className="mb-4 flex items-center justify-between">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-lg">
                ◷
              </div>

              <span className="text-xs font-medium text-slate-600">
                Focus Time
              </span>

            </div>

            {loading ? (
              <div className="h-10 w-24 animate-pulse rounded-lg bg-white/10" />
            ) : (
              <p className="text-4xl font-black tracking-tight text-cyan-400">
                {timeDisplay}
              </p>
            )}

            <p className="mt-1 text-xs text-slate-500">
              total focused time
            </p>

          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">

        <p className="text-xs text-slate-600">
          Keep building your focus streak.
        </p>

        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="text-xs text-slate-500">
            Live stats
          </span>
        </div>

      </div>

    </section>
  );
}