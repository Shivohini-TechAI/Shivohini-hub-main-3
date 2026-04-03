import {} from '../lib/api';

export interface OfferLetter {
  id: string;
  created_by: string;
  candidate_name: string;
  candidate_email: string;
  position_title: string;
  department: string;
  issue_date: string;
  acceptance_deadline: string;
  status: string;
  pdf_url: string | null;
  created_at: string;

  // ✅ NEW CHECKBOX FIELDS
  nda_sent: boolean;
  nda_received: boolean;
  offer_sent: boolean;
  offer_received: boolean;
}


export interface CreateOfferLetterData {
  candidate_name: string;
  candidate_email: string;
  position_title: string;
  department: string;
  issue_date: string;
  acceptance_deadline: string;
  status?: string;
  pdf_url?: string | null;
}

export interface UpdateOfferLetterData {
  candidate_name?: string;
  candidate_email?: string;
  position_title?: string;
  department?: string;
  issue_date?: string;
  acceptance_deadline?: string;
  status?: string;
  pdf_url?: string | null;
}

export const getOfferLetters = async () => {
  const { data, error } = await supabase
    .from('offer_letters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data as OfferLetter[];
};

export const getOfferLetterById = async (id: string) => {
  const { data, error } = await supabase
    .from('offer_letters')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data as OfferLetter | null;
};

export const createOfferLetter = async (offerData: CreateOfferLetterData) => {
  const { data: userData } = await api.auth.getUser();

  const { data, error } = await supabase
    .from('offer_letters')
    .insert({
      ...offerData,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  return data as OfferLetter;
};

export const updateOfferLetter = async (id: string, offerData: UpdateOfferLetterData) => {
  const { data, error } = await supabase
    .from('offer_letters')
    .update(offerData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data as OfferLetter;
};

export const deleteOfferLetter = async (id: string) => {
  const { error } = await supabase
    .from('offer_letters')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return { success: true };
};

export const updateOfferLetterCheckbox = async (
  id: string,
  field: 'nda_sent' | 'nda_received' | 'offer_sent' | 'offer_received',
  value: boolean
) => {
  const { error } = await supabase
    .from('offer_letters')
    .update({ [field]: value })
    .eq('id', id);

  if (error) throw error;

  return { success: true };
};

