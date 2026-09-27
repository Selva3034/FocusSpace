"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Completed" | "Paused";
};

const API_URL = "http://127.0.0.1:8000";

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] =
    useState<"Active" | "Completed" | "Paused">("Active");

  const [error, setError] = useState("");

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

  useEffect(() => {
    loadProjects();
  }, []);

  // ==================================================
  // ADD PROJECT
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
        throw new Error("Failed to create project");
      }

      const newProject = await response.json();

      setProjects((currentProjects) => [
        ...currentProjects,
        newProject,
      ]);

      setName("");
      setDescription("");
      setStatus("Active");
    } catch (error) {
      console.error(error);
      setError("Unable to create project");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // DELETE PROJECT
  // ==================================================

  const deleteProject = async (id: number) => {
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
        throw new Error("Failed to delete project");
      }

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== id
        )
      );
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
        throw new Error("Failed to update project");
      }

      const updatedProject = await response.json();

      setProjects((currentProjects) =>
        currentProjects.map((item) =>
          item.id === updatedProject.id
            ? updatedProject
            : item
        )
      );
    } catch (error) {
      console.error(error);
      setError("Unable to update project");
    } finally {
      setSaving(false);
    }
  };

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

        {/* ADD PROJECT */}
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
            {saving ? "Saving..." : "+ Create Project"}
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

                    <div className="mt-6 flex items-center justify-between">

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
                );
              })}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}