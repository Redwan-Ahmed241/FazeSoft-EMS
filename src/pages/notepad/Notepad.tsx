import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, NotebookPen, X } from "lucide-react";
import { toast } from "sonner";
import { noteApi } from "../../api/notes";
import type { NoteListOut } from "../../types/note";
import { NoteEditor } from "./NoteEditor";
import "../../styles/notepad.css";

const AUTOSAVE_DELAY_MS = 1200;

type SaveState = "idle" | "dirty" | "saving" | "saved";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
};

export function Notepad() {
  const [notes, setNotes] = useState<NoteListOut[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingNote, setLoadingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [creating, setCreating] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NoteListOut | null>(null);

  // Content edited but not yet persisted, keyed by the note it belongs to.
  const pendingRef = useRef<{ noteId: string; content: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;

    setSaveState("saving");
    try {
      await noteApi.update(pending.noteId, { content: pending.content });
      setSaveState("saved");
    } catch (err) {
      setSaveState("dirty");
      // Keep the edit queued so the next autosave retries it.
      pendingRef.current = pending;
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    }
  }, []);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await noteApi.list();
        if (cancelled) return;
        setNotes(data);
        setActiveId(data.length ? data[0].note_id : null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the selected note's content.
  useEffect(() => {
    if (!activeId) {
      setContent("");
      return;
    }
    let cancelled = false;
    setLoadingNote(true);
    (async () => {
      try {
        const note = await noteApi.get(activeId);
        if (cancelled) return;
        setContent(note.content);
        setSaveState("idle");
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to open note");
      } finally {
        if (!cancelled) setLoadingNote(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Save any queued edit when the page unmounts.
  useEffect(() => () => void flush(), [flush]);

  const handleEditorChange = (html: string) => {
    if (!activeId) return;
    setContent(html);
    pendingRef.current = { noteId: activeId, content: html };
    setSaveState("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
  };

  const selectNote = async (noteId: string) => {
    if (noteId === activeId) return;
    await flush();
    setActiveId(noteId);
  };

  const createNote = async () => {
    setCreating(true);
    try {
      await flush();
      const note = await noteApi.create({ title: `Note ${notes.length + 1}` });
      setNotes((prev) => [note, ...prev]);
      setActiveId(note.note_id);
      setRenamingId(note.note_id);
      setRenameValue(note.title);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setCreating(false);
    }
  };

  const commitRename = async (noteId: string) => {
    const title = renameValue.trim();
    const current = notes.find((note) => note.note_id === noteId);
    setRenamingId(null);
    if (!title || !current || title === current.title) return;

    const previous = current.title;
    setNotes((prev) =>
      prev.map((note) => (note.note_id === noteId ? { ...note, title } : note))
    );
    try {
      await noteApi.update(noteId, { title });
    } catch (err) {
      setNotes((prev) =>
        prev.map((note) => (note.note_id === noteId ? { ...note, title: previous } : note))
      );
      toast.error(err instanceof Error ? err.message : "Failed to rename note");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await noteApi.remove(target.note_id);
      if (pendingRef.current?.noteId === target.note_id) pendingRef.current = null;
      const remaining = notes.filter((note) => note.note_id !== target.note_id);
      setNotes(remaining);
      if (activeId === target.note_id) {
        setActiveId(remaining.length ? remaining[0].note_id : null);
      }
      toast.success("Note deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const activeNote = notes.find((note) => note.note_id === activeId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notepad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal notes. Only you can see them.
        </p>
      </div>

      {loading ? (
        <div className="np-panel np-center">
          <div className="np-spinner" />
          <p className="text-sm text-muted-foreground mt-4">Loading your notes…</p>
        </div>
      ) : error ? (
        <div className="np-panel np-center">
          <p className="text-sm font-semibold text-foreground">{error}</p>
          <button
            type="button"
            className="np-btn np-btn-primary mt-4"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="np-panel">
          {/* Tab bar */}
          <div className="np-tabs">
            <div className="np-tablist">
              {notes.map((note) => {
                const isActive = note.note_id === activeId;
                return (
                  <div key={note.note_id} className={`np-tab${isActive ? " is-active" : ""}`}>
                    {renamingId === note.note_id ? (
                      <input
                        className="np-tab-input"
                        value={renameValue}
                        autoFocus
                        maxLength={255}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={() => void commitRename(note.note_id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void commitRename(note.note_id);
                          if (event.key === "Escape") setRenamingId(null);
                        }}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className="np-tab-label"
                          onClick={() => void selectNote(note.note_id)}
                          onDoubleClick={() => {
                            setRenamingId(note.note_id);
                            setRenameValue(note.title);
                          }}
                          title={`${note.title} — double-click to rename`}
                        >
                          {note.title}
                        </button>
                        {isActive && (
                          <button
                            type="button"
                            className="np-tab-delete"
                            onClick={() => setDeleteTarget(note)}
                            aria-label={`Delete ${note.title}`}
                            title="Delete note"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="np-tab-add"
                onClick={() => void createNote()}
                disabled={creating}
                title="New note"
              >
                <Plus className="h-4 w-4" />
                <span>New Note</span>
              </button>
            </div>

            <span className="np-save-state">{SAVE_LABEL[saveState]}</span>
          </div>

          {/* Editor / empty state */}
          {!activeNote ? (
            <div className="np-center">
              <NotebookPen className="np-empty-icon" />
              <p className="text-sm font-semibold text-foreground mt-4">No notes yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first note to start writing.
              </p>
              <button
                type="button"
                className="np-btn np-btn-primary mt-4"
                onClick={() => void createNote()}
                disabled={creating}
              >
                <Plus className="h-4 w-4" />
                New Note
              </button>
            </div>
          ) : loadingNote ? (
            <div className="np-center">
              <div className="np-spinner" />
            </div>
          ) : (
            <NoteEditor
              noteId={activeNote.note_id}
              content={content}
              onChange={handleEditorChange}
            />
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="np-overlay" role="dialog" aria-modal="true">
          <div className="np-modal">
            <div className="np-modal-icon">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">Delete note?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              “{deleteTarget.title}” will be permanently deleted. This cannot be undone.
            </p>
            <div className="np-modal-actions">
              <button type="button" className="np-btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="np-btn np-btn-danger"
                onClick={() => void confirmDelete()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notepad;
