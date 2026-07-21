import { describe, expect, it } from "vitest";
import { validateCertificateDecision } from "./certificate-review";

describe("validateCertificateDecision", () => {
  it("requires a reason when rejecting", () => {
    expect(validateCertificateDecision("REJECTED", "  ")).toBe(
      "Alasan penolakan wajib diisi.",
    );
  });

  it("allows approval without a reason", () => {
    expect(validateCertificateDecision("APPROVED")).toBeNull();
  });

  it("allows rejection with a reason", () => {
    expect(validateCertificateDecision("REJECTED", "Dokumen tidak terbaca")).toBeNull();
  });
});
