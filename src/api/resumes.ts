// Resume parsing API — matches app/api/v1/routers/resume_router.py.
// Uses multipart/form-data upload (not JSON), so it talks to the backend directly.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function parseResume<T = Record<string, unknown>>(file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/resumes/parse`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorData?.detail || `Server error: ${response.status}`);
  }

  return (await response.json()) as T;
}