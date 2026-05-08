import api from "../lib/api";

export const createAppreciationCertificate = async (payload: any) => {
  const res = await api.post("/appreciation-certificates", payload);
  return res.data;
};

export const getAppreciationCertificates = async () => {
  const res = await api.get("/appreciation-certificates");
  return res.data;
};

export const deleteAppreciationCertificate = async (id: string) => {
  const res = await api.delete(`/appreciation-certificates/${id}`);
  return res.data;
};