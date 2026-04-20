import React, { useRef } from 'react';
import { useInvoiceStore } from '../../store/invoiceStore';
import { formatCurrency } from '../../utils/currencyFormatter';
import dayjs from 'dayjs';

const InvoicePreview: React.FC = () => {
  const store = useInvoiceStore();
  const calculations = store.getCalculations();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, store.currency, { showSymbol: false });
  };

  // 🔥 FIX: safely parse taxRate to number to avoid .toFixed crash
  const taxRate = parseFloat(String(store.taxRate)) || 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      <div className="p-8">
        <div
          ref={invoiceRef}
          id="invoice-preview"
          className="max-w-4xl mx-auto bg-white shadow-2xl"
          style={{ width: '210mm', minHeight: '297mm' }}
        >
          {/* Header */}
          <div style={{ backgroundColor: '#0B2D5B' }} className="px-12 py-8 flex items-center justify-between">
            <div className="flex-shrink-0">
              <h1
                style={{ color: '#F2C01A', fontSize: '48px', fontWeight: 'bold', letterSpacing: '0.05em' }}
                className="leading-none mb-4"
              >
                INVOICE
              </h1>
              <div className="space-y-1 text-white text-sm">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300">Invoice #:</span>
                  <span className="font-semibold">{store.number || '-'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300">Invoice Date:</span>
                  <span className="font-semibold">{formatDate(store.issueDate)}</span>
                </div>
                {store.dueDate && (
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-300">Due Date:</span>
                    <span className="font-semibold">{formatDate(store.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src={`${window.location.origin}/Logo_withoutBG.png`}
                alt="Shivohini TechAI"
                className="h-48 w-auto"
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Cyan accent bar */}
          <div style={{ backgroundColor: '#6FE9E8', height: '8px' }}></div>

          {/* Bill To / Bill From */}
          <div className="px-12 py-8 grid grid-cols-2 gap-12">
            <div>
              <h3
                style={{ color: '#0B2D5B', fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em' }}
                className="mb-3 uppercase"
              >
                Bill To:
              </h3>
              <div style={{ color: '#101828' }} className="space-y-1 text-sm">
                <p className="font-semibold text-base">{store.billTo.name || 'Client Name'}</p>
                {store.billTo.address && (
                  <p className="text-gray-600 whitespace-pre-line">{store.billTo.address}</p>
                )}
                {store.billTo.email && <p className="text-gray-600">{store.billTo.email}</p>}
                {store.billTo.phone && <p className="text-gray-600">{store.billTo.phone}</p>}
              </div>
            </div>

            <div>
              <h3
                style={{ color: '#0B2D5B', fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em' }}
                className="mb-3 uppercase"
              >
                Bill From:
              </h3>
              <div style={{ color: '#101828' }} className="space-y-1 text-sm">
                <p className="font-semibold text-base">Shivohini TechAI LLP</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-12 pb-8">
            <table className="w-full border-collapse" style={{ border: '1px solid #E5E7EB' }}>
              <thead>
                <tr style={{ backgroundColor: '#0B2D5B' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border border-gray-300" style={{ width: '40%' }}>
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider border border-gray-300" style={{ width: '20%' }}>
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider border border-gray-300" style={{ width: '20%' }}>
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider border border-gray-300" style={{ width: '20%' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {store.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm border border-gray-300" style={{ color: '#101828' }}>
                      {item.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right border border-gray-300" style={{ color: '#101828' }}>
                      {formatAmount(parseFloat(String(item.unitPrice)) || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right border border-gray-300" style={{ color: '#101828' }}>
                      {item.qty}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right border border-gray-300" style={{ color: '#101828' }}>
                      {formatAmount((parseFloat(String(item.qty)) || 0) * (parseFloat(String(item.unitPrice)) || 0))}
                    </td>
                  </tr>
                ))}
                {[...Array(Math.max(0, 5 - store.lineItems.length))].map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="px-4 py-3 text-sm border border-gray-300" style={{ height: '45px' }}>&nbsp;</td>
                    <td className="px-4 py-3 text-sm border border-gray-300">&nbsp;</td>
                    <td className="px-4 py-3 text-sm border border-gray-300">&nbsp;</td>
                    <td className="px-4 py-3 text-sm border border-gray-300">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="border-2" style={{ borderColor: '#0B2D5B', width: '320px' }}>
                <div className="flex justify-between px-4 py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
                  <span className="text-sm font-medium" style={{ color: '#101828' }}>Subtotal:</span>
                  <span className="text-sm font-semibold" style={{ color: '#101828' }}>
                    {formatAmount(calculations.subtotal)}
                  </span>
                </div>

                {store.discountType && (parseFloat(String(store.discountValue)) || 0) > 0 && (
                  <div className="flex justify-between px-4 py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
                    <span className="text-sm font-medium" style={{ color: '#101828' }}>
                      Discount {store.discountType === 'percent' ? `(${store.discountValue}%)` : ''}:
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      -{formatAmount(calculations.discountAmount)}
                    </span>
                  </div>
                )}

                {/* 🔥 FIX: use parsed taxRate safely */}
                {taxRate > 0 && (
                  <div className="flex justify-between px-4 py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
                    <span className="text-sm font-medium" style={{ color: '#101828' }}>
                      Tax ({taxRate.toFixed(2)}%):
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#101828' }}>
                      {formatAmount(calculations.taxAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between px-4 py-3" style={{ backgroundColor: '#0B2D5B' }}>
                  <span className="text-base font-bold" style={{ color: '#F2C01A' }}>Amount Due:</span>
                  <span className="text-base font-bold text-white">
                    {store.currency} {formatAmount(calculations.totalDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {store.includeNotes && store.notes && (
            <div className="px-12 py-6 border-t" style={{ borderColor: '#E5E7EB' }}>
              <h3
                style={{ color: '#0B2D5B', fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em' }}
                className="mb-3 uppercase"
              >
                Notes:
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{store.notes}</p>
            </div>
          )}

          {/* Terms */}
          {store.includeTerms && store.terms && (
            <div className="px-12 py-6 border-t" style={{ borderColor: '#E5E7EB' }}>
              <h3
                style={{ color: '#0B2D5B', fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em' }}
                className="mb-3 uppercase"
              >
                Terms & Conditions:
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{store.terms}</p>
            </div>
          )}

          {/* Signature */}
          <div className="px-12 py-8 border-t" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex justify-end">
              <div className="flex flex-col items-end" style={{ width: '320px' }}>
                {store.includeSignature && store.signatureUrl ? (
                  <>
                    <img src={store.signatureUrl} alt="Signature" className="h-20 object-contain mb-2" />
                    <div className="border-t-2 border-gray-800 w-full mb-1"></div>
                    <p className="text-sm text-gray-600">Authorized Signature</p>
                  </>
                ) : (
                  <>
                    <div className="border-t-2 border-gray-800 w-full mb-1"></div>
                    <p className="text-sm text-gray-600">Signature</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ backgroundColor: '#0B2D5B', height: '40px' }} className="flex items-center justify-center">
            <p className="text-white text-sm">Thank you for your business!</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;