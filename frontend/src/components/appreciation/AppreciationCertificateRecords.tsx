import React, { useEffect, useState } from "react";
import { Eye, Edit2, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getAppreciationCertificates,
  updateAppreciationCertificate,
  deleteAppreciationCertificate
} from "../../services/appreciationCertificates";

interface Certificate {
  id: string;
  recipient_name: string;
  designation: string;
  appreciation_for: string;
  issue_date: string;
  joining_date: string;
}

interface AppreciationCertificateRecordsProps {
  onView?: (cert: Certificate) => void;
}

const AppreciationCertificateRecords: React.FC<AppreciationCertificateRecordsProps> = ({ onView }) => {
  const [data, setData] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [editForm, setEditForm] = useState<Omit<Certificate, 'id'>>({
    recipient_name: '',
    designation: '',
    appreciation_for: '',
    issue_date: '',
    joining_date: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // View modal state
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getAppreciationCertificates();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  // ================= VIEW =================
  const handleView = (cert: Certificate) => {
    if (onView) {
      onView(cert);
    } else {
      setViewingCert(cert);
    }
  };

  // ================= EDIT =================
  const handleEditOpen = (cert: Certificate) => {
    setEditingCert(cert);
    setEditForm({
      recipient_name: cert.recipient_name,
      designation: cert.designation || '',
      appreciation_for: cert.appreciation_for,
      issue_date: cert.issue_date?.split('T')[0] || '',
      joining_date: cert.joining_date?.split('T')[0] || ''
    });
  };

  const handleEditSave = async () => {
    if (!editingCert) return;
    if (!editForm.recipient_name || !editForm.appreciation_for) {
      toast.error("Recipient name and appreciation reason are required");
      return;
    }

    setIsSaving(true);
    try {
      await updateAppreciationCertificate(editingCert.id, {
        recipient_name: editForm.recipient_name,
        designation: editForm.designation || null,
        appreciation_for: editForm.appreciation_for,
        issue_date: editForm.issue_date || null,
        joining_date: editForm.joining_date || null
      });
      toast.success("Certificate updated successfully");
      setEditingCert(null);
      fetchData();
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      toast.error("Failed to update certificate");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the certificate for "${name}"? This cannot be undone.`)) return;

    try {
      await deleteAppreciationCertificate(id);
      toast.success("Certificate deleted");
      fetchData();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error("Failed to delete certificate");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-base font-medium">No certificates found</p>
          <p className="text-sm mt-1">Save a certificate to see it here</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(cert => (
              <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{cert.recipient_name}</td>
                <td className="px-4 py-3 text-gray-500">{cert.designation || '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{cert.appreciation_for}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(cert.issue_date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">

                    {/* VIEW */}
                    <button
                      onClick={() => handleView(cert)}
                      title="View"
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* EDIT */}
                    <button
                      onClick={() => handleEditOpen(cert)}
                      title="Edit"
                      className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => handleDelete(cert.id, cert.recipient_name)}
                      title="Delete"
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= VIEW MODAL ================= */}
      {viewingCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Certificate Details</h2>
              <button onClick={() => setViewingCert(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Recipient Name</p>
                <p className="text-gray-900 font-medium">{viewingCert.recipient_name}</p>
              </div>
              {viewingCert.designation && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Designation</p>
                  <p className="text-gray-900">{viewingCert.designation}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Appreciation For</p>
                <p className="text-gray-900">{viewingCert.appreciation_for}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Issue Date</p>
                  <p className="text-gray-900">{formatDate(viewingCert.issue_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Joining Date</p>
                  <p className="text-gray-900">{formatDate(viewingCert.joining_date)}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setViewingCert(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editingCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit Certificate</h2>
              <button onClick={() => setEditingCert(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.recipient_name}
                  onChange={e => setEditForm(p => ({ ...p, recipient_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={e => setEditForm(p => ({ ...p, designation: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appreciation For <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editForm.appreciation_for}
                  onChange={e => setEditForm(p => ({ ...p, appreciation_for: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={editForm.issue_date}
                    onChange={e => setEditForm(p => ({ ...p, issue_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={editForm.joining_date}
                    onChange={e => setEditForm(p => ({ ...p, joining_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setEditingCert(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppreciationCertificateRecords;