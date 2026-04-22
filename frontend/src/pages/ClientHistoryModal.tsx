import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Props {
  clientId: string;
  onClose: () => void;
}

const API = "/api";

const ClientHistoryModal: React.FC<Props> = ({ clientId, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [note, setNote] = useState("");

  const token = localStorage.getItem("token");

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API}/clients/${clientId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("HISTORY ERROR:", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const addNote = async () => {
    if (!note.trim()) return;

    try {
      await fetch(`${API}/client-stage-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId,
          note,
          stage: "manual_note"
        })
      });

      setNote("");
      loadHistory();
    } catch (err) {
      console.error("ADD NOTE ERROR:", err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStageBorderColor = (stage: string) => {
    switch (stage) {
      case 'new_lead': return 'border-blue-400';
      case 'call_and_check': return 'border-yellow-400';
      case 'budget_approval': return 'border-orange-400';
      case 'requirement_discussion': return 'border-purple-400';
      case 'handover': return 'border-green-400';
      case 'manual_note': return 'border-gray-400';
      default: return 'border-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-[500px] max-h-[80vh] overflow-y-auto p-6 rounded space-y-4">

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Client Timeline</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {/* ADD NOTE */}
        <div className="flex gap-2">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add note..."
            className="border p-2 flex-1 rounded"
          />
          <button
            onClick={addNote}
            className="bg-blue-600 text-white px-3 rounded"
          >
            Add
          </button>
        </div>

        {/* TIMELINE */}
        <div className="space-y-3">
          {history.length === 0 && (
            <p className="text-gray-500 text-sm">No history yet</p>
          )}

          {history.map(h => (
            <div
              key={h.id}
              className={`border-l-4 ${getStageBorderColor(h.stage)} pl-3`}
            >
              <p className="font-semibold capitalize">{h.stage?.replace(/_/g, ' ')}</p>
              <p className="text-sm text-gray-600">{h.note}</p>
              <p className="text-xs text-gray-400">{formatDate(h.created_at)}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ClientHistoryModal;