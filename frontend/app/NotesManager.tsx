"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type Note = {
  id: number;
  title: string;
  content: string;
  project_id: number | null;
};

const API_URL = "http://127.0.0.1:8000";

export default function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editProjectId, setEditProjectId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = async (
    path: string,
    options?: RequestInit
  ) => {
    const response = await fetch(API_URL + path, options);

    if (!response.ok) {
      throw new Error("Request failed: " + response.status);
    }

    return response.json();
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [notesData, projectsData] = await Promise.all([
        request("/api/notes"),
        request("/api/projects"),
      ]);

      setNotes(notesData);
      setProjects(projectsData);
    } catch (err) {
      console.error(err);
      setError("Unable to load notes or projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const addNote = async () => {
    clearMessages();

    if (!title.trim()) {
      setError("Please enter a note title.");
      return;
    }

    setSaving(true);

    try {
      const newNote = await request("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          project_id: projectId,
        }),
      });

      setNotes((previous) => [newNote, ...previous]);
      setTitle("");
      setContent("");
      setProjectId(null);
      setMessage("Note created successfully.");
    } catch (err) {
      console.error(err);
      setError("Unable to create note.");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (note: Note) => {
    clearMessages();
    setEditing(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditProjectId(note.project_id);
  };

  const saveEdit = async () => {
    if (!editing) return;

    clearMessages();

    if (!editTitle.trim()) {
      setError("Note title cannot be empty.");
      return;
    }

    setSaving(true);

    try {
      const updatedNote = await request(
        "/api/notes/" + editing.id,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle.trim(),
            content: editContent.trim(),
            project_id: editProjectId,
          }),
        }
      );

      setNotes((previous) =>
        previous.map((note) =>
          note.id === updatedNote.id ? updatedNote : note
        )
      );

      setEditing(null);
      setMessage("Note updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Unable to update note.");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: number) => {
    if (!window.confirm("Delete this note permanently?")) {
      return;
    }

    clearMessages();
    setSaving(true);

    try {
      await request("/api/notes/" + id, {
        method: "DELETE",
      });

      setNotes((previous) =>
        previous.filter((note) => note.id !== id)
      );

      setMessage("Note deleted successfully.");
    } catch (err) {
      console.error(err);
      setError("Unable to delete note.");
    } finally {
      setSaving(false);
    }
  };

  const getProjectName = (id: number | null) => {
    if (id === null) return "Personal Note";

    return (
      projects.find((project) => project.id === id)?.name ??
      "Unknown Project"
    );
  };

  const filteredNotes = notes.filter((note) => {
    const query = search.toLowerCase();

    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      getProjectName(note.project_id)
        .toLowerCase()
        .includes(query)
    );
  });

  const inputClass =
    "w-full rounded-xl border border-white/10 " +
    "bg-[#1d293b] px-4 py-3 text-white outline-none " +
    "placeholder:text-gray-500 focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <header className="mb-8">
          <p className="text-sm text-gray-500">
            Your personal knowledge space
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Notes
          </h1>

          <p className="mt-2 text-gray-400">
            Capture ideas and organize your knowledge.
          </p>
        </header>

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-400"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-[#101827] p-6">
          <h2 className="mb-5 text-xl font-bold">
            Create New Note
          </h2>

          <div className="space-y-4">
            <input
              className={inputClass}
              placeholder="Note title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />

            <textarea
              className={inputClass}
              rows={6}
              placeholder="Write your note..."
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
            />

            <select
              className={inputClass}
              value={projectId ?? ""}
              onChange={(event) =>
                setProjectId(
                  event.target.value
                    ? Number(event.target.value)
                    : null
                )
              }
            >
              <option value="">Personal Note</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <button
              onClick={addNote}
              disabled={saving}
              className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:bg-cyan-300 disabled:opacity-50"
            >
              {saving ? "Saving..." : "+ Create Note"}
            </button>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                Your Notes
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredNotes.length} of {notes.length} notes
              </p>
            </div>

            <input
              className="w-full rounded-xl border border-white/10 bg-[#1d293b] px-4 py-3 text-sm outline-none focus:border-cyan-400 sm:w-72"
              placeholder="Search notes..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {loading ? (
            <div className="rounded-2xl bg-[#101827] p-8 text-center text-gray-400">
              Loading notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#101827] p-8 text-center text-gray-400">
              {search
                ? "No matching notes found."
                : "No notes yet. Create your first note."}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredNotes.map((note) => (
                <article
                  key={note.id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-[#101827] p-6 transition hover:border-cyan-400/30"
                >
                  <h3 className="break-words text-xl font-bold">
                    {note.title}
                  </h3>

                  <span className="mt-3 w-fit rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                    {getProjectName(note.project_id)}
                  </span>

                  <p className="mt-5 flex-1 whitespace-pre-wrap break-words text-sm leading-7 text-gray-400">
                    {note.content || "No content"}
                  </p>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      disabled={saving}
                      onClick={() => startEditing(note)}
                      className="rounded-lg px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      disabled={saving}
                      onClick={() => deleteNote(note.id)}
                      className="rounded-lg px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-note-title"
            className="my-auto w-full max-w-xl rounded-3xl border border-white/10 bg-[#101827] p-6 shadow-2xl"
          >
            <h2
              id="edit-note-title"
              className="mb-6 text-2xl font-bold"
            >
              Edit Note
            </h2>

            {error && (
              <p role="alert" className="mb-4 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <input
                className={inputClass}
                value={editTitle}
                onChange={(event) =>
                  setEditTitle(event.target.value)
                }
                placeholder="Note title"
              />

              <textarea
                className={inputClass}
                rows={7}
                value={editContent}
                onChange={(event) =>
                  setEditContent(event.target.value)
                }
                placeholder="Note content"
              />

              <select
                className={inputClass}
                value={editProjectId ?? ""}
                onChange={(event) =>
                  setEditProjectId(
                    event.target.value
                      ? Number(event.target.value)
                      : null
                  )
                }
              >
                <option value="">Personal Note</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={saving}
                onClick={() => {
                  setEditing(null);
                  clearMessages();
                }}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-400 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={saveEdit}
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black hover:bg-cyan-300 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}