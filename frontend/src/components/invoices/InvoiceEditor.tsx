import React, { useEffect, useState } from 'react';
import { Plus, Trash2, RotateCcw, Download, Copy, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useAuth } from '../../hooks/useAuth';
import { getCurrencySymbol, formatCurrency } from '../../utils/currencyFormatter';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

const InvoiceEditor: React.FC = () => {
  const store = useInvoiceStore();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    store.loadFromDraft();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      store.updateField('signatureUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ================= RESET =================
  const handleResetToNew = async () => {
    if (!window.confirm('Reset invoice and create new one?')) return;
    try {
      await store.resetToNew(user?.id);
      toast.success('New invoice created');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset invoice');
    }
  };

  // ================= DUPLICATE =================
  // 🔥 Now opens a blank duplicate for admin to type invoice number
  const handleDuplicate = async () => {
    if (!window.confirm('Duplicate invoice?')) return;
    try {
      await store.duplicate();
      toast.success('Invoice duplicated — please enter a new invoice number');
    } catch (err) {
      console.error(err);
      toast.error('Failed to duplicate');
    }
  };

  // ================= PDF =================
  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf' });
      await generateInvoicePDF({
        invoiceNumber: store.number,
        clientName: store.billTo.name || 'client',
        currency: store.currency,
      });
      toast.success('PDF downloaded', { id: 'pdf' });
    } catch (err) {
      console.error(err);
      toast.error('PDF generation failed', { id: 'pdf' });
    }
  };

  // ================= SAVE =================
  const handleSaveInvoice = async () => {
    if (!user?.id) {
      toast.error('Login required');
      return;
    }
    if (!store.billTo.name || store.lineItems.length === 0) {
      toast.error('Client name + items required');
      return;
    }
    if (!store.number.trim()) {
      toast.error('Invoice number is required');
      return;
    }
    setIsSaving(true);
    try {
      toast.loading('Saving...', { id: 'save' });
      const result = await store.saveToDB(user.id);
      if (result.success) {
        toast.success('Invoice saved', { id: 'save' });
      } else {
        toast.error(result.error || 'Save failed', { id: 'save' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Save failed', { id: 'save' });
    } finally {
      setIsSaving(false);
    }
  };

  const calculations = store.getCalculations();

  return (
    <div className="h-full overflow-y-auto bg-white border-r border-gray-200">
      <div className="p-6 space-y-6">

        <h2 className="text-2xl font-bold text-gray-900">Invoice Editor</h2>

        {/* ================= META ================= */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">

          {/* 🔥 Invoice number is now manually typed by admin */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={store.number}
              onChange={(e) => store.updateField('number', e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. INV-2026-001"
            />
          </div>

          {/* 🔥 Only Issue Date — Due Date removed from top since it's shown below */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Issue Date</label>
            <input
              type="date"
              value={store.issueDate}
              onChange={(e) => store.updateField('issueDate', e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>

          <div className="flex gap-2">
            {(['INR', 'USD', 'AED'] as const).map((c) => (
              <button
                key={c}
                onClick={() => store.updateField('currency', c)}
                className={`flex-1 p-2 rounded ${
                  store.currency === c ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                {getCurrencySymbol(c)} {c}
              </button>
            ))}
          </div>
        </div>

        {/* ================= BILL TO ================= */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold text-gray-700">Bill To</h3>

          {/* 🔥 Client Name - editable */}
          <input
            type="text"
            value={store.billTo.name}
            onChange={(e) => store.updateBillTo('name', e.target.value)}
            placeholder="Client Name *"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={store.billTo.email}
            onChange={(e) => store.updateBillTo('email', e.target.value)}
            placeholder="Client Email"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={store.billTo.phone}
            onChange={(e) => store.updateBillTo('phone', e.target.value)}
            placeholder="Client Phone"
            className="w-full p-2 border rounded"
          />
          <textarea
            value={store.billTo.address}
            onChange={(e) => store.updateBillTo('address', e.target.value)}
            placeholder="Client Address"
            rows={2}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* ================= BILL FROM ================= */}
        {/* 🔥 Only company name shown, hardcoded, nothing else */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Bill From</h3>
          <p className="text-gray-800 font-medium">Shivohini TechAI LLP</p>
        </div>

        {/* ================= LINE ITEMS ================= */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Items</h3>
            <button
              onClick={store.addLineItem}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          {store.lineItems.map((item) => (
            <div key={item.id} className="border p-3 rounded space-y-2 bg-white">

              {/* 🔥 Item name only - no description */}
              <input
                value={item.name}
                onChange={(e) => store.updateLineItem(item.id, { name: e.target.value })}
                placeholder="Item name"
                className="w-full p-2 border rounded"
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Qty</label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      store.updateLineItem(item.id, { qty: parseInt(e.target.value) || 1 })
                    }
                    className="w-full p-2 border rounded"
                    min={1}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Unit Price</label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      store.updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Total</label>
                  <input
                    readOnly
                    value={(item.qty * item.unitPrice).toFixed(2)}
                    className="w-full p-2 bg-gray-100 rounded"
                  />
                </div>
              </div>

              <button
                onClick={() => store.removeLineItem(item.id)}
                className="text-red-500 flex items-center gap-1 text-sm"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          ))}
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(calculations.subtotal, store.currency)}</span>
          </div>
          {store.taxRate > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({store.taxRate}%)</span>
              <span>{formatCurrency(calculations.taxAmount, store.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(calculations.totalDue, store.currency)}</span>
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="space-y-2">

          <button
            onClick={handleSaveInvoice}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white p-3 rounded flex items-center justify-center gap-2"
          >
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Invoice'}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="w-full bg-green-600 text-white p-3 rounded flex items-center justify-center gap-2"
          >
            <Download size={16} /> Download PDF
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDuplicate}
              className="bg-gray-200 p-2 rounded flex items-center justify-center gap-1 text-sm"
            >
              <Copy size={16} /> Duplicate
            </button>

            <button
              onClick={handleResetToNew}
              className="bg-red-200 p-2 rounded flex items-center justify-center gap-1 text-sm"
            >
              <RotateCcw size={16} /> New
            </button>
          </div>

          <div className="text-xs text-center text-gray-500 flex justify-center gap-1">
            <FileText size={12} /> Autosaved
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceEditor;