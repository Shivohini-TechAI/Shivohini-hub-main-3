const API = "/api";

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
  defaultNotes: 'Thank you for your business!',
  includeTermsByDefault: true,
  defaultTerms: 'Payment due within 7 days.',
  includeSignatureByDefault: false,
};

const CACHE_KEY = 'shivohini-hub:activeSeedDefaults';
const CACHE_DURATION = 5 * 60 * 1000;

// ================= LOAD ALL =================
export async function loadAllPresets(userId: string): Promise<InvoiceSeedDefaultsPreset[]> {
  const res = await fetch(`${API}/invoice-presets?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to load presets");
  return res.json();
}

// ================= LOAD ACTIVE =================
export async function loadActivePreset(userId: string): Promise<InvoiceSeedDefaultsConfig> {
  const cached = localStorage.getItem(CACHE_KEY);

  if (cached) {
    try {
      const { config, timestamp, userId: cachedUserId } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION && cachedUserId === userId) {
        return config;
      }
    } catch {}
  }

  const res = await fetch(`${API}/invoice-presets/active?userId=${userId}`);
  if (!res.ok) return FACTORY_DEFAULTS;

  const data = await res.json();
  const config = data?.config || FACTORY_DEFAULTS;

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ config, timestamp: Date.now(), userId })
  );

  return config;
}

// ================= SAVE =================
export async function savePreset(
  userId: string,
  name: string,
  config: InvoiceSeedDefaultsConfig,
  id?: string
): Promise<InvoiceSeedDefaultsPreset> {

  const res = await fetch(`${API}/invoice-presets`, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, config, id }),
  });

  if (!res.ok) throw new Error("Failed to save preset");

  return res.json();
}

// ================= SET ACTIVE =================
export async function setActivePreset(userId: string, presetId: string): Promise<void> {
  await fetch(`${API}/invoice-presets/activate/${presetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  localStorage.removeItem(CACHE_KEY);
}

// ================= DELETE =================
export async function deletePreset(userId: string, presetId: string): Promise<void> {
  await fetch(`${API}/invoice-presets/${presetId}?userId=${userId}`, {
    method: "DELETE",
  });

  localStorage.removeItem(CACHE_KEY);
}

// ================= RESET =================
export async function resetToFactoryDefaults(userId: string): Promise<InvoiceSeedDefaultsPreset> {
  const res = await fetch(`${API}/invoice-presets/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  localStorage.removeItem(CACHE_KEY);

  return res.json();
}

// ================= IMPORT (🔥 FIXED) =================
export async function importPresetsFromJSON(
  userId: string,
  jsonString: string
): Promise<number> {

  let presets;

  try {
    presets = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON");
  }

  if (!Array.isArray(presets)) {
    throw new Error("JSON must be array");
  }

  let count = 0;

  for (const preset of presets) {
    if (!preset.name || !preset.config) continue;

    await fetch(`${API}/invoice-presets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        name: preset.name,
        config: preset.config,
      }),
    });

    count++;
  }

  localStorage.removeItem(CACHE_KEY);

  return count;
}

// ================= EXPORT =================
export function exportPresetsToJSON(presets: InvoiceSeedDefaultsPreset[]): string {
  return JSON.stringify(
    presets.map(p => ({ name: p.name, config: p.config })),
    null,
    2
  );
}

// ================= UTIL =================
export function getFactoryDefaults(): InvoiceSeedDefaultsConfig {
  return { ...FACTORY_DEFAULTS };
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}