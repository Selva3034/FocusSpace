"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Completed" | "Paused";
};

type ProjectProgress = {
  project_id: number;
  project_name: string;
  total_tasks: number;
  completed_tasks: number;
  progress: number;
};

type ProjectNote = {
  id: number;
  title: string;
  content: string;
  project_id: number | null;
};

const API_URL = "http://127.0.0.1:8000";

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [progressData, setProgressData] = useState<ProjectProgress[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] =
    useState<"Active" | "Completed" | "Paused">("Active");

  // Edit form
  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [editStatus, setEditStatus] =
    useState<"Active" | "Completed" | "Paused">("Active");

  const [error, setError] = useState("");

  // ==================================================
  // PROJECT NOTES
  // ==================================================

  const [projectNotes, setProjectNotes] = useState<
    Record<number, ProjectNote[]>
  >({});

  const [expandedProjectId, setExpandedProjectId] =
    useState<number | null>(null);

  const [notesLoading, setNotesLoading] = useState(false);

  // ==================================================
  // LOAD PROJECTS
  // ==================================================

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/projects`
      );

      if (!response.ok) {
        throw new Error("Failed to load projects");
      }

      const data = await response.json();

      setProjects(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load projects");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD PROJECT PROGRESS
  // ==================================================

  const loadProgress = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/projects-progress`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load project progress"
        );
      }

      const data = await response.json();

      setProgressData(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load project progress");
    }
  };

  // ==================================================
  // LOAD EVERYTHING
  // ==================================================

  const loadData = async () => {
    await Promise.all([
      loadProjects(),
      loadProgress(),
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==================================================
  // GET PROGRESS FOR PROJECT
  // ==================================================

  const getProjectProgress = (
    projectId: number
  ) => {
    return (
      progressData.find(
        (item) =>
          item.project_id === projectId
      ) || {
        project_id: projectId,
        project_name: "",
        total_tasks: 0,
        completed_tasks: 0,
        progress: 0,
      }
    );
  };

  // ==================================================
  // LOAD PROJECT NOTES
  // ==================================================

  const loadProjectNotes = async (
    projectId: number
  ) => {
    try {
      setNotesLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/notes`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load project notes"
        );
      }

      const data = await response.json();

      setProjectNotes((previous) => ({
        ...previous,
        [projectId]: data,
      }));
    } catch (error) {
      console.error(error);
      setError("Unable to load project notes");
    } finally {
      setNotesLoading(false);
    }
  };

  // ==================================================
  // TOGGLE PROJECT NOTES
  // ==================================================

  const toggleProjectNotes = async (
    projectId: number
  ) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      return;
    }

    setExpandedProjectId(projectId);

    await loadProjectNotes(projectId);
  };

  // ==================================================
  // CREATE PROJECT
  // ==================================================

  const addProject = async () => {
    if (!name.trim()) {
      setError("Please enter a project name");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create project"
        );
      }

      setName("");
      setDescription("");
      setStatus("Active");

      await loadData();
    } catch (error) {
      console.error(error);
      setError("Unable to create project");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // START EDITING
  // ==================================================

  const startEditing = (project: Project) => {
    setEditingProject(project);

    setEditName(project.name);
    setEditDescription(project.description);
    setEditStatus(project.status);

    setError("");
  };

  // ==================================================
  // CANCEL EDIT
  // ==================================================

  const cancelEditing = () => {
    setEditingProject(null);

    setEditName("");
    setEditDescription("");
    setEditStatus("Active");

    setError("");
  };

  // ==================================================
  // SAVE EDIT
  // ==================================================

  const saveProject = async () => {
    if (!editingProject) {
      return;
    }

    if (!editName.trim()) {
      setError(
        "Project name cannot be empty"
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/projects/${editingProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            description: editDescription.trim(),
            status: editStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update project"
        );
      }

      cancelEditing();

      await loadData();
    } catch (error) {
      console.error(error);
      setError("Unable to update project");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // DELETE PROJECT
  // ==================================================

  const deleteProject = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/projects/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete project"
        );
      }

      if (editingProject?.id === id) {
        cancelEditing();
      }

      if (expandedProjectId === id) {
        setExpandedProjectId(null);
      }

      setProjectNotes((previous) => {
        const updated = {
          ...previous,
        };

        delete updated[id];

        return updated;
      });

      await loadData();
    } catch (error) {
      console.error(error);
      setError("Unable to delete project");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // UPDATE PROJECT STATUS
  // ==================================================

  const updateStatus = async (
    project: Project,
    newStatus: Project["status"]
  ) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update project"
        );
      }

      await loadData();
    } catch (error) {
      console.error(error);
      setError("Unable to update project");
    } finally {
      setSaving(false);
    }
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
            Organize your work
          </p>

          <div className="mt-2 flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold">
                Projects
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Manage your projects and track their progress.
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
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* CREATE PROJECT */}

        <section className="rounded-3xl border border-white/10 bg-[#101827] p-6">

          <h2 className="mb-5 text-xl font-bold">
            Create New Project
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Project name"
              className="rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | "Active"
                    | "Completed"
                    | "Paused"
                )
              }
              className="rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none focus:border-cyan-400"
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

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Project description"
            rows={4}
            className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
          />

          <button
            onClick={addProject}
            disabled={saving}
            className="mt-5 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "+ Create Project"}
          </button>

        </section>

        {/* PROJECT LIST */}

        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-2xl font-bold">
              Your Projects
            </h2>

            <span className="text-sm text-gray-500">
              {projects.length} total
            </span>

          </div>

          {loading ? (

            <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-500">
              Loading projects...
            </div>

          ) : projects.length === 0 ? (

            <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center">

              <p className="text-gray-400">
                No projects yet.
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Create your first project above.
              </p>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2">

              {projects.map((project) => {

                const projectProgress =
                  getProjectProgress(
                    project.id
                  );

                const notes =
                  projectNotes[project.id] || [];

                const isNotesExpanded =
                  expandedProjectId === project.id;

                const statusClass =
                  project.status === "Active"
                    ? "bg-cyan-400/10 text-cyan-400"
                    : project.status === "Completed"
                    ? "bg-green-400/10 text-green-400"
                    : "bg-yellow-400/10 text-yellow-400";

                return (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-white/10 bg-[#101827] p-6 transition hover:border-cyan-400/20"
                  >

                    {/* PROJECT HEADER */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <h3 className="text-lg font-bold">
                          {project.name}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-400">
                          {project.description ||
                            "No description provided."}
                        </p>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                      >
                        {project.status}
                      </span>

                    </div>

                    {/* PROGRESS */}

                    <div className="mt-6">

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-sm font-medium text-gray-300">
                          Progress
                        </span>

                        <span className="text-sm font-semibold text-cyan-400">
                          {projectProgress.progress}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/10">

                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                          style={{
                            width: `${projectProgress.progress}%`,
                          }}
                        />

                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {projectProgress.completed_tasks} of{" "}
                        {projectProgress.total_tasks}{" "}
                        tasks completed
                      </p>

                    </div>

                    {/* PROJECT NOTES */}

                    <div className="mt-6 border-t border-white/10 pt-5">

                      <div className="flex items-center justify-between gap-3">

                        <div>

                          <h4 className="text-sm font-semibold text-gray-200">
                            Project Notes
                          </h4>

                          <p className="mt-1 text-xs text-gray-500">
                            {isNotesExpanded
                              ? `${notes.length} note${
                                  notes.length === 1
                                    ? ""
                                    : "s"
                                }`
                              : "View notes linked to this project"}
                          </p>

                        </div>

                        <button
                          onClick={() =>
                            toggleProjectNotes(
                              project.id
                            )
                          }
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-cyan-400 transition hover:bg-cyan-400/10"
                        >
                          {isNotesExpanded
                            ? "Hide Notes"
                            : "View Notes"}
                        </button>

                      </div>

                      {isNotesExpanded && (

                        <div className="mt-4 space-y-3">

                          {notesLoading ? (

                            <div className="rounded-xl border border-white/10 bg-[#1d293b] p-4 text-center text-sm text-gray-500">
                              Loading notes...
                            </div>

                          ) : notes.length === 0 ? (

                            <div className="rounded-xl border border-dashed border-white/10 bg-[#1d293b]/50 p-5 text-center">

                              <p className="text-sm text-gray-400">
                                No notes assigned to this project.
                              </p>

                              <p className="mt-1 text-xs text-gray-600">
                                Assign a note to this project from the Notes section.
                              </p>

                            </div>

                          ) : (

                            notes.map((note) => (

                              <div
                                key={note.id}
                                className="rounded-xl border border-white/10 bg-[#1d293b] p-4"
                              >

                                <h5 className="font-semibold text-white">
                                  {note.title}
                                </h5>

                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                                  {note.content ||
                                    "No content available."}
                                </p>

                              </div>

                            ))

                          )}

                        </div>

                      )}

                    </div>

                    {/* PROJECT ACTIONS */}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

                      <select
                        value={project.status}
                        onChange={(event) =>
                          updateStatus(
                            project,
                            event.target.value as Project["status"]
                          )
                        }
                        className="rounded-lg border border-white/10 bg-[#1d293b] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
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

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            startEditing(project)
                          }
                          className="rounded-lg px-3 py-2 text-xs text-cyan-400 transition hover:bg-cyan-400/10"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteProject(project.id)
                          }
                          className="rounded-lg px-3 py-2 text-xs text-gray-500 transition hover:bg-red-400/10 hover:text-red-400"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* EDIT PROJECT MODAL */}

        {editingProject && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#101827] p-6 shadow-2xl">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    Edit Project
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Update your project details.
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
                  value={editName}
                  onChange={(event) =>
                    setEditName(event.target.value)
                  }
                  placeholder="Project name"
                  className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
                />

                <textarea
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value
                    )
                  }
                  placeholder="Project description"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#1d293b] px-4 py-4 text-white outline-none placeholder:text-gray-400 focus:border-cyan-400"
                />

                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(
                      event.target.value as
                        | "Active"
                        | "Completed"
                        | "Paused"
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
                  onClick={saveProject}
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