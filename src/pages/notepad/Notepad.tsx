import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, NotebookPen, X, GitFork, Layers, Pencil, FileText, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { noteApi } from "../../api/notes";
import type { NoteListOut, SubsectionOut } from "../../types/note";
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
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeSubsectionId, setActiveSubsectionId] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingNote, setLoadingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [creating, setCreating] = useState(false);
  const [dividing, setDividing] = useState(false);
  const [creatingSub, setCreatingSub] = useState(false);

  // Main Section drag & drop sorting state
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  // Subsection drag & drop sorting state
  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);
  const [dragOverSubId, setDragOverSubId] = useState<string | null>(null);

  // Section renaming
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");


  // Subsection renaming
  const [renamingSubId, setRenamingSubId] = useState<string | null>(null);
  const [renameSubValue, setRenameSubValue] = useState("");

  // Deletion targets
  const [deleteTarget, setDeleteTarget] = useState<NoteListOut | null>(null);
  const [deleteSubTarget, setDeleteSubTarget] = useState<{
    parentSectionId: string;
    subsection: SubsectionOut;
  } | null>(null);

  // Find active section and its subsections
  const activeSection = notes.find((note) => note.note_id === activeSectionId) ?? null;
  const currentSubsections = activeSection?.subsections ?? [];
  const hasSubsections = currentSubsections.length > 0;

  // The actual note ID currently loaded into the editor
  const editorNoteId = hasSubsections
    ? (activeSubsectionId ?? currentSubsections[0]?.note_id ?? null)
    : activeSectionId;

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
        if (data.length > 0) {
          const first = data[0];
          setActiveSectionId(first.note_id);
          if (first.subsections && first.subsections.length > 0) {
            setActiveSubsectionId(first.subsections[0].note_id);
          } else {
            setActiveSubsectionId(null);
          }
        } else {
          setActiveSectionId(null);
          setActiveSubsectionId(null);
        }
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

  // Load the selected note or subsection's content into the editor.
  useEffect(() => {
    if (!editorNoteId) {
      setContent("");
      return;
    }
    let cancelled = false;
    setLoadingNote(true);
    (async () => {
      try {
        const note = await noteApi.get(editorNoteId);
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
  }, [editorNoteId]);

  // Save any queued edit when the page unmounts.
  useEffect(() => () => void flush(), [flush]);

  const handleEditorChange = (html: string) => {
    if (!editorNoteId) return;
    setContent(html);
    pendingRef.current = { noteId: editorNoteId, content: html };
    setSaveState("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
  };

  const selectSection = async (sectionId: string) => {
    if (sectionId === activeSectionId) return;
    await flush();
    setActiveSectionId(sectionId);
    setRenamingId(null);
    setRenamingSubId(null);
    const targetSection = notes.find((n) => n.note_id === sectionId);
    if (targetSection?.subsections && targetSection.subsections.length > 0) {
      setActiveSubsectionId(targetSection.subsections[0].note_id);
    } else {
      setActiveSubsectionId(null);
    }
  };

  const selectSubsection = async (subId: string) => {
    if (subId === activeSubsectionId) return;
    await flush();
    setActiveSubsectionId(subId);
    setRenamingSubId(null);
  };

  const createSection = async () => {
    setCreating(true);
    try {
      await flush();
      const note = await noteApi.create({ title: `Note ${notes.length + 1}` });
      setNotes((prev) => [note, ...prev]);
      setActiveSectionId(note.note_id);
      setActiveSubsectionId(null);
      setRenamingId(note.note_id);
      setRenameValue(note.title);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setCreating(false);
    }
  };

  const commitRenameSection = async (noteId: string) => {
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

  const confirmDeleteSection = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await noteApi.remove(target.note_id);
      if (pendingRef.current?.noteId === target.note_id) pendingRef.current = null;
      const remaining = notes.filter((note) => note.note_id !== target.note_id);
      setNotes(remaining);
      if (activeSectionId === target.note_id) {
        if (remaining.length > 0) {
          const nextActive = remaining[0];
          setActiveSectionId(nextActive.note_id);
          setActiveSubsectionId(
            nextActive.subsections && nextActive.subsections.length > 0
              ? nextActive.subsections[0].note_id
              : null
          );
        } else {
          setActiveSectionId(null);
          setActiveSubsectionId(null);
        }
      }
      toast.success("Note deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  // Divide active section into subsections
  const divideSection = async () => {
    if (!activeSectionId || dividing) return;
    setDividing(true);
    try {
      await flush();
      const updated = await noteApi.divide(activeSectionId);
      setNotes((prev) =>
        prev.map((note) => (note.note_id === activeSectionId ? updated : note))
      );
      if (updated.subsections && updated.subsections.length > 0) {
        setActiveSubsectionId(updated.subsections[0].note_id);
      }
      toast.success("Section divided into subsections");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to divide section");
    } finally {
      setDividing(false);
    }
  };

  // Add a new subsection to the active section
  const addSubsection = async () => {
    if (!activeSectionId || creatingSub) return;
    setCreatingSub(true);
    try {
      await flush();
      const currentSubs = activeSection?.subsections ?? [];
      const newTitle = `Subsection ${currentSubs.length + 1}`;
      const newSub = await noteApi.createSubsection(activeSectionId, {
        title: newTitle,
      });

      setNotes((prev) =>
        prev.map((note) => {
          if (note.note_id === activeSectionId) {
            const nextSubs = [...(note.subsections || []), newSub];
            return { ...note, subsections: nextSubs };
          }
          return note;
        })
      );
      setActiveSubsectionId(newSub.note_id);
      setRenamingSubId(newSub.note_id);
      setRenameSubValue(newSub.title);
      toast.success("Subsection added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add subsection");
    } finally {
      setCreatingSub(false);
    }
  };

  // Rename subsection
  const commitRenameSub = async (subId: string) => {
    const title = renameSubValue.trim();
    const currentSub = currentSubsections.find((s) => s.note_id === subId);
    setRenamingSubId(null);
    if (!title || !currentSub || title === currentSub.title || !activeSectionId) return;

    const previous = currentSub.title;
    setNotes((prev) =>
      prev.map((note) => {
        if (note.note_id === activeSectionId) {
          return {
            ...note,
            subsections: (note.subsections || []).map((s) =>
              s.note_id === subId ? { ...s, title } : s
            ),
          };
        }
        return note;
      })
    );

    try {
      await noteApi.update(subId, { title });
    } catch (err) {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.note_id === activeSectionId) {
            return {
              ...note,
              subsections: (note.subsections || []).map((s) =>
                s.note_id === subId ? { ...s, title: previous } : s
              ),
            };
          }
          return note;
        })
      );
      toast.error(err instanceof Error ? err.message : "Failed to rename subsection");
    }
  };

  // Confirm delete subsection
  const confirmDeleteSub = async () => {
    if (!deleteSubTarget) return;
    const { parentSectionId, subsection } = deleteSubTarget;
    setDeleteSubTarget(null);

    try {
      await noteApi.remove(subsection.note_id);
      if (pendingRef.current?.noteId === subsection.note_id) {
        pendingRef.current = null;
      }

      const remainingSubs = currentSubsections.filter(
        (s) => s.note_id !== subsection.note_id
      );

      setNotes((prev) =>
        prev.map((note) => {
          if (note.note_id === parentSectionId) {
            return { ...note, subsections: remainingSubs };
          }
          return note;
        })
      );

      // If active subsection was deleted, switch to another or revert to parent
      if (activeSubsectionId === subsection.note_id) {
        if (remainingSubs.length > 0) {
          setActiveSubsectionId(remainingSubs[0].note_id);
        } else {
          setActiveSubsectionId(null);
        }
      }
      toast.success("Subsection deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete subsection");
    }
  };

  // Main Section Drag & Drop reordering handlers
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
    if (renamingId) return;
    setDraggedSectionId(sectionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sectionId);
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverSectionId !== sectionId) {
      setDragOverSectionId(sectionId);
    }
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  };

  const handleSectionDrop = async (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    setDragOverSectionId(null);
    const sourceSectionId = draggedSectionId || e.dataTransfer.getData("text/plain");
    setDraggedSectionId(null);

    if (!sourceSectionId || sourceSectionId === targetSectionId) return;

    const sourceIndex = notes.findIndex((n) => n.note_id === sourceSectionId);
    const targetIndex = notes.findIndex((n) => n.note_id === targetSectionId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...notes];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Optimistically update order in state
    const previousNotes = notes;
    setNotes(reordered);

    // Persist new order to backend
    try {
      await noteApi.reorderSections(reordered.map((n) => n.note_id));
    } catch (err) {
      // Rollback on failure
      setNotes(previousNotes);
      toast.error(err instanceof Error ? err.message : "Failed to save section order");
    }
  };

  // Subsection Drag & Drop reordering handlers
  const handleDragStart = (e: React.DragEvent, subId: string) => {
    if (renamingSubId) return;
    setDraggedSubId(subId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", subId);
  };

  const handleDragOver = (e: React.DragEvent, subId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverSubId !== subId) {
      setDragOverSubId(subId);
    }
  };

  const handleDragEnd = () => {
    setDraggedSubId(null);
    setDragOverSubId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetSubId: string) => {
    e.preventDefault();
    setDragOverSubId(null);
    const sourceSubId = draggedSubId || e.dataTransfer.getData("text/plain");
    setDraggedSubId(null);

    if (!sourceSubId || sourceSubId === targetSubId || !activeSectionId) return;

    const sourceIndex = currentSubsections.findIndex((s) => s.note_id === sourceSubId);
    const targetIndex = currentSubsections.findIndex((s) => s.note_id === targetSubId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...currentSubsections];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Optimistically update order in state
    setNotes((prev) =>
      prev.map((n) => {
        if (n.note_id === activeSectionId) {
          return { ...n, subsections: reordered };
        }
        return n;
      })
    );

    // Persist new order to backend
    try {
      await noteApi.reorderSubsections(
        activeSectionId,
        reordered.map((s) => s.note_id)
      );
    } catch (err) {
      // Rollback on failure
      setNotes((prev) =>
        prev.map((n) => {
          if (n.note_id === activeSectionId) {
            return { ...n, subsections: currentSubsections };
          }
          return n;
        })
      );
      toast.error(err instanceof Error ? err.message : "Failed to save subsection order");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notepad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal notes. Organize sections and subsections. Only you can see them.
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
          {/* Main Sections Tab bar */}
          <div className="np-tabs">
            <div className="np-tablist">
              {notes.map((note) => {
                const isActive = note.note_id === activeSectionId;
                const isDragging = draggedSectionId === note.note_id;
                const isDragOver = dragOverSectionId === note.note_id;

                return (
                  <div
                    key={note.note_id}
                    draggable={renamingId !== note.note_id}
                    onDragStart={(e) => handleSectionDragStart(e, note.note_id)}
                    onDragOver={(e) => handleSectionDragOver(e, note.note_id)}
                    onDragEnd={handleSectionDragEnd}
                    onDrop={(e) => void handleSectionDrop(e, note.note_id)}
                    className={`np-tab${isActive ? " is-active" : ""}${
                      isDragging ? " is-dragging" : ""
                    }${isDragOver ? " is-drag-over" : ""}`}
                  >
                    {renamingId === note.note_id ? (
                      <input
                        className="np-tab-input"
                        value={renameValue}
                        autoFocus
                        maxLength={255}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={() => void commitRenameSection(note.note_id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void commitRenameSection(note.note_id);
                          if (event.key === "Escape") setRenamingId(null);
                        }}
                      />
                    ) : (
                      <>
                        <span className="np-tab-grip" title="Drag to reposition">
                          <GripVertical className="h-2.5 w-2.5" />
                        </span>
                        <button
                          type="button"
                          className="np-tab-label"
                          onClick={() => void selectSection(note.note_id)}
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
                onClick={() => void createSection()}
                disabled={creating}
                title="New note"
              >
                <Plus className="h-4 w-4" />
                <span>New Note</span>
              </button>
            </div>

            <span className="np-save-state">{SAVE_LABEL[saveState]}</span>
          </div>

          {/* Subsections Bar or Divide Action */}
          {activeSection && (
            <>
              {hasSubsections ? (
                <div className="np-sub-bar">
                  <div className="np-sub-bar-left">
                    <span className="np-sub-badge" title="Subsections of this note">
                      <Layers className="h-3 w-3" />
                      Subsections
                    </span>

                    <div className="np-sub-tabs">
                      {currentSubsections.map((sub) => {
                        const isSubActive = sub.note_id === editorNoteId;
                        const isDragging = draggedSubId === sub.note_id;
                        const isDragOver = dragOverSubId === sub.note_id;

                        return (
                          <div
                            key={sub.note_id}
                            draggable={renamingSubId !== sub.note_id}
                            onDragStart={(e) => handleDragStart(e, sub.note_id)}
                            onDragOver={(e) => handleDragOver(e, sub.note_id)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => void handleDrop(e, sub.note_id)}
                            className={`np-sub-tab${isSubActive ? " is-active" : ""}${
                              isDragging ? " is-dragging" : ""
                            }${isDragOver ? " is-drag-over" : ""}`}
                          >
                            <span className="np-sub-grip" title="Drag to reposition">
                              <GripVertical className="h-2.5 w-2.5" />
                            </span>
                            {renamingSubId === sub.note_id ? (
                              <input
                                className="np-sub-tab-input"
                                value={renameSubValue}
                                autoFocus
                                maxLength={255}
                                onChange={(e) => setRenameSubValue(e.target.value)}
                                onBlur={() => void commitRenameSub(sub.note_id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void commitRenameSub(sub.note_id);
                                  if (e.key === "Escape") setRenamingSubId(null);
                                }}
                              />
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="np-sub-tab-label"
                                  onClick={() => void selectSubsection(sub.note_id)}
                                  onDoubleClick={() => {
                                    setRenamingSubId(sub.note_id);
                                    setRenameSubValue(sub.title);
                                  }}
                                  title={`${sub.title} — double-click to rename`}
                                >
                                  {sub.title}
                                </button>
                                {isSubActive && (
                                  <>
                                    <button
                                      type="button"
                                      className="np-sub-tab-action"
                                      onClick={() => {
                                        setRenamingSubId(sub.note_id);
                                        setRenameSubValue(sub.title);
                                      }}
                                      title="Rename subsection"
                                      aria-label={`Rename ${sub.title}`}
                                    >
                                      <Pencil className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      className="np-sub-tab-action is-delete"
                                      onClick={() =>
                                        setDeleteSubTarget({
                                          parentSectionId: activeSection.note_id,
                                          subsection: sub,
                                        })
                                      }
                                      title="Delete subsection"
                                      aria-label={`Delete ${sub.title}`}
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        className="np-sub-add-btn"
                        onClick={() => void addSubsection()}
                        disabled={creatingSub}
                        title="Add another subsection"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Subsection</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="np-divide-banner">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Single section mode</span>
                  </div>
                  <button
                    type="button"
                    className="np-divide-btn"
                    onClick={() => void divideSection()}
                    disabled={dividing}
                    title="Divide this note into multiple subsections"
                  >
                    <GitFork className="h-3.5 w-3.5" />
                    <span>{dividing ? "Dividing…" : "Divide into Subsections"}</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Editor / empty state */}
          {!activeSection ? (
            <div className="np-center">
              <NotebookPen className="np-empty-icon" />
              <p className="text-sm font-semibold text-foreground mt-4">No notes yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first note to start writing.
              </p>
              <button
                type="button"
                className="np-btn np-btn-primary mt-4"
                onClick={() => void createSection()}
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
            editorNoteId && (
              <NoteEditor
                noteId={editorNoteId}
                content={content}
                onChange={handleEditorChange}
              />
            )
          )}
        </div>
      )}

      {/* Delete Section confirmation */}
      {deleteTarget && (
        <div className="np-overlay" role="dialog" aria-modal="true">
          <div className="np-modal">
            <div className="np-modal-icon">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">Delete note?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              “{deleteTarget.title}” and any subsections inside it will be permanently deleted. This cannot be undone.
            </p>
            <div className="np-modal-actions">
              <button type="button" className="np-btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="np-btn np-btn-danger"
                onClick={() => void confirmDeleteSection()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subsection confirmation */}
      {deleteSubTarget && (
        <div className="np-overlay" role="dialog" aria-modal="true">
          <div className="np-modal">
            <div className="np-modal-icon">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">Delete subsection?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              “{deleteSubTarget.subsection.title}” will be permanently deleted. This cannot be undone.
            </p>
            <div className="np-modal-actions">
              <button type="button" className="np-btn" onClick={() => setDeleteSubTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="np-btn np-btn-danger"
                onClick={() => void confirmDeleteSub()}
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
