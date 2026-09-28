"use client";

import { useEffect, useState } from "react";

type GoalStatus = "Active" | "Completed" | "Paused";

type Goal = {
  id: number;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  progress: number;
  status: GoalStatus;
};

const API_URL = "http://127.0.0.1:8000";

export default function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==================================================
  // CREATE FORM
  // ==================================================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Personal");
  const [targetDate, setTargetDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] =
    useState<GoalStatus>("Active");

  // ==================================================
  // EDIT FORM
  // ==================================================

  const [editingGoal, setEditingGoal] =
    useState<Goal | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] =
    useState("");
  const [editCategory, setEditCategory] =
    useState("Personal");
  const [editTargetDate, setEditTargetDate] =
    useState("");
  const [editProgress, setEditProgress] =
    useState(0);
  const [editStatus, setEditStatus] =
    useState<GoalStatus>("Active");

  // ==================================================
  // LOAD GOALS
  // ==================================================

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/goals`
      );

      if (!response.ok) {
        throw new Error("Failed to load goals");
      }

      const data = await response.json();

      setGoals(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load goals");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadGoals();
  }, []);

  // ==================================================
  // CREATE GOAL
  // ==================================================

  const addGoal = async () => {
    if (!title.trim()) {
      setError("Please enter a goal title");
      setSuccess("");
      return;
    }

    if (progress < 0 || progress > 100) {
      setError("Progress must be between 0 and 100");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/goals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            category,
            target_date: targetDate || null,
            progress,
            status,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Failed to create goal"
        );
      }

      setTitle("");
      setDescription("");
      setCategory("Personal");
      setTargetDate("");
      setProgress(0);
      setStatus("Active");

      await loadGoals();

      setSuccess("Goal created successfully");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create goal"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // START EDITING
  // ==================================================

  const startEditing = (goal: Goal) => {
    setEditingGoal(goal);

    setEditTitle(goal.title);
    setEditDescription(goal.description);
    setEditCategory(goal.category);
    setEditTargetDate(
      goal.target_date || ""
    );
    setEditProgress(goal.progress);
    setEditStatus(goal.status);

    setError("");
    setSuccess("");
  };

  // ==================================================
  // CANCEL EDIT
  // ==================================================

  const cancelEditing = () => {
    setEditingGoal(null);

    setEditTitle("");
    setEditDescription("");
    setEditCategory("Personal");
    setEditTargetDate("");
    setEditProgress(0);
    setEditStatus("Active");

    setError("");
  };

  // ==================================================
  // SAVE GOAL
  // ==================================================

  const saveGoal = async () => {
    if (!editingGoal) {
      return;
    }

    if (!editTitle.trim()) {
      setError("Goal title cannot be empty");
      return;
    }

    if (
      editProgress < 0 ||
      editProgress > 100
    ) {
      setError(
        "Progress must be between 0 and 100"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/goals/${editingGoal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description:
              editDescription.trim(),
            category: editCategory,
            target_date:
              editTargetDate || null,
            progress: editProgress,
            status: editStatus,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Failed to update goal"
        );
      }

      cancelEditing();

      await loadGoals();

      setSuccess("Goal updated successfully");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update goal"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // DELETE GOAL
  // ==================================================

  const deleteGoal = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/goals/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Failed to delete goal"
        );
      }

      if (editingGoal?.id === id) {
        cancelEditing();
      }

      await loadGoals();

      setSuccess("Goal deleted successfully");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete goal"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // QUICK PROGRESS UPDATE
  // ==================================================

  const updateProgress = async (
    goal: Goal,
    newProgress: number
  ) => {
    const safeProgress = Math.max(
      0,
      Math.min(100, newProgress)
    );

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const newStatus: GoalStatus =
        safeProgress === 100
          ? "Completed"
          : goal.status === "Completed"
          ? "Active"
          : goal.status;

      const response = await fetch(
        `${API_URL}/api/goals/${goal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            progress: safeProgress,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Failed to update progress"
        );
      }

      await loadGoals();

      setSuccess("Goal progress updated");

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update progress"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // STATUS STYLE
  // ==================================================

  const getStatusClass = (
    goalStatus: GoalStatus
  ) => {
    if (goalStatus === "Active") {
      return "bg-cyan-400/10 text-cyan-400";
    }

    if (goalStatus === "Completed") {
      return "bg-green-400/10 text-green-400";
    }

    return "bg-yellow-400/10 text-yellow-400";
  };

  // ==================================================
  // DATE FORMAT
  // ==================================================

  const formatDate = (
    date: string | null
  ) => {
    if (!date) {
      return "No target date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HEADER */}

        <div className="mb-8">

          <p className="text-sm text-gray-500">
            Plan your future
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">

            <div>

              <h1 className="text-3xl font-bold">
                Goals
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Set goals, track progress, and stay focused.
              </p>

            </div>

            {saving && (
              <span className="text-xs text-cyan-400">
                Saving...
              </span>
            )}

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-4 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* CREATE GOAL */}

        <section className="rounded-3xl border border-white/10 bg-[#101827] p-6">

          <h2 className="mb-5 text-xl font-bold">
            Create New Goal
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Goal title"
              className="rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none focus:border-cyan-400"
            >
              <option value="Personal">
                Personal
              </option>

              <option value="Career">
                Career
              </option>

              <option value="Education">
                Education
              </option>

              <option value="Fitness">
                Fitness
              </option>

              <option value="Finance">
                Finance
              </option>

              <option value="Other">
                Other
              </option>
            </select>

          </div>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Goal description"
            rows={4}
            className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
          />

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            <div>

              <label className="mb-2 block text-xs text-gray-500">
                Target Date
              </label>

              <input
                type="date"
                value={targetDate}
                onChange={(event) =>
                  setTargetDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

            </div>

            <div>

              <label className="mb-2 block text-xs text-gray-500">
                Initial Progress
              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(event) =>
                  setProgress(
                    Number(event.target.value)
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

            </div>

            <div>

              <label className="mb-2 block text-xs text-gray-500">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as GoalStatus
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-3 text-white outline-none focus:border-cyan-400"
              >

                <option value="Active">
                  Active
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Paused">
                  Paused
                </option>

              </select>

            </div>

          </div>

          <button
            onClick={addGoal}
            disabled={saving}
            className="mt-5 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "+ Create Goal"}
          </button>

        </section>

        {/* GOAL LIST */}

        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-2xl font-bold">
              Your Goals
            </h2>

            <span className="text-sm text-gray-500">
              {goals.length} total
            </span>

          </div>

          {loading ? (

            <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-500">
              Loading goals...
            </div>

          ) : goals.length === 0 ? (

            <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center">

              <p className="text-gray-400">
                No goals yet.
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Create your first goal above.
              </p>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2">

              {goals.map((goal) => (

                <div
                  key={goal.id}
                  className="rounded-2xl border border-white/10 bg-[#101827] p-6 transition hover:border-cyan-400/20"
                >

                  {/* GOAL HEADER */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <h3 className="text-lg font-bold">
                        {goal.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        {goal.description ||
                          "No description provided."}
                      </p>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        goal.status
                      )}`}
                    >
                      {goal.status}
                    </span>

                  </div>

                  {/* CATEGORY + DATE */}

                  <div className="mt-5 flex flex-wrap gap-2">

                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400">
                      {goal.category}
                    </span>

                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400">
                      Target:{" "}
                      {formatDate(
                        goal.target_date
                      )}
                    </span>

                  </div>

                  {/* PROGRESS */}

                  <div className="mt-6">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-sm font-medium text-gray-300">
                        Progress
                      </span>

                      <span className="text-sm font-semibold text-cyan-400">
                        {goal.progress}%
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">

                      <div
                        className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                        style={{
                          width: `${goal.progress}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* QUICK PROGRESS */}

                  <div className="mt-4 flex flex-wrap gap-2">

                    <button
                      onClick={() =>
                        updateProgress(
                          goal,
                          goal.progress - 10
                        )
                      }
                      disabled={
                        saving ||
                        goal.progress <= 0
                      }
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      -10%
                    </button>

                    <button
                      onClick={() =>
                        updateProgress(
                          goal,
                          goal.progress + 10
                        )
                      }
                      disabled={
                        saving ||
                        goal.progress >= 100
                      }
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-cyan-400 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      +10%
                    </button>

                    <button
                      onClick={() =>
                        updateProgress(
                          goal,
                          100
                        )
                      }
                      disabled={
                        saving ||
                        goal.progress === 100
                      }
                      className="rounded-lg border border-green-400/20 px-3 py-2 text-xs text-green-400 transition hover:bg-green-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Complete
                    </button>

                  </div>

                  {/* ACTIONS */}

                  <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/10 pt-5">

                    <button
                      onClick={() =>
                        startEditing(goal)
                      }
                      className="rounded-lg px-3 py-2 text-xs text-cyan-400 transition hover:bg-cyan-400/10"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteGoal(goal.id)
                      }
                      className="rounded-lg px-3 py-2 text-xs text-gray-500 transition hover:bg-red-400/10 hover:text-red-400"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* EDIT GOAL MODAL */}

        {editingGoal && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#101827] p-6 shadow-2xl">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    Edit Goal
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Update your goal details.
                  </p>

                </div>

                <button
                  onClick={cancelEditing}
                  className="rounded-lg px-3 py-2 text-gray-500 hover:bg-white/5 hover:text-white"
                >
                  ✕
                </button>

              </div>

              <div className="mt-6 space-y-4">

                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(
                      event.target.value
                    )
                  }
                  placeholder="Goal title"
                  className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
                />

                <textarea
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value
                    )
                  }
                  placeholder="Goal description"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
                />

                <select
                  value={editCategory}
                  onChange={(event) =>
                    setEditCategory(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none focus:border-cyan-400"
                >

                  <option value="Personal">
                    Personal
                  </option>

                  <option value="Career">
                    Career
                  </option>

                  <option value="Education">
                    Education
                  </option>

                  <option value="Fitness">
                    Fitness
                  </option>

                  <option value="Finance">
                    Finance
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-xs text-gray-500">
                      Target Date
                    </label>

                    <input
                      type="date"
                      value={editTargetDate}
                      onChange={(event) =>
                        setEditTargetDate(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-3 text-white outline-none focus:border-cyan-400"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs text-gray-500">
                      Progress
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editProgress}
                      onChange={(event) =>
                        setEditProgress(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-3 text-white outline-none focus:border-cyan-400"
                    />

                  </div>

                </div>

                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(
                      event.target.value as GoalStatus
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none focus:border-cyan-400"
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Paused">
                    Paused
                  </option>

                </select>

              </div>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  onClick={cancelEditing}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={saveGoal}
                  disabled={saving}
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}