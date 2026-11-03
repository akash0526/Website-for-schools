import type { Media, UploadPlan } from '../types';
let tokenResolver: () => string | null = () => null;
export const setTokenResolver = (resolver: () => string | null) => {
  tokenResolver = resolver;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] },
  ) {
    super(message);
  }
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenResolver();
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError('We couldn’t connect. Check your connection and try again.', 0);
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      payload?.error?.message || 'Something went wrong. Please try again.',
      response.status,
      payload?.error?.details,
    );
  return payload.data as T;
}
export const api = {
  get: <T>(path: string) => request<T>(`/api${path}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(`/api${path}`, {
      method: 'POST',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(`/api${path}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(`/api${path}`, { method: 'DELETE' }),
};
export async function uploadImage(file: File): Promise<Media> {
  const plan = await api.post<UploadPlan>('/admin/uploads/authorize');
  if (file.size > plan.maxBytes)
    throw new Error(
      `Please choose an image smaller than ${Math.round(plan.maxBytes / 1024 / 1024)} MB.`,
    );
  if (!plan.allowedMimeTypes.includes(file.type))
    throw new Error('Please choose a JPEG, PNG, or WebP image.');
  const form = new FormData();
  form.append('file', file);
  if (plan.mode === 'server') return request<Media>(plan.uploadUrl, { method: 'POST', body: form });
  form.append('fileName', file.name.replace(/[^a-zA-Z0-9._-]/g, '_'));
  form.append('publicKey', plan.publicKey);
  form.append('signature', plan.signature);
  form.append('expire', String(plan.expire));
  form.append('token', plan.token);
  form.append('folder', plan.folder);
  form.append('useUniqueFileName', 'true');
  form.append('overwriteFile', 'false');
  let response: Response;
  try {
    response = await fetch(plan.uploadUrl, { method: 'POST', body: form });
  } catch {
    throw new Error('Image upload failed. Please check your connection and try again.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.fileId)
    throw new Error(result?.message || 'The image provider could not upload this file.');
  // Never trust browser-supplied URLs or file metadata. Node verifies the file with ImageKit.
  return api.post<Media>('/admin/uploads/verify', { fileId: result.fileId });
}
