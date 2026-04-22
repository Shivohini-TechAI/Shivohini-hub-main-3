import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface CostingTableProps {
  projectId: string;
}

const API = "http://localhost:5001";

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return currency;
  }
};

const CostingTable: React.FC<CostingTableProps> = ({ projectId }) => {
  const { user } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productService: '',
    quantity: 1,
    currency: 'INR',
    amount: 0,
    comment: ''
  });

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const canEdit =
    user?.role === 'admin' ||
    user?.role === 'project_manager' ||
    user?.role === 'team_leader';

  // 🔥 Load from backend on mount
  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/costing/${projectId}`, { headers });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch costing error:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`${API}/costing/${editingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API}/costing`, {
          method: "POST",
          headers,
          body: JSON.stringify({ projectId, ...formData })
        });
      }
      setFormData({ productService: '', quantity: 1, currency: 'INR', amount: 0, comment: '' });
      setEditingId(null);
      setShowForm(false);
      fetchItems();
    } catch (err) {
      console.error("Save costing error:", err);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      productService: item.product_service,
      quantity: item.quantity,
      currency: item.currency,
      amount: item.amount,
      comment: item.comment || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await fetch(`${API}/costing/${id}`, { method: "DELETE", headers });
      fetchItems();
    } catch (err) {
      console.error("Delete costing error:", err);
    }
  };

  const total = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Costing</h3>
        {canEdit && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ productService: '', quantity: 1, currency: 'INR', amount: 0, comment: '' }); }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <input
            value={formData.productService}
            onChange={e => setFormData(p => ({ ...p, productService: e.target.value }))}
            placeholder="Product / Service *"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
              <input
                type="number" min="1"
                value={formData.quantity}
                onChange={e => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Currency</label>
              <select
                value={formData.currency}
                onChange={e => setFormData(p => ({ ...p, currency: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Amount</label>
              <input
                type="number" min="0" step="0.01"
                value={formData.amount}
                onChange={e => setFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <textarea
            value={formData.comment}
            onChange={e => setFormData(p => ({ ...p, comment: e.target.value }))}
            placeholder="Comment (optional)"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
              {editingId ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <DollarSign className="h-10 w-10 mx-auto mb-2" />
            <p>No costing items yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product/Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                    {canEdit && <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.product_service}</td>
                      <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-700">{item.currency}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {getCurrencySymbol(item.currency)}{parseFloat(item.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.comment || '—'}</td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(item)} className="text-purple-600 hover:text-purple-800">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
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
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Total Items: {items.length}</span>
              <span className="text-sm font-bold text-gray-900">
                Note: Mixed currencies — see individual rows
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CostingTable;