// Notes API — matches app/api/v1/routers/note_router.py.
import { apiClient } from "../utils/apiClient";
import type { NoteCreate, NoteListOut, NoteOut, NoteUpdate } from "../types/note";

export const noteApi = {
  list: () => apiClient.get<NoteListOut[]>("/notes"),
  get: (noteId: string) => apiClient.get<NoteOut>(`/notes/${noteId}`),
  create: (data: NoteCreate) => apiClient.post<NoteOut>("/notes", data),
  update: (noteId: string, data: NoteUpdate) =>
    apiClient.patch<NoteOut>(`/notes/${noteId}`, data),
  remove: (noteId: string) => apiClient.delete<void>(`/notes/${noteId}`),
};
