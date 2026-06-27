import type {
  AuthUser,
  Client,
  ClientType,
  LoginResult,
  Opportunity,
  OpportunityFilters,
  Paginated,
  PipelineStage,
  PipelineSummary,
} from "./types";

const TOKEN_KEY = "crm_token";
/** Event dispatched when the API rejects a request as unauthorized (401). */
export const UNAUTHORIZED_EVENT = "crm:unauthorized";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

/** Payload accepted by the create/update opportunity endpoints. */
export interface OpportunityInput {
  title: string;
  amount: number;
  expectedCloseDate: string;
  stage: PipelineStage;
  clientId: string;
}

/**
 * Payload accepted by the create/update client endpoints. `null` is used to
 * explicitly clear a field (e.g. when switching between company/individual).
 */
export interface ClientInput {
  type: ClientType;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  companyName?: string | null;
  registrationNumber?: string | null;
  industry?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

// Browser-facing base URL. Falls back to the docker-mapped backend port so the
// app works out of the box for local `next dev` too.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Error carrying the HTTP status so callers can react (e.g. 404 vs 500). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Is the API running?");
  }

  if (res.status === 401) {
    // Token missing/expired/invalid: drop it and let the app react (log out).
    setToken(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(401, await extractErrorMessage(res));
  }

  if (!res.ok) {
    throw new ApiError(res.status, await extractErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    if (body.message) return body.message;
  } catch {
    // fall through to status text
  }
  return res.statusText || `Request failed (${res.status})`;
}

function buildQuery(filters: OpportunityFilters): string {
  const params = new URLSearchParams();
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.clientType) params.set("clientType", filters.clientType);
  if (filters.problematic) params.set("problematic", "true");
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getOpportunities(
  filters: OpportunityFilters = {},
): Promise<Paginated<Opportunity>> {
  return request<Paginated<Opportunity>>(
    `/opportunities${buildQuery(filters)}`,
  );
}

export function getOpportunity(id: string): Promise<Opportunity> {
  return request<Opportunity>(`/opportunities/${id}`);
}

export function getPipelineSummary(): Promise<PipelineSummary> {
  return request<PipelineSummary>(`/opportunities/pipeline/summary`);
}

export function login(email: string, password: string): Promise<LoginResult> {
  return request<LoginResult>(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(): Promise<AuthUser> {
  return request<AuthUser>(`/auth/me`);
}

export function getClients(type?: ClientType): Promise<Client[]> {
  const qs = type ? `?type=${type}` : "";
  return request<Client[]>(`/clients${qs}`);
}

export function getClient(id: string): Promise<Client> {
  return request<Client>(`/clients/${id}`);
}

export function createClient(input: ClientInput): Promise<Client> {
  return request<Client>(`/clients`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateClient(id: string, input: ClientInput): Promise<Client> {
  return request<Client>(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteClient(id: string): Promise<void> {
  return request<void>(`/clients/${id}`, { method: "DELETE" });
}

export function createOpportunity(
  input: OpportunityInput,
): Promise<Opportunity> {
  return request<Opportunity>(`/opportunities`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOpportunity(
  id: string,
  input: OpportunityInput,
): Promise<Opportunity> {
  return request<Opportunity>(`/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteOpportunity(id: string): Promise<void> {
  return request<void>(`/opportunities/${id}`, { method: "DELETE" });
}
