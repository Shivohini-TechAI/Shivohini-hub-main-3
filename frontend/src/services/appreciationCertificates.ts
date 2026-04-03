import {} from '../lib/api';

interface CreateAppreciationCertificatePayload {
  recipient_name: string;
  designation?: string;
  appreciation_for: string;
  issue_date: string;
  created_by: string;
}

export const createAppreciationCertificate = async (
  payload: CreateAppreciationCertificatePayload
) => {
  const { data, error } = await supabase
    .from('appreciation_certificates')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
