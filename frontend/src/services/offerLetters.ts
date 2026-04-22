import api from "../lib/api";

/* ===================== TYPE ===================== */
export interface OfferLetter {
  id: string;
  candidate_name: string;
  candidate_email: string;
  position_title: string;
  department: string;
  issue_date: string;
  acceptance_deadline: string;
  status: string;

  nda_sent: boolean;
  nda_received: boolean;
  offer_sent: boolean;
  offer_received: boolean;
}

/* ===================== API ===================== */

// ✅ FIXED (IMPORTANT)
export const getOfferLetters = async (): Promise<OfferLetter[]> => {
  const res = await api.get<OfferLetter[]>("/api/offer-letters");
  return res.data;
};

// ✅ FIXED
export const getOfferLetterById = async (
  id: string
): Promise<OfferLetter> => {
  const res = await api.get<OfferLetter>(`/api/offer-letters/${id}`);
  return res.data;
};

// ✅ FIXED
export const createOfferLetter = async (
  data: Partial<OfferLetter>
): Promise<OfferLetter> => {
  const res = await api.post<OfferLetter>("/api/offer-letters", data);
  return res.data;
};

// ✅ FIXED
export const updateOfferLetter = async (
  id: string,
  data: Partial<OfferLetter>
): Promise<OfferLetter> => {
  const res = await api.put<OfferLetter>(
    `/api/offer-letters/${id}`,
    data
  );
  return res.data;
};

// ✅ FIXED
export const deleteOfferLetter = async (id: string): Promise<void> => {
  await api.delete(`/api/offer-letters/${id}`);
};

// ✅ FIXED (STRICT FIELD TYPE)
export const updateOfferLetterCheckbox = async (
  id: string,
  field: "nda_sent" | "nda_received" | "offer_sent" | "offer_received",
  value: boolean
): Promise<OfferLetter> => {
  const res = await api.patch<OfferLetter>(
    `/api/offer-letters/${id}/checkbox`,
    {
      field,
      value,
    }
  );
  return res.data;
};