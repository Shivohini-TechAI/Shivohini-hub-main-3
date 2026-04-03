import { supabase } from '../lib/supabase';
import type { InvoiceState, LineItem } from '../store/invoiceStore';
import { calculateInvoiceTotals } from '../utils/invoiceMath';

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

    const isUpdate = !!invoiceState.invoiceId;

    if (isUpdate) {
      return await updateInvoice(invoiceState, userId, calculations);
    } else {
      return await createInvoice(invoiceState, userId, calculations);
    }
  } catch (error) {
    console.error('Error saving invoice:', error);
    return {
      invoiceId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save invoice',
    };
  }
}

async function createInvoice(
  invoiceState: InvoiceState & { invoiceId?: string },
  userId: string,
  calculations: ReturnType<typeof calculateInvoiceTotals>
): Promise<SaveInvoiceResult> {
  const invoiceData = {
    number: invoiceState.number,
    issue_date: invoiceState.issueDate,
    due_date: invoiceState.dueDate,
    currency: invoiceState.currency,
    bill_from_company: invoiceState.billFrom.company,
    bill_from_email: invoiceState.billFrom.email,
    bill_from_phone: invoiceState.billFrom.phone,
    bill_from_address: invoiceState.billFrom.address,
    bill_to_name: invoiceState.billTo.name,
    bill_to_email: invoiceState.billTo.email,
    bill_to_phone: invoiceState.billTo.phone,
    bill_to_address: invoiceState.billTo.address,
    tax_rate: invoiceState.taxRate,
    discount_type: invoiceState.discountType || null,
    discount_value: invoiceState.discountValue,
    subtotal: calculations.subtotal,
    tax_amount: calculations.taxAmount,
    discount_amount: calculations.discountAmount,
    total_due: calculations.totalDue,
    include_notes: invoiceState.includeNotes,
    notes: invoiceState.notes,
    include_terms: invoiceState.includeTerms,
    terms: invoiceState.terms,
    include_signature: invoiceState.includeSignature,
    signature_url: invoiceState.signatureUrl,
    created_by: userId,
  };

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select()
    .single();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (!invoice) {
    throw new Error('Failed to create invoice');
  }

  // Insert line items
  if (invoiceState.lineItems.length > 0) {
    const lineItemsData = invoiceState.lineItems.map((item) => ({
      invoice_id: invoice.id,
      name: item.name,
      description: item.description,
      qty: item.qty,
      unit_price: item.unitPrice,
      line_total: item.qty * item.unitPrice,
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsData);

    if (lineItemsError) {
      throw new Error(lineItemsError.message);
    }
  }

  return {
    invoiceId: invoice.id,
    success: true,
  };
}

async function updateInvoice(
  invoiceState: InvoiceState & { invoiceId?: string },
  userId: string,
  calculations: ReturnType<typeof calculateInvoiceTotals>
): Promise<SaveInvoiceResult> {
  const invoiceId = invoiceState.invoiceId!;

  const invoiceData = {
    number: invoiceState.number,
    issue_date: invoiceState.issueDate,
    due_date: invoiceState.dueDate,
    currency: invoiceState.currency,
    bill_from_company: invoiceState.billFrom.company,
    bill_from_email: invoiceState.billFrom.email,
    bill_from_phone: invoiceState.billFrom.phone,
    bill_from_address: invoiceState.billFrom.address,
    bill_to_name: invoiceState.billTo.name,
    bill_to_email: invoiceState.billTo.email,
    bill_to_phone: invoiceState.billTo.phone,
    bill_to_address: invoiceState.billTo.address,
    tax_rate: invoiceState.taxRate,
    discount_type: invoiceState.discountType || null,
    discount_value: invoiceState.discountValue,
    subtotal: calculations.subtotal,
    tax_amount: calculations.taxAmount,
    discount_amount: calculations.discountAmount,
    total_due: calculations.totalDue,
    include_notes: invoiceState.includeNotes,
    notes: invoiceState.notes,
    include_terms: invoiceState.includeTerms,
    terms: invoiceState.terms,
    include_signature: invoiceState.includeSignature,
    signature_url: invoiceState.signatureUrl,
  };

  const { error: updateError } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', invoiceId)
    .eq('created_by', userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Delete existing line items
  const { error: deleteError } = await supabase
    .from('invoice_line_items')
    .delete()
    .eq('invoice_id', invoiceId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  // Insert new line items
  if (invoiceState.lineItems.length > 0) {
    const lineItemsData = invoiceState.lineItems.map((item) => ({
      invoice_id: invoiceId,
      name: item.name,
      description: item.description,
      qty: item.qty,
      unit_price: item.unitPrice,
      line_total: item.qty * item.unitPrice,
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsData);

    if (lineItemsError) {
      throw new Error(lineItemsError.message);
    }
  }

  return {
    invoiceId,
    success: true,
  };
}
