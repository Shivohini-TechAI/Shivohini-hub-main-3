// ❌ REMOVE THIS (no more supabase)
// import {} from '../lib/api';

import type { InvoiceState } from '../store/invoiceStore';
import { calculateInvoiceTotals } from '../utils/invoiceMath';

const API = "http://localhost:5001";

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
    return {
      invoiceId: '',
      success: false,
      error: 'User not authenticated',
    };
  }

  try {
    const calculations = calculateInvoiceTotals(
      invoiceState.lineItems,
      invoiceState.taxRate,
      invoiceState.discountType,
      invoiceState.discountValue
    );

    const payload = {
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

      taxRate: invoiceState.taxRate,
      discountType: invoiceState.discountType || null,
      discountValue: invoiceState.discountValue,

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save invoice');
    }

    return {
      invoiceId: data.invoiceId,
      success: true,
    };

  } catch (error) {
    console.error("SAVE INVOICE ERROR:", error);

    return {
      invoiceId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save invoice',
    };
  }
}