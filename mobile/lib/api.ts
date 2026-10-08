import { API_BASE_URL } from './config';

type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: unknown;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiClientError';
    this.statusCode = body.statusCode;
    this.code = body.code;
    this.details = body.details;
  }
}

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return send<T>(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Multipart upload.
 *
 * Content-Type is deliberately left unset so the runtime can add the multipart
 * boundary. Setting application/json by hand, as apiRequest does, makes the
 * server unable to parse the file at all.
 */
export async function apiUpload<T>(
  path: string,
  form: FormData,
  token: string,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return send<T>(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: form,
  });
}

async function send<T>(
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: BodyInit;
  },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiClientError({
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message: 'Cannot reach the server. Check your connection and try again.',
    });
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorBody = (payload ?? {}) as Partial<ApiErrorBody>;
    throw new ApiClientError({
      statusCode: response.status,
      code: typeof errorBody.code === 'string' ? errorBody.code : 'HTTP_ERROR',
      message:
        typeof errorBody.message === 'string'
          ? errorBody.message
          : `Request failed with status ${response.status}`,
      details: errorBody.details,
    });
  }

  return payload as T;
}