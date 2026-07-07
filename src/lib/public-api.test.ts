import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicApi } from "./public-api";

describe("fetchPublicApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns envelope on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({
          meta: { success: true, status: 200, message: "OK" },
          data: { orderNumber: "BISA-1" },
        }),
      }),
    );

    const result = await fetchPublicApi<{ orderNumber: string }>("/orders/verify/BISA-1");
    expect(result.data.orderNumber).toBe("BISA-1");
  });

  it("throws when response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "text/html" },
      }),
    );

    await expect(fetchPublicApi("/orders/verify/x")).rejects.toThrow(
      "Respons server tidak valid",
    );
  });

  it("throws API message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => "application/json" },
        json: async () => ({
          meta: { success: false, status: 404, message: "Kontrak tidak ditemukan" },
          data: null,
        }),
      }),
    );

    await expect(fetchPublicApi("/orders/verify/missing")).rejects.toThrow(
      "Kontrak tidak ditemukan",
    );
  });
});
