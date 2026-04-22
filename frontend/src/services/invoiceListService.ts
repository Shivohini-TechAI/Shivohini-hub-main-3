const API = "http://localhost:5001";

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

// ================= FETCH ALL =================
export async function fetchUserInvoices(userId: string): Promise<InvoiceListItem[]> {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/invoices?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch invoices");
    }

    const data = await res.json();

    // 🔥 FIXED: ensure always array
    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error("FETCH USER INVOICES ERROR:", error);
    throw error;
  }
}

// ================= FETCH ONE =================
export async function fetchInvoiceById(
  invoiceId: string,
  userId: string
): Promise<FullInvoice> {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/invoices/${invoiceId}?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch invoice");
    }

    const invoice = await res.json();
    return invoice;

  } catch (error) {
    console.error("FETCH INVOICE BY ID ERROR:", error);
    throw error;
  }
}