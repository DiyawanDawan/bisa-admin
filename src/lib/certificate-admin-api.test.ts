import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet, apiPatch } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiGet,
  apiPatch,
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiRequest: vi.fn(),
  apiDownload: vi.fn(),
}));

import {
  fetchProductCertificate,
  fetchProductCertificates,
  reviewProductCertificate,
} from "./api/admin";

describe("certificate admin API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends queue filters and pagination", async () => {
    apiGet.mockResolvedValue({ data: [], pagination: { total: 0, page: 2, limit: 20 } });
    await fetchProductCertificates({
      page: 2,
      limit: 20,
      search: "organik",
      status: "PENDING",
    });
    expect(apiGet).toHaveBeenCalledWith(
      "/admin/products/certificates?page=2&limit=20&search=organik&status=PENDING",
    );
  });

  it("loads certificate detail", async () => {
    apiGet.mockResolvedValue({ data: { id: "cert-1" } });
    await fetchProductCertificate("cert-1");
    expect(apiGet).toHaveBeenCalledWith("/admin/products/certificates/cert-1");
  });

  it("sends approve and reject decisions", async () => {
    apiPatch.mockResolvedValue({ data: { id: "cert-1", status: "APPROVED" } });
    await reviewProductCertificate("cert-1", "APPROVED");
    expect(apiPatch).toHaveBeenCalledWith(
      "/admin/products/certificates/cert-1/review",
      { status: "APPROVED", rejectionReason: undefined },
    );
  });
});
