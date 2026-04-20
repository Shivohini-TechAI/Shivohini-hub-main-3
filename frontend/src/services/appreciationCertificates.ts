import api from "../lib/api";

export const createAppreciationCertificate = async (payload: any) => {
  const res = await api.post("/api/appreciation-certificates", payload);
  return res.data;
};

export const getAppreciationCertificates = async () => {
  const res = await api.get("/api/appreciation-certificates");
  return res.data;
};