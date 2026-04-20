import React, { useEffect, useState } from 'react';
import { Eye, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { fetchUserInvoices, fetchInvoiceById, InvoiceListItem } from '../../services/invoiceListService';
import { formatCurrency } from '../../utils/currencyFormatter';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { useInvoiceStore } from '../../store/invoiceStore';
import dayjs from 'dayjs';

interface InvoiceRecordsProps {
  refreshTrigger?: number;
  onSwitchToPreview?: () => void;
}

const InvoiceRecords: React.FC<InvoiceRecordsProps> = ({ refreshTrigger, onSwitchToPreview }) => {
  const { user } = useAuth();
  const loadInvoice = useInvoiceStore((state) => state.loadInvoice);

  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadInvoices = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserInvoices(user.id);
      setInvoices(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [user?.id, refreshTrigger]);

  const formatDate = (date: string) => dayjs(date).format('DD MMM YYYY');

  const filteredInvoices = invoices.filter(inv =>
    inv.bill_to_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenInvoice = async (invoice: InvoiceListItem) => {
    if (!user?.id) return;
    setProcessingId(invoice.id);
    try {
      toast.loading('Loading invoice...', { id: 'open' });
      const fullInvoice = await fetchInvoiceById(invoice.id, user.id);
      loadInvoice(fullInvoice);
      toast.success('Invoice loaded', { id: 'open' });
      onSwitchToPreview?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoice', { id: 'open' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadPDF = async (invoice: InvoiceListItem) => {
    if (!user?.id) return;
    setProcessingId(invoice.id);
    try {
      toast.loading('Preparing PDF...', { id: 'pdf' });

      // 1️⃣ Fetch full invoice
      const fullInvoice = await fetchInvoiceById(invoice.id, user.id);

      // 2️⃣ Load into store
      loadInvoice(fullInvoice);

      // 3️⃣ Switch to Preview tab so invoice-preview element mounts in DOM
      onSwitchToPreview?.();

      // 4️⃣ Wait longer for DOM to fully render the preview element
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 5️⃣ Check if element exists before generating
      const el = document.getElementById('invoice-preview');
      if (!el) {
        toast.error('Preview not ready. Please try again.', { id: 'pdf' });
        return;
      }

      // 6️⃣ Generate PDF
      await generateInvoicePDF({
        invoiceNumber: fullInvoice.number,
        clientName: fullInvoice.bill_to_name || 'client',
        currency: fullInvoice.currency,
      });

      toast.success('PDF downloaded', { id: 'pdf' });

    } catch (err) {
      console.error(err);
      toast.error('PDF failed', { id: 'pdf' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 mb-3">{error}</p>
        <button onClick={loadInvoices} className="bg-blue-600 text-white px-4 py-2 rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by client name or invoice number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
        />
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center p-6 text-gray-500">
          {invoices.length === 0 ? 'No invoices found' : 'No results match your search'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm">Invoice #</th>
                <th className="p-3 text-left text-sm">Client</th>
                <th className="p-3 text-center text-sm">Issue Date</th>
                <th className="p-3 text-center text-sm">Currency</th>
                <th className="p-3 text-right text-sm">Amount</th>
                <th className="p-3 text-center text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium text-sm">{inv.number}</td>
                  <td className="p-3 text-sm">{inv.bill_to_name}</td>
                  <td className="p-3 text-center text-sm">{formatDate(inv.issue_date)}</td>
                  <td className="p-3 text-center text-sm">{inv.currency}</td>
                  <td className="p-3 text-right font-semibold text-sm">
                    {formatCurrency(inv.total_due, inv.currency as any)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenInvoice(inv)}
                        disabled={processingId === inv.id}
                        title="Open Invoice"
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        <Eye size={14} /> Open
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(inv)}
                        disabled={processingId === inv.id}
                        title="Download PDF"
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        <Download size={14} /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceRecords;