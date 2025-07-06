const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(errorBody);
    throw new Error(
      `API request failed with status ${response.status}: ${errorBody}`
    );
  }

  // Si la respuesta no tiene cuerpo (ej. en un 204 No Content),
  // no intentamos parsear JSON.
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>('POST', endpoint, body),
  patch: <T>(endpoint: string, body: unknown) => request<T>('PATCH', endpoint, body),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
}; 