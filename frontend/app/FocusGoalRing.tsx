
"use client";

import { useEffect, useState } from "react";

type FocusGoalRingProps = {
  completedMinutes: number;
  goalMinutes?: number;
};

export default function FocusGoalRing({
  completedMinutes,
  goalMinutes = 120,
}: FocusGoalRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const safeCompleted = Math.max(0, completedMinutes);
  const safeGoal = Math.max(1, goalMinutes);
  const percentage = Math.min(
    100,
    Math.round((safeCompleted / safeGoal) * 100)
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimatedProgress(percentage);
    });

    return () => cancelAnimationFrame(frame);
  }, [percentage]);

  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference -
    (animatedProgress / 100) * circumference;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 transition-all duration-300 hover:border-cyan-400/30">
      <div className="mb-5">
        <p className="text-sm font-semibold text-white">
          Daily Focus Goal
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Small steps, consistent progress.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
        <div className="relative h-40 w-40 shrink-0">
          <svg
            viewBox="0 0 160 160"
            className="h-full w-full -rotate-90"
            role="img"
            aria-label={`${percentage}% of daily focus goal completed`}
          >
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />

            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">
              {percentage}%
            </span>
            <span className="mt-1 text-xs text-gray-400">
              Completed
            </span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-right">
          <p className="text-2xl font-bold text-white">
            {Math.floor(safeCompleted / 60)}h{" "}
            {safeCompleted % 60}m
          </p>

          <p className="mt-1 text-sm text-gray-400">
            of {Math.floor(safeGoal / 60)}h{" "}
            {safeGoal % 60}m daily goal
          </p>

          <p className="mt-3 text-sm font-medium text-cyan-400">
            {percentage >= 100
              ? "Daily goal achieved!"
              : `${safeGoal - safeCompleted} minutes to go`}
          </p>
        </div>
      </div>
    </section>
  );
}
