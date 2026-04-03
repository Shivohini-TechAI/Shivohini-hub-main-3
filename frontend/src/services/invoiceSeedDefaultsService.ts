import {} from '../lib/api';

export interface InvoiceSeedDefaultsConfig {
  defaultCurrency: 'INR' | 'USD' | 'AED';
  defaultTaxRate: number;
  defaultDiscountType?: 'flat' | 'percent';
  defaultDiscountValue?: number;
  defaultBillFrom: {
    company: string;
    email: string;
    phone: string;
    address: string;
  };
  defaultDateFormat: 'DD-MM-YYYY' | 'MM/DD/YYYY';
  defaultNumberFormat: 'indian' | 'western';
  defaultTemplateColor?: string;
  defaultLogoPath?: string;
  invoiceNumberPattern: string;
  startingCounter: number;
  includeNotesByDefault: boolean;
  defaultNotes: string;
  includeTermsByDefault: boolean;
  defaultTerms: string;
  includeSignatureByDefault: boolean;
}

export interface InvoiceSeedDefaultsPreset {
  id: string;
  owner_id: string;
  name: string;
  config: InvoiceSeedDefaultsConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FACTORY_DEFAULTS: InvoiceSeedDefaultsConfig = {
  defaultCurrency: 'INR',
  defaultTaxRate: 6,
  defaultDiscountType: undefined,
  defaultDiscountValue: 0,
  defaultBillFrom: {
    company: 'Shivohini TechAI',
    email: 'info@shivohinitechai.com',
    phone: '+91 7688929473',
    address: 'Bangalore, Karnataka, India',
  },
  defaultDateFormat: 'MM/DD/YYYY',
  defaultNumberFormat: 'indian',
  defaultTemplateColor: '#0B2D5B',
  defaultLogoPath: '/Logo_withoutBG.png',
  invoiceNumberPattern: 'INV-YYYYMM-###',
  startingCounter: 1,
  includeNotesByDefault: true,
  defaultNotes: 'Thank you for your business! Payment is due within the specified due date.',
  includeTermsByDefault: true,
  defaultTerms: 'Payment is due within 7 days of invoice date.\nLate payments may incur additional charges.\nAll prices are in the specified currency.',
  includeSignatureByDefault: false,
};

const CACHE_KEY = 'shivohini-hub:activeSeedDefaults';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function loadAllPresets(userId: string): Promise<InvoiceSeedDefaultsPreset[]> {
  const { data, error } = await supabase
    .from('invoice_seed_defaults')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function loadActivePreset(userId: string): Promise<InvoiceSeedDefaultsConfig> {
  // Try cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { config, timestamp, userId: cachedUserId } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION && cachedUserId === userId) {
        return config;
      }
    } catch (e) {
      // Invalid cache, continue to fetch
    }
  }

  // Fetch from Supabase
  const { data, error } = await supabase
    .from('invoice_seed_defaults')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;

  const config = data?.config || FACTORY_DEFAULTS;

  // Cache the result
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ config, timestamp: Date.now(), userId })
  );

  return config;
}

export async function savePreset(
  userId: string,
  name: string,
  config: InvoiceSeedDefaultsConfig,
  id?: string
): Promise<InvoiceSeedDefaultsPreset> {
  if (id) {
    // Update existing preset
    const { data, error } = await supabase
      .from('invoice_seed_defaults')
      .update({
        name,
        config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new preset
    const { data, error } = await supabase
      .from('invoice_seed_defaults')
      .insert({
        owner_id: userId,
        name,
        config,
        is_active: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function setActivePreset(userId: string, presetId: string): Promise<void> {
  // Deactivate all presets
  await supabase
    .from('invoice_seed_defaults')
    .update({ is_active: false })
    .eq('owner_id', userId);

  // Activate the selected preset
  const { error } = await supabase
    .from('invoice_seed_defaults')
    .update({ is_active: true })
    .eq('id', presetId)
    .eq('owner_id', userId);

  if (error) throw error;

  // Clear cache
  localStorage.removeItem(CACHE_KEY);
}

export async function deletePreset(userId: string, presetId: string): Promise<void> {
  const { error } = await supabase
    .from('invoice_seed_defaults')
    .delete()
    .eq('id', presetId)
    .eq('owner_id', userId);

  if (error) throw error;

  // Clear cache
  localStorage.removeItem(CACHE_KEY);
}

export async function resetToFactoryDefaults(userId: string): Promise<InvoiceSeedDefaultsPreset> {
  // Deactivate all presets
  await supabase
    .from('invoice_seed_defaults')
    .update({ is_active: false })
    .eq('owner_id', userId);

  // Create a new factory defaults preset
  const { data, error } = await supabase
    .from('invoice_seed_defaults')
    .insert({
      owner_id: userId,
      name: 'Factory Defaults',
      config: FACTORY_DEFAULTS,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  // Clear cache
  localStorage.removeItem(CACHE_KEY);

  return data;
}

export function exportPresetsToJSON(presets: InvoiceSeedDefaultsPreset[]): string {
  const exportData = presets.map((preset) => ({
    name: preset.name,
    config: preset.config,
  }));
  return JSON.stringify(exportData, null, 2);
}

export async function importPresetsFromJSON(
  userId: string,
  jsonString: string
): Promise<number> {
  let presets;
  try {
    presets = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid JSON format');
  }

  if (!Array.isArray(presets)) {
    throw new Error('JSON must be an array of presets');
  }

  let importedCount = 0;

  for (const preset of presets) {
    if (!preset.name || !preset.config) {
      continue; // Skip invalid presets
    }

    try {
      await api.from('invoice_seed_defaults').insert({
        owner_id: userId,
        name: preset.name,
        config: preset.config,
        is_active: false,
      });
      importedCount++;
    } catch (e) {
      console.error('Failed to import preset:', preset.name, e);
    }
  }

  // Clear cache
  localStorage.removeItem(CACHE_KEY);

  return importedCount;
}

export function getFactoryDefaults(): InvoiceSeedDefaultsConfig {
  return { ...FACTORY_DEFAULTS };
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
