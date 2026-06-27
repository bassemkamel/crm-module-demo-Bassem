import type {
  Opportunity,
  OpportunityFilters,
  Paginated,
  PipelineSummary,
} from "./types";

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
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Is the API running?");
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
