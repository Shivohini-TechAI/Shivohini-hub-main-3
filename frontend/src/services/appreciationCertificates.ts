import api from "../lib/api";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

export const createAppreciationCertificate = async (payload: any) => {
  const res = await api.post("/appreciation-certificates", payload, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getAppreciationCertificates = async () => {
  const res = await api.get("/appreciation-certificates", {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getAppreciationCertificateById = async (id: string) => {
  const res = await api.get(`/appreciation-certificates/${id}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const updateAppreciationCertificate = async (id: string, payload: any) => {
  const res = await api.put(`/appreciation-certificates/${id}`, payload, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const deleteAppreciationCertificate = async (id: string) => {
  const res = await api.delete(`/appreciation-certificates/${id}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};