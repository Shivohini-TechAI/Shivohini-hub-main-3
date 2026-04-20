import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Calendar, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ClientPaymentsProps {
  projectId: string;
}

const API = "http://localhost:5000";

// 🔥 FIX: return correct currency symbol only
const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'AED': return 'د.إ';
    default: return currency;
  }
};

const ClientPayments: React.FC<ClientPaymentsProps> = ({ projectId }) => {
  const { user } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    amount: 0,
    currency: 'INR',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const canEdit = user?.role === 'admin' || user?.role === 'project_manager';

  // 🔥 Load from backend on mount
  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API}/payments/${projectId}`, { headers });
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch payments error:", err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [projectId]);

  if (user?.role !== 'admin' && user?.role !== 'project_manager') {
    return (
      <div className="text-center py-12 text-gray-500">
        You do not have permission to view client payments.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`${API}/payments/${editingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API}/payments`, {
          method: "POST",
          headers,
          body: JSON.stringify({ projectId, ...formData })
        });
      }
      setFormData({ clientName: '', amount: 0, currency: 'INR', paymentDate: new Date().toISOString().split('T')[0] });
      setEditingId(null);
      setShowForm(false);
      fetchPayments();
    } catch (err) {
      console.error("Save payment error:", err);
    }
  };

  const handleEdit = (payment: any) => {
    setEditingId(payment.id);
    setFormData({
      clientName: payment.client_name,
      amount: payment.amount,
      currency: payment.currency,
      paymentDate: payment.payment_date?.split('T')[0] || payment.payment_date
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this payment?")) return;
    try {
      await fetch(`${API}/payments/${id}`, { method: "DELETE", headers });
      fetchPayments();
    } catch (err) {
      console.error("Delete payment error:", err);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // 🔥 Group totals by currency (no conversion)
  const totalsByCurrency = payments.reduce((acc: any, p: any) => {
    acc[p.currency] = (acc[p.currency] || 0) + parseFloat(p.amount || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Client Payments</h3>
        {canEdit && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ clientName: '', amount: 0, currency: 'INR', paymentDate: new Date().toISOString().split('T')[0] }); }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
          >
            <Plus className="h-4 w-4" /> Add Payment
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <input
            value={formData.clientName}
            onChange={e => setFormData(p => ({ ...p, clientName: e.target.value }))}
            placeholder="Client Name *"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Amount</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.amount}
                onChange={e => setFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Currency</label>
              <select
                value={formData.currency}
                onChange={e => setFormData(p => ({ ...p, currency: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Payment Date</label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={e => setFormData(p => ({ ...p, paymentDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              {editingId ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {payments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <DollarSign className="h-10 w-10 mx-auto mb-2" />
            <p>No payments recorded yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    {canEdit && <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{payment.client_name}</span>
                          </div>
                        </td>
                        {/* 🔥 FIX: show correct currency symbol + exact amount typed */}
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {getCurrencySymbol(payment.currency)}{parseFloat(payment.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{payment.currency}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(payment.payment_date)}
                          </div>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(payment)} className="text-green-600 hover:text-green-800">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(payment.id)} className="text-red-600 hover:text-red-800">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* 🔥 Summary by currency — no conversion */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Summary</p>
              <div className="flex flex-wrap gap-4">
                {Object.entries(totalsByCurrency).map(([currency, total]: any) => (
                  <div key={currency} className="text-center">
                    <p className="text-base font-bold text-gray-900">
                      {getCurrencySymbol(currency)}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">{currency}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientPayments;