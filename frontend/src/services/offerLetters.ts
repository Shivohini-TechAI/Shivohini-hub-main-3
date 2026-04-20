import api from "../lib/api";

export const getOfferLetters = async () => {
  const res = await api.get("/api/offer-letters");
  return res.data;
};

export const getOfferLetterById = async (id: string) => {
  const res = await api.get(`/api/offer-letters/${id}`);
  return res.data;
};

export const createOfferLetter = async (data: any) => {
  const res = await api.post("/api/offer-letters", data);
  return res.data;
};

export const updateOfferLetter = async (id: string, data: any) => {
  const res = await api.put(`/api/offer-letters/${id}`, data);
  return res.data;
};

export const deleteOfferLetter = async (id: string) => {
  const res = await api.delete(`/api/offer-letters/${id}`);
  return res.data;
};

export const updateOfferLetterCheckbox = async (
  id: string,
  field: string,
  value: boolean
) => {
  const res = await api.patch(`/api/offer-letters/${id}/checkbox`, {
    field,
    value,
  });
  return res.data;
};