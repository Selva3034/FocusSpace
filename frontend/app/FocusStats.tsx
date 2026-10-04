"use client";

import { useEffect, useState } from "react";

type FocusStatsData = {
  total_sessions: number;
  total_minutes: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function FocusStats() {
  const [stats, setStats] = useState<FocusStatsData>({
    total_sessions: 0,
    total_minutes: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/focus-sessions/stats`
      );

      if (!response.ok) {
        throw new Error("Failed to load focus statistics");
      }

      const data = await response.json();

      setStats({
        total_sessions: data.total_sessions ?? 0,
        total_minutes: data.total_minutes ?? 0,
      });
    } catch (error) {
      console.error(error);
      setError("Unable to load focus statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
          Productivity
        </p>

        <h2 className="mt-1 text-xl font-bold text-white">
          Focus Statistics
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Track your completed focus sessions.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#101624] p-4">
            <p className="text-xs text-gray-500">
              Focus Sessions
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {stats.total_sessions}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              completed
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101624] p-4">
            <p className="text-xs text-gray-500">
              Focus Minutes
            </p>

            <p className="mt-2 text-3xl font-black text-cyan-400">
              {stats.total_minutes}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              total time
            </p>
          </div>
        </div>
      )}
    </section>
  );
}