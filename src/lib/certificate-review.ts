export function validateCertificateDecision(
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
): string | null {
  if (status === "REJECTED" && !rejectionReason?.trim()) {
    return "Alasan penolakan wajib diisi.";
  }
  return null;
}
