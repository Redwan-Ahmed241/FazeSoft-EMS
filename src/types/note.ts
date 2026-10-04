// TypeScript interfaces matching app/schemas/note.py in the FastAPI backend.

export interface NoteCreate {
  title: string;
  content?: string;
  parent_id?: string | null;
  order_index?: number;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  order_index?: number;
}

export interface SubsectionOut {
  note_id: string;
  parent_id?: string | null;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/** Tab-bar view returned by GET /notes — includes subsections for each section. */
export interface NoteListOut {
  note_id: string;
  parent_id?: string | null;
  title: string;
  order_index?: number;
  created_at: string;
  updated_at: string;
  subsections?: SubsectionOut[];
}

export interface NoteOut extends NoteListOut {
  content: string;
  subsections?: SubsectionOut[];
}
