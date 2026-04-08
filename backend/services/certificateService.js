function generateCertificateId(prefix = "CERT") {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString().slice(-6);
  return `${prefix}-${time}-${random}`;
}

function normalizeCertificatePayload(payload = {}) {
  return {
    title: String(payload.title || "").trim(),
    platform: String(payload.platform || "").trim(),
    type: payload.type || "external",
    courseName: String(payload.courseName || "").trim(),
    issuedBy: String(payload.issuedBy || "").trim(),
    completionDate: payload.completionDate ? new Date(payload.completionDate) : new Date(),
    fileUrl: String(payload.fileUrl || "").trim(),
    verificationLink: String(payload.verificationLink || "").trim(),
    metadata: payload.metadata || {}
  };
}

module.exports = {
  generateCertificateId,
  normalizeCertificatePayload
};