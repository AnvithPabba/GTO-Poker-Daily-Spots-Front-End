import {
  archiveResponseSchema,
  attemptResponseSchema,
  publicSpotSchema,
  todayResponseSchema,
  type AttemptRequest,
  type AttemptResponse,
  type ArchiveResponse,
  type PublicSpot,
  type TodayResponse,
} from "@poker-trainer/contracts";
import { z } from "zod";

const adminJobSchema = z.object({ id: z.string(), status: z.string(), attemptCount: z.number(), maxAttempts: z.number() });
const adminJobsSchema = z.array(adminJobSchema);
const adminCalendarSchema = z.array(z.object({ id: z.string(), publicationDate: z.string(), slotOrder: z.number(), status: z.string(), spotVersionId: z.string() }));
const adminCoverageSchema = z.object({ coverage: z.number(), target: z.number(), belowThree: z.boolean() });
const apiErrorSchema = z.object({ code: z.string().optional(), message: z.string().optional() }).passthrough();

export class ApiError extends Error {
  public constructor(public readonly status: number, message: string, public readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, schema: { parse(value: unknown): T }, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    credentials: "include",
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    ...init,
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    const message = parsedError.success && parsedError.data.message ? parsedError.data.message : `Request failed (${response.status})`;
    throw new ApiError(response.status, message, parsedError.success ? parsedError.data.code : undefined);
  }
  return schema.parse(body);
}

export const api = {
  today: (): Promise<TodayResponse> => request("/spots/today", todayResponseSchema),
  archive: (cursor?: string): Promise<ArchiveResponse> => request(`/spots/archive?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, archiveResponseSchema),
  spot: (spotId: string): Promise<PublicSpot> => request(`/spots/${encodeURIComponent(spotId)}`, publicSpotSchema),
  submit: (spotId: string, payload: AttemptRequest): Promise<AttemptResponse> => request(`/spots/${encodeURIComponent(spotId)}/attempts`, attemptResponseSchema, { method: "POST", body: JSON.stringify(payload) }),
  adminJobs: (): Promise<Array<{ id: string; status: string; attemptCount: number; maxAttempts: number }>> => request("/admin/jobs", adminJobsSchema),
  adminCalendar: (): Promise<Array<{ id: string; publicationDate: string; slotOrder: number; status: string; spotVersionId: string }>> => request("/admin/calendar", adminCalendarSchema),
  adminCoverage: (): Promise<{ coverage: number; target: number; belowThree: boolean }> => request("/admin/coverage", adminCoverageSchema),
  adminRetryJob: (jobId: string): Promise<unknown> => request(`/admin/jobs/${encodeURIComponent(jobId)}/retry`, z.object({ id: z.string(), status: z.string() }), { method: "POST", body: "{}" }),
  adminHoldJob: (jobId: string): Promise<unknown> => request(`/admin/jobs/${encodeURIComponent(jobId)}/hold`, z.object({ id: z.string(), status: z.string() }), { method: "POST", body: "{}" }),
  adminCancelJob: (jobId: string): Promise<unknown> => request(`/admin/jobs/${encodeURIComponent(jobId)}`, z.object({ id: z.string(), status: z.string() }), { method: "DELETE" }),
};
