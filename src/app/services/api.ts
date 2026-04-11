const API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 180000; // 3 minutes for slow Ollama

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    let detail = "";
    try {
      const data = await response.json();
      detail =
        typeof data?.detail === "string"
          ? data.detail
          : Array.isArray(data?.detail)
          ? data.detail.map((d: { msg?: string }) => d?.msg).filter(Boolean).join(", ")
          : "";
    } catch {
      // Response body may not be JSON.
    }
    throw new Error(detail || fallback);
  }

  return (await response.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`);
    return await parseJsonResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out (3min). Ollama may be slow - check backend terminal logs.");
    }
    if (error instanceof TypeError) {
      throw new Error("Cannot reach backend. Ensure FastAPI is running on http://127.0.0.1:8000.");
    }
    throw error;
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return await parseJsonResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out (3min). Ollama may be slow - check backend terminal logs.");
    }
    if (error instanceof TypeError) {
      throw new Error("Cannot reach backend. Ensure FastAPI is running on http://127.0.0.1:8000.");
    }
    throw error;
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: "DELETE",
    });
    return await parseJsonResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out (3min). Ollama may be slow - check backend terminal logs.");
    }
    if (error instanceof TypeError) {
      throw new Error("Cannot reach backend. Ensure FastAPI is running on http://127.0.0.1:8000.");
    }
    throw error;
  }
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: "POST",
      body: formData,
    });
    return await parseJsonResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out (3min). Ollama may be slow - check backend terminal logs.");
    }
    if (error instanceof TypeError) {
      throw new Error("Cannot reach backend. Ensure FastAPI is running on http://127.0.0.1:8000.");
    }
    throw error;
  }
}

export { API_BASE_URL };

