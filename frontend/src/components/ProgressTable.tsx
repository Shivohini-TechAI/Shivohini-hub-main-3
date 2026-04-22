import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../hooks/useAuth';

const API = "/api";

interface ProgressStep {
  id: string;
  step: string;
  responsible: string;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'ongoing' | 'completed';
}

interface ProgressTableProps {
  projectId: string;
}

const ProgressTable: React.FC<ProgressTableProps> = ({ projectId }) => {
  const { projects } = useProjects();
  const { user } = useAuth();

  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProgressStep>({
    id: '',
    step: '',
    responsible: '',
    startDate: '',
    endDate: '',
    status: 'not_started'
  });

  const project = projects.find(p => p.id === projectId);

  const canEdit =
    user?.role === 'admin' ||
    user?.role === 'project_manager' ||
    user?.role === 'team_leader' ||
    project?.createdBy === user?.id;

  // 🔥 LOAD STEPS
  useEffect(() => {
    const loadSteps = async () => {
      try {
        const res = await fetch(`${API}/progress/${projectId}`);
        const data = await res.json();
        setSteps(data || []);
      } catch (err) {
        console.error("Failed to load steps", err);
      }
    };

    loadSteps();
  }, [projectId]);

  // 🔥 SAVE / UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await fetch(`${API}/progress/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, projectId })
        });
      }

      // reload
      const res = await fetch(`${API}/progress/${projectId}`);
      const data = await res.json();
      setSteps(data);

      setEditingId(null);
      setShowAddForm(false);

      setFormData({
        id: '',
        step: '',
        responsible: '',
        startDate: '',
        endDate: '',
        status: 'not_started'
      });

    } catch (err) {
      console.error("Save failed", err);
    }
  };

  // 🔥 DELETE
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this step?")) return;

    await fetch(`${API}/progress/${id}`, { method: "DELETE" });

    setSteps(prev => prev.filter(s => s.id !== id));
  };

  // 🔥 EDIT
  const handleEdit = (step: ProgressStep) => {
    setEditingId(step.id);
    setFormData(step);
    setShowAddForm(true);
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : "-";

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Progress Tracking</h3>

        {canEdit && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Step
          </button>
        )}
      </div>

      {/* FORM */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3">

          <input
            value={formData.step}
            onChange={(e) => setFormData(p => ({ ...p, step: e.target.value }))}
            placeholder="Step"
            className="w-full p-2 border rounded"
            required
          />

          <input
            value={formData.responsible}
            onChange={(e) => setFormData(p => ({ ...p, responsible: e.target.value }))}
            placeholder="Responsible"
            className="w-full p-2 border rounded"
          />

          <div className="flex gap-2">
            <input type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
              className="p-2 border rounded w-full"
            />

            <input type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
              className="p-2 border rounded w-full"
            />
          </div>

          <select
            value={formData.status}
            onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))}
            className="p-2 border rounded w-full"
          >
            <option value="not_started">Not Started</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>

          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              {editingId ? "Update" : "Add"}
            </button>

            <button type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>

        </form>
      )}

      {/* TABLE */}
      <div className="bg-white rounded shadow">
        {steps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-10 w-10 mx-auto mb-2" />
            No progress yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th>Step</th>
                <th>Responsible</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                {canEdit && <th />}
              </tr>
            </thead>

            <tbody>
              {steps.map(step => (
                <tr key={step.id}>
                  <td>{step.step}</td>
                  <td>{step.responsible}</td>
                  <td>{formatDate(step.startDate)}</td>
                  <td>{formatDate(step.endDate)}</td>
                  <td>
                    <span className={`px-2 py-1 rounded ${getStatusColor(step.status)}`}>
                      {step.status}
                    </span>
                  </td>

                  {canEdit && (
                    <td>
                      <Edit onClick={() => handleEdit(step)} />
                      <Trash2 onClick={() => handleDelete(step.id)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default ProgressTable;