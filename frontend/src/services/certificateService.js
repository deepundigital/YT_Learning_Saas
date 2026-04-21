import api from "./api";

export async function getCertificates() {
  const { data } = await api.get("/certificates");
  return data;
}

export async function createCertificate(payload) {
  const { data } = await api.post("/certificates", payload);
  return data;
}

export async function deleteCertificate(certificateId) {
  const { data } = await api.delete(`/certificates/${certificateId}`);
  return data;
}

export async function verifyCertificate(certificateId) {
  const { data } = await api.get(`/certificates/verify/${certificateId}`);
  return data;
}