import { describe, expect, it } from "vitest";
import { ApiError, getApiBaseUrl } from "./api-client";

describe("api-client", () => {
  it("getApiBaseUrl returns default localhost when env unset", () => {
    expect(getApiBaseUrl()).toContain("/api/v1");
  });

  it("ApiError carries status and rate limit flag", () => {
    const err = new ApiError(429, "Terlalu banyak permintaan", null, true);
    expect(err.status).toBe(429);
    expect(err.isRateLimited).toBe(true);
    expect(err.message).toBe("Terlalu banyak permintaan");
  });
});
