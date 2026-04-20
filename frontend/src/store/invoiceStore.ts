import { create } from 'zustand';
import { autosaveDraft, loadDraft, clearDraft } from '../services/invoiceDataService';
import { calculateInvoiceTotals, InvoiceCalculations } from '../utils/invoiceMath';
import { loadActivePreset, type InvoiceSeedDefaultsConfig } from '../services/invoiceSeedDefaultsService';
import { saveInvoice, type SaveInvoiceResult } from '../services/invoiceSaveService';

export interface LineItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface BillFrom {
  company: string;
  email: string;
  phone: string;
  address: string;
}

export interface BillTo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceState {
  invoiceId?: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: 'INR' | 'USD' | 'AED';
  billFrom: BillFrom;
  billTo: BillTo;
  lineItems: LineItem[];
  taxRate: number;
  discountType?: 'flat' | 'percent';
  discountValue: number;
  includeNotes: boolean;
  notes: string;
  includeTerms: boolean;
  terms: string;
  includeSignature: boolean;
  signatureUrl: string;
}

interface InvoiceStore extends InvoiceState {
  updateField: <K extends keyof InvoiceState>(field: K, value: InvoiceState[K]) => void;
  updateBillFrom: <K extends keyof BillFrom>(field: K, value: BillFrom[K]) => void;
  updateBillTo: <K extends keyof BillTo>(field: K, value: BillTo[K]) => void;
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, updates: Partial<LineItem>) => void;
  reorderLineItems: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
  resetToNew: (userId?: string) => Promise<void>;
  duplicate: () => Promise<void>;
  loadFromDraft: () => void;
  loadInvoice: (invoice: any) => void;
  getCalculations: () => InvoiceCalculations;
  applySeedDefaults: (defaults: InvoiceSeedDefaultsConfig) => void;
  saveToDB: (userId: string) => Promise<SaveInvoiceResult>;
}

function toDateString(value: string | undefined): string {
  if (!value) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {}
  return new Date().toISOString().split('T')[0];
}

function getInitialState(defaults?: InvoiceSeedDefaultsConfig): InvoiceState {
  const today = new Date();
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    invoiceId: undefined, // 🔥 always undefined for new invoices
    number: '',
    issueDate: today.toISOString().split('T')[0],
    dueDate: sevenDaysLater.toISOString().split('T')[0],
    currency: defaults?.defaultCurrency || 'INR',
    billFrom: {
      company: 'Shivohini TechAI LLP',
      email: '',
      phone: '',
      address: '',
    },
    billTo: { name: '', email: '', phone: '', address: '' },
    lineItems: [
      { id: Date.now().toString(), name: '', description: '', qty: 1, unitPrice: 0 },
    ],
    taxRate: defaults?.defaultTaxRate ?? 6,
    discountType: defaults?.defaultDiscountType,
    discountValue: defaults?.defaultDiscountValue ?? 0,
    includeNotes: defaults?.includeNotesByDefault ?? false,
    notes: defaults?.defaultNotes || '',
    includeTerms: defaults?.includeTermsByDefault ?? false,
    terms: defaults?.defaultTerms || '',
    includeSignature: defaults?.includeSignatureByDefault ?? false,
    signatureUrl: '',
  };
}

const initialState = getInitialState();

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({

  ...initialState,

  updateField: (field, value) => {
    set({ [field]: value });
    autosaveDraft(get());
  },

  updateBillFrom: (field, value) => {
    set((state) => ({ billFrom: { ...state.billFrom, [field]: value } }));
    autosaveDraft(get());
  },

  updateBillTo: (field, value) => {
    set((state) => ({ billTo: { ...state.billTo, [field]: value } }));
    autosaveDraft(get());
  },

  addLineItem: () => {
    set((state) => ({
      lineItems: [
        ...state.lineItems,
        { id: Date.now().toString(), name: '', description: '', qty: 1, unitPrice: 0 },
      ],
    }));
    autosaveDraft(get());
  },

  removeLineItem: (id) => {
    set((state) => ({
      lineItems: state.lineItems.filter((item) => item.id !== id),
    }));
    autosaveDraft(get());
  },

  updateLineItem: (id, updates) => {
    set((state) => ({
      lineItems: state.lineItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
    autosaveDraft(get());
  },

  reorderLineItems: (fromIndex, toIndex) => {
    set((state) => {
      const items = [...state.lineItems];
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      return { lineItems: items };
    });
    autosaveDraft(get());
  },

  reset: () => set(initialState),

  // 🔥 Always clear invoiceId so next save creates new record
  resetToNew: async (userId?: string) => {
    let defaults: InvoiceSeedDefaultsConfig | undefined;
    if (userId) {
      try {
        defaults = await loadActivePreset(userId);
      } catch (error) {
        console.error('Seed defaults error:', error);
      }
    }
    set({ ...getInitialState(defaults), invoiceId: undefined, number: '' });
    clearDraft();
  },

  // 🔥 Duplicate clears invoiceId so it saves as new
  duplicate: async () => {
    const currentState = get();
    const today = new Date();
    set({
      ...currentState,
      invoiceId: undefined, // 🔥 must be cleared
      number: '',
      issueDate: today.toISOString().split('T')[0],
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    autosaveDraft(get());
  },

  applySeedDefaults: (defaults: InvoiceSeedDefaultsConfig) => {
    set(() => ({
      currency: defaults.defaultCurrency,
      billFrom: { company: 'Shivohini TechAI LLP', email: '', phone: '', address: '' },
      taxRate: defaults.defaultTaxRate,
      discountType: defaults.defaultDiscountType,
      discountValue: defaults.defaultDiscountValue ?? 0,
      includeNotes: defaults.includeNotesByDefault,
      notes: defaults.defaultNotes,
      includeTerms: defaults.includeTermsByDefault,
      terms: defaults.defaultTerms,
      includeSignature: defaults.includeSignatureByDefault,
    }));
    autosaveDraft(get());
  },

  loadFromDraft: () => {
    const draft = loadDraft();
    if (draft) {
      set({
        ...draft,
        issueDate: toDateString(draft.issueDate),
        dueDate: toDateString(draft.dueDate),
        taxRate: parseFloat(String(draft.taxRate)) || 0,
        discountValue: parseFloat(String(draft.discountValue)) || 0,
      });
    }
  },

  loadInvoice: (invoice: any) => {
    set({
      invoiceId: invoice.id,
      number: invoice.number,
      issueDate: toDateString(invoice.issue_date),
      dueDate: toDateString(invoice.due_date),
      currency: invoice.currency,
      billFrom: { company: 'Shivohini TechAI LLP', email: '', phone: '', address: '' },
      billTo: {
        name: invoice.bill_to_name,
        email: invoice.bill_to_email,
        phone: invoice.bill_to_phone,
        address: invoice.bill_to_address,
      },
      lineItems: invoice.lineItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        qty: parseFloat(String(item.qty)) || 1,
        unitPrice: parseFloat(String(item.unit_price)) || 0,
      })),
      taxRate: parseFloat(String(invoice.tax_rate)) || 0,
      discountType: invoice.discount_type,
      discountValue: parseFloat(String(invoice.discount_value)) || 0,
      includeNotes: invoice.include_notes,
      notes: invoice.notes,
      includeTerms: invoice.include_terms,
      terms: invoice.terms,
      includeSignature: invoice.include_signature,
      signatureUrl: invoice.signature_url,
    });
    autosaveDraft(get());
  },

  getCalculations: () => {
    const state = get();
    return calculateInvoiceTotals(
      state.lineItems,
      parseFloat(String(state.taxRate)) || 0,
      state.discountType,
      parseFloat(String(state.discountValue)) || 0
    );
  },

  // 🔥 KEY FIX: after saving, store invoiceId for updates
  // but when user clicks "New" it gets cleared
  saveToDB: async (userId: string) => {
    const state = get();
    const result = await saveInvoice({ ...state }, userId);
    if (result.success && result.invoiceId) {
      set({ invoiceId: result.invoiceId });
    }
    return result;
  },

}));