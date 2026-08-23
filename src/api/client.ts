import {
  apiErrorSchema,
  attemptHistoryResponseSchema,
  attemptResourceSchema,
  createAttemptResponseSchema,
  dailyGameRangeResponseSchema,
  dailyGameSchema,
  publicSpotSchema,
  statsResponseSchema,
  type AttemptHistoryResponse,
  type AttemptResource,
  type CreateAttemptRequest,
  type CreateAttemptResponse,
  type DailyGame,
  type DailyGameRangeResponse,
  type PublicSpot,
  type StatsResponse,
} from "@poker-trainer/contracts";
import { z } from "zod";

const adminJobSchema = z.object({ id: z.string(), status: z.string(), attemptCount: z.number(), maxAttempts: z.number() });
const adminJobsSchema = z.array(adminJobSchema);
const adminCalendarSchema = z.array(z.object({ id: z.string(), publicationDate: z.string(), slotOrder: z.number(), status: z.string(), spotVersionId: z.string() }));
const adminCoverageSchema = z.object({ coverage: z.number(), target: z.number(), belowThree: z.boolean() });
const adminStatusSchema = z.object({ ok: z.boolean(), service: z.literal("admin") });

export class ApiError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, schema: { parse(value: unknown): T }, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = response.status === 204 || response.status === 304 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.error.message : `Request failed (${response.status})`,
      parsed.success ? parsed.data.error.code : undefined,
      parsed.success ? parsed.data.error.requestId : response.headers.get("x-request-id") ?? undefined,
    );
  }
  return schema.parse(body);
}

function isoDate(value: Date): string { return value.toISOString().slice(0, 10); }

export const api = {
  today: (): Promise<DailyGame> => request("/daily-games/today", dailyGameSchema),
  dailyGame: (date: string): Promise<DailyGame> => request(`/daily-games/${encodeURIComponent(date)}`, dailyGameSchema),
  dailyGames: (from: string, to: string): Promise<DailyGameRangeResponse> => request(`/daily-games?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, dailyGameRangeResponseSchema),
  archiveMonth: (date = new Date()): Promise<DailyGameRangeResponse> => {
    const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
    return request(`/daily-games?from=${isoDate(first)}&to=${isoDate(last)}`, dailyGameRangeResponseSchema);
  },
  spot: (spotId: string): Promise<PublicSpot> => request(`/spots/${encodeURIComponent(spotId)}`, publicSpotSchema),
  submit: (spotId: string, payload: CreateAttemptRequest, idempotencyKey: string): Promise<CreateAttemptResponse> => request(`/spots/${encodeURIComponent(spotId)}/attempts`, createAttemptResponseSchema, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  }),
  attempt: (attemptId: string): Promise<AttemptResource> => request(`/attempts/${encodeURIComponent(attemptId)}`, attemptResourceSchema),
  stats: (): Promise<StatsResponse> => request("/users/me/stats", statsResponseSchema),
  attempts: (limit = 20, cursor?: string): Promise<AttemptHistoryResponse> => request(`/users/me/attempts?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, attemptHistoryResponseSchema),
  adminStatus: (): Promise<{ ok: boolean; service: "admin" }> => request("/admin/status", adminStatusSchema),
  adminJobs: (): Promise<Array<{ id: string; status: string; attemptCount: number; maxAttempts: number }>> => request("/admin/jobs", adminJobsSchema),
  adminCalendar: (): Promise<Array<{ id: string; publicationDate: string; slotOrder: number; status: string; spotVersionId: string }>> => request("/admin/calendar", adminCalendarSchema),
  adminCoverage: (): Promise<{ coverage: number; target: number; belowThree: boolean }> => request("/admin/coverage", adminCoverageSchema),
  adminRetryJob: (jobId: string): Promise<unknown> => request(`/admin/jobs/${encodeURIComponent(jobId)}/retry`, z.object({ id: z.string(), status: z.string() }), { method: "POST", body: "{}" }),
  adminHoldJob: (jobId: string): Promise<unknown> => request(`/admin/jobs/${encodeURIComponent(jobId)}/hold`, z.object({ id: z.string(), status: z.string() }), { method: "POST", body: "{}" }),
  adminCancelJob: (jobId: string): Promise<unknown> => request(`/admin/jobs/${encodeURIComponent(jobId)}`, z.object({ id: z.string(), status: z.string() }), { method: "DELETE" }),
};
