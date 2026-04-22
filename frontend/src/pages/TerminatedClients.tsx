import React, { useEffect, useState } from 'react';
import { Search, Trash2, RotateCcw } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  source?: string;
  requirement?: string;
  project_topic?: string;
  is_terminated: boolean;
  terminated_at?: string;
  terminated_reason?: string;
}

const API = "http://localhost:5001";

const TerminatedClients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  // ================= LOAD =================
  const loadClients = async () => {
    try {
      const res = await fetch(`${API}/clients/terminated`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch terminated clients");

      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error("LOAD TERMINATED ERROR:", err);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // ================= FILTER =================
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ================= RECOVER =================
  const handleRecover = async (id: string) => {
    try {
      await fetch(`${API}/clients/${id}/recover`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadClients();
    } catch (err) {
      console.error("RECOVER ERROR:", err);
    }
  };

  // ================= DELETE PERMANENT =================
  const handleDeletePermanent = async (id: string) => {
    try {
      await fetch(`${API}/clients/${id}/permanent`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfirmDeleteId(null);
      loadClients();
    } catch (err) {
      console.error("DELETE ERROR:", err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    return new Date(utcString).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // ================= UI =================
  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold">Terminated Clients</h1>
        <p className="text-gray-500">Restore or permanently delete terminated clients</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 border p-2 w-full rounded"
        />
      </div>

      {filteredClients.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No terminated clients</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white shadow p-4 rounded space-y-2 border border-red-100">

              <h3 className="font-semibold text-lg">{client.name}</h3>

              {client.phone && <p className="text-sm">📞 {client.phone}</p>}
              {client.email && <p className="text-sm">✉️ {client.email}</p>}
              {client.project_topic && <p className="text-sm">📋 {client.project_topic}</p>}
              {client.location && <p className="text-sm">📍 {client.location}</p>}

              {/* 🔥 Show termination reason */}
              {client.terminated_reason && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mt-1">
                  <p className="text-xs font-semibold text-red-600">Reason for termination:</p>
                  <p className="text-sm text-red-700">{client.terminated_reason}</p>
                </div>
              )}

              {client.terminated_at && (
                <p className="text-xs text-gray-400">
                  Terminated on: {formatDate(client.terminated_at)}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleRecover(client.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>

                <button
                  onClick={() => setConfirmDeleteId(client.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                >
                  <Trash2 size={14} />
                  Delete Permanently
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CONFIRM PERMANENT DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-80 space-y-4">
            <h2 className="text-lg font-bold text-red-600">Delete Permanently?</h2>
            <p className="text-sm text-gray-600">
              This action <strong>cannot be undone</strong>. The client and all their data will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="border px-4 py-2 rounded w-full"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePermanent(confirmDeleteId)}
                className="bg-red-600 text-white px-4 py-2 rounded w-full"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TerminatedClients;