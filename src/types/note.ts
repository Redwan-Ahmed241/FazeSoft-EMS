// TypeScript interfaces matching app/schemas/note.py in the FastAPI backend.

export interface NoteCreate {
  title: string;
  content?: string;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
}

/** Tab-bar view returned by GET /notes — no content. */
export interface NoteListOut {
  note_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface NoteOut extends NoteListOut {
  content: string;
}
