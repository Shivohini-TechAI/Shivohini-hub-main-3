import React, { useEffect, useState } from "react";
import { Eye, Edit2, Trash2, Award } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";
import dayjs from "dayjs";

interface Certificate {
  id: string;
  recipient_name: string;
  designation: string;
  appreciation_for: string;
  issue_date: string;
  joining_date: string;
}

interface Props {
  onView?: (cert: Certificate) => void;
  onEdit?: (cert: Certificate) => void;
  onRefresh?: () => void;
}

const AppreciationCertificateRecords: React.FC<Props> = ({ onView, onEdit, onRefresh }) => {
  const [data, setData] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<Certificate[]>("/api/appreciation-certificates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = confirm(`Delete certificate for ${name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/api/appreciation-certificates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Certificate deleted successfully");
      setData((prev) => prev.filter((c) => c.id !== id));
      onRefresh?.();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error("Failed to delete certificate");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
        <Award className="h-10 w-10 mb-2 opacity-30" />
        <p className="text-sm">No certificates found</p>
        <p className="text-xs mt-1">Create your first certificate to see it here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Award className="h-4 w-4 text-blue-600" />
        <h2 className="font-semibold text-gray-800 text-sm">Certificate Records</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {data.length} total
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {data.map((cert) => (
          <div
            key={cert.id}
            className="px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left — Info */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">
                    {cert.recipient_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {cert.recipient_name}
                  </p>
                  {cert.designation && (
                    <p className="text-xs text-gray-500 mt-0.5">{cert.designation}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {cert.appreciation_for}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {cert.issue_date && (
                      <span className="text-xs text-gray-400">
                        Issued: {dayjs(cert.issue_date).format("DD MMM YYYY")}
                      </span>
                    )}
                    {cert.joining_date && (
                      <span className="text-xs text-gray-400">
                        Joined: {dayjs(cert.joining_date).format("DD MMM YYYY")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right — Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onView?.(cert)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  View
                </button>

                <button
                  onClick={() => onEdit?.(cert)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(cert.id, cert.recipient_name)}
                  disabled={deletingId === cert.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {deletingId === cert.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppreciationCertificateRecords;