import {} from '../lib/api';

export interface InvoiceListItem {
  id: string;
  number: string;
  bill_to_name: string;
  issue_date: string;
  due_date: string;
  currency: string;
  total_due: number;
  created_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  name: string;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface FullInvoice {
  id: string;
  number: string;
  issue_date: string;
  due_date: string;
  currency: 'INR' | 'USD' | 'AED';
  bill_from_company: string;
  bill_from_email: string;
  bill_from_phone: string;
  bill_from_address: string;
  bill_to_name: string;
  bill_to_email: string;
  bill_to_phone: string;
  bill_to_address: string;
  tax_rate: number;
  discount_type?: 'flat' | 'percent';
  discount_value: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_due: number;
  include_notes: boolean;
  notes: string;
  include_terms: boolean;
  terms: string;
  include_signature: boolean;
  signature_url: string;
  created_by: string;
  created_at: string;
  lineItems: InvoiceLineItem[];
}

export async function fetchUserInvoices(userId: string): Promise<InvoiceListItem[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, number, bill_to_name, issue_date, due_date, currency, total_due, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    throw error;
  }
}

export async function fetchInvoiceById(invoiceId: string, userId: string): Promise<FullInvoice> {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('created_by', userId)
      .single();

    if (invoiceError) {
      console.error('Error fetching invoice:', invoiceError);
      throw invoiceError;
    }

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id', { ascending: true });

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
      throw lineItemsError;
    }

    return {
      id: invoice.id,
      number: invoice.number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      currency: invoice.currency,
      bill_from_company: invoice.bill_from_company,
      bill_from_email: invoice.bill_from_email,
      bill_from_phone: invoice.bill_from_phone,
      bill_from_address: invoice.bill_from_address,
      bill_to_name: invoice.bill_to_name,
      bill_to_email: invoice.bill_to_email,
      bill_to_phone: invoice.bill_to_phone,
      bill_to_address: invoice.bill_to_address,
      tax_rate: invoice.tax_rate,
      discount_type: invoice.discount_type,
      discount_value: invoice.discount_value,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      discount_amount: invoice.discount_amount,
      total_due: invoice.total_due,
      include_notes: invoice.include_notes,
      notes: invoice.notes,
      include_terms: invoice.include_terms,
      terms: invoice.terms,
      include_signature: invoice.include_signature,
      signature_url: invoice.signature_url,
      created_by: invoice.created_by,
      created_at: invoice.created_at,
      lineItems: (lineItems || []).map(item => ({
        id: item.id,
        invoice_id: item.invoice_id,
        name: item.name,
        description: item.description,
        qty: item.qty,
        unit_price: item.unit_price,
        line_total: item.line_total,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch invoice by ID:', error);
    throw error;
  }
}
