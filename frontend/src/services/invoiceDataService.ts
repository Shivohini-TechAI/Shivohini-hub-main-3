import type { InvoiceState } from '../store/invoiceStore';
import { calculateInvoiceTotals } from '../utils/invoiceMath';

const API = "/api";

const DRAFT_KEY = 'shivohini-hub:invoiceDraft';
const AUTOSAVE_DELAY = 1000;

let autosaveTimeout: NodeJS.Timeout | null = null;

// 🔥 FIX: never save invoiceId in draft
// so loading draft never reuses an old invoice ID
export function saveDraft(draft: InvoiceState): void {
  try {
    const { invoiceId, ...draftWithoutId } = draft;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithoutId));
  } catch (error) {
    console.error('Failed to save invoice draft:', error);
  }
}

export function loadDraft(): InvoiceState | null {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) return null;
    const draft = JSON.parse(stored);
    // 🔥 Extra safety: strip invoiceId even if somehow stored
    delete draft.invoiceId;
    return draft;
  } catch (error) {
    console.error('Failed to load invoice draft:', error);
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('Failed to clear invoice draft:', error);
  }
}

export function autosaveDraft(draft: InvoiceState): void {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }
  autosaveTimeout = setTimeout(() => {
    saveDraft(draft);
  }, AUTOSAVE_DELAY);
}

export function hasDraft(): boolean {
  try {
    return localStorage.getItem(DRAFT_KEY) !== null;
  } catch {
    return false;
  }
}

export interface SaveInvoiceResult {
  invoiceId: string;
  success: boolean;
  error?: string;
}

export async function saveInvoice(
  invoiceState: InvoiceState & { invoiceId?: string },
  userId: string
): Promise<SaveInvoiceResult> {

  if (!userId) {
    return { invoiceId: '', success: false, error: 'User not authenticated' };
  }

  try {
    const calculations = calculateInvoiceTotals(
      invoiceState.lineItems,
      parseFloat(String(invoiceState.taxRate)) || 0,
      invoiceState.discountType,
      parseFloat(String(invoiceState.discountValue)) || 0
    );

    const payload = {
      // 🔥 only send invoiceId if it exists (for updates)
      // for new invoices this will be undefined → backend creates new
      invoiceId: invoiceState.invoiceId || null,
      number: invoiceState.number,
      issueDate: invoiceState.issueDate,
      dueDate: invoiceState.dueDate,
      currency: invoiceState.currency,

      billFrom: {
        company: invoiceState.billFrom.company,
        email: invoiceState.billFrom.email,
        phone: invoiceState.billFrom.phone,
        address: invoiceState.billFrom.address,
      },

      billTo: {
        name: invoiceState.billTo.name,
        email: invoiceState.billTo.email,
        phone: invoiceState.billTo.phone,
        address: invoiceState.billTo.address,
      },

      lineItems: invoiceState.lineItems,

      taxRate: parseFloat(String(invoiceState.taxRate)) || 0,
      discountType: invoiceState.discountType || null,
      discountValue: parseFloat(String(invoiceState.discountValue)) || 0,

      includeNotes: invoiceState.includeNotes,
      notes: invoiceState.notes,
      includeTerms: invoiceState.includeTerms,
      terms: invoiceState.terms,
      includeSignature: invoiceState.includeSignature,
      signatureUrl: invoiceState.signatureUrl,

      createdBy: userId,

      calculations: {
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxAmount,
        discountAmount: calculations.discountAmount,
        totalDue: calculations.totalDue,
      }
    };

    const res = await fetch(`${API}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save invoice');
    }

    return { invoiceId: data.invoiceId, success: true };

  } catch (error) {
    console.error("SAVE INVOICE ERROR:", error);
    return {
      invoiceId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save invoice',
    };
  }
}