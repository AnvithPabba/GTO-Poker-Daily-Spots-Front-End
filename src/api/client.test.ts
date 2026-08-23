import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./client.js";
import { dailyGameFixture } from "../test/fixtures.js";

afterEach(() => vi.unstubAllGlobals());

describe("typed API client", () => {
  it("sends attempt idempotency in the HTTP header and validates the response", async () => {
    // Arrange
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      attemptId: "attempt-1",
      attemptKind: "official",
      score: { points: 1000, maximumPoints: 1000, similarityBasisPoints: 10000 },
      progress: dailyGameFixture.progress,
    }), { status: 201, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetch);

    // Act
    const response = await api.submit("fixture-spot", { spotVersionId: "fixture-spot-v3", hands: [{ combo: "AhAs", allocations: { a0: 10000 } }] }, "stable-key-123456789");

    // Assert
    expect.soft(response.score.points).toBe(1000);
    expect.soft(fetch).toHaveBeenCalledWith("/api/v1/spots/fixture-spot/attempts", expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "stable-key-123456789" }) }));
  });

  it("maps the shared nested error envelope into an ApiError", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "HAND_NOT_ALLOWED", message: "That hand is unavailable.", details: {}, requestId: "req_12345678" } }), { status: 400, headers: { "content-type": "application/json" } })));

    // Act
    const promise = api.spot("missing");

    // Assert
    await expect(promise).rejects.toMatchObject({ status: 400, code: "HAND_NOT_ALLOWED", requestId: "req_12345678", message: "That hand is unavailable." } satisfies Partial<ApiError>);
  });
});
