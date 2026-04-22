import React, { useState, useEffect } from 'react';
import { Plus, Edit, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ClientHistoryModal from './ClientHistoryModal';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  requirement?: string;
  project_topic?: string;
  current_stage: 'new_lead' | 'call_and_check' | 'budget_approval' | 'requirement_discussion' | 'handover';
  is_terminated?: boolean;
  terminated_reason?: string;
}

const API = "http://localhost:5001";

const stages = [
  { key: 'new_lead', label: 'New Lead' },
  { key: 'call_and_check', label: 'Call & Check' },
  { key: 'budget_approval', label: 'Budget Approval' },
  { key: 'requirement_discussion', label: 'Requirement Discussion' },
  { key: 'handover', label: 'Handover' }
] as const;

const ClientCRM: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<string | null>(null);

  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateReason, setTerminateReason] = useState("");
  const [targetClientId, setTargetClientId] = useState<string | null>(null);
  const [terminateError, setTerminateError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    requirement: '',
    project_topic: '',
    current_stage: 'new_lead' as Client['current_stage']
  });

  const token = localStorage.getItem("token");

  // ================= LOAD =================
  const loadClients = async () => {
    try {
      const res = await fetch(`${API}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // ================= DRAG =================
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    await fetch(`${API}/clients/${result.draggableId}/stage`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ stage: result.destination.droppableId })
    });

    loadClients();
  };

  // ================= FILTER =================
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClientsByStage = (stage: string) =>
    filteredClients.filter(c => c.current_stage === stage);

  // ================= CREATE =================
  const handleCreateClient = async () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }

    const res = await fetch(`${API}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setShowCreateModal(false);
    setFormData({ name: '', phone: '', email: '', requirement: '', project_topic: '', current_stage: 'new_lead' });
    loadClients();
  };

  // ================= EDIT =================
  const handleEditClient = async () => {
    if (!selectedClient) return;

    await fetch(`${API}/clients/${selectedClient.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    setShowEditModal(false);
    loadClients();
  };

  // ================= TERMINATE =================
  const handleTerminateClient = async () => {
    if (!targetClientId) return;

    // 🔥 Reason is mandatory
    if (!terminateReason.trim()) {
      setTerminateError("Please enter a reason to terminate this client.");
      return;
    }

    await fetch(`${API}/clients/${targetClientId}/terminate`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: terminateReason })
    });

    setShowTerminateModal(false);
    setTerminateReason("");
    setTerminateError("");
    loadClients();
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Client CRM</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2 items-center"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 w-full rounded"
      />

      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => (
            <Droppable droppableId={stage.key} key={stage.key}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-64 min-w-[256px] bg-gray-100 p-3 rounded"
                >
                  <h3 className="font-semibold mb-2">{stage.label}</h3>

                  {getClientsByStage(stage.key).map((client, index) => (
                    <Draggable key={client.id} draggableId={client.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-3 rounded mt-2 shadow space-y-1"
                        >
                          <p className="font-semibold">{client.name}</p>
                          {client.phone && <p className="text-sm text-gray-600">📞 {client.phone}</p>}
                          {client.email && <p className="text-sm text-gray-600">✉️ {client.email}</p>}
                          {client.project_topic && (
                            <p className="text-sm text-gray-600">📋 {client.project_topic}</p>
                          )}

                          <div className="flex justify-between mt-2 pt-1 border-t">
                            {/* History */}
                            <button
                              title="View Timeline"
                              onClick={() => setHistoryClient(client.id)}
                            >
                              📜
                            </button>

                            {/* Edit */}
                            <button
                              title="Edit Client"
                              onClick={() => {
                                setSelectedClient(client);
                                setFormData({
                                  name: client.name || '',
                                  phone: client.phone || '',
                                  email: client.email || '',
                                  requirement: client.requirement || '',
                                  project_topic: client.project_topic || '',
                                  current_stage: client.current_stage
                                });
                                setShowEditModal(true);
                              }}
                            >
                              <Edit size={16} />
                            </button>

                            {/* Terminate */}
                            <button
                              title="Terminate Client"
                              onClick={() => {
                                setTargetClientId(client.id);
                                setTerminateReason("");
                                setTerminateError("");
                                setShowTerminateModal(true);
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Add Client</h2>
              <button onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <input
              placeholder="Name *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="border p-2 w-full rounded"
            />
            <input
              placeholder="Phone"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="border p-2 w-full rounded"
            />
            <input
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="border p-2 w-full rounded"
            />
            <input
              placeholder="Project Topic"
              value={formData.project_topic}
              onChange={e => setFormData({ ...formData, project_topic: e.target.value })}
              className="border p-2 w-full rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="border px-4 py-2 rounded w-full"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClient}
                className="bg-green-600 text-white px-4 py-2 rounded w-full"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Edit Client</h2>
              <button onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>
            <input
              placeholder="Name *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="border p-2 w-full rounded"
            />
            <input
              placeholder="Phone"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="border p-2 w-full rounded"
            />
            <input
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="border p-2 w-full rounded"
            />
            <input
              placeholder="Project Topic"
              value={formData.project_topic}
              onChange={e => setFormData({ ...formData, project_topic: e.target.value })}
              className="border p-2 w-full rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="border px-4 py-2 rounded w-full"
              >
                Cancel
              </button>
              <button
                onClick={handleEditClient}
                className="bg-blue-600 text-white px-4 py-2 rounded w-full"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TERMINATE MODAL */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-red-600">Terminate Client</h2>
              <button onClick={() => {
                setShowTerminateModal(false);
                setTerminateError("");
                setTerminateReason("");
              }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              This client will be moved to <strong>Terminated Clients</strong>. You can restore them later from that page.
            </p>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Reason for termination <span className="text-red-500">*</span>
              </label>
              <textarea
                value={terminateReason}
                onChange={e => {
                  setTerminateReason(e.target.value);
                  setTerminateError("");
                }}
                placeholder="Enter reason..."
                rows={3}
                className="border p-2 w-full rounded mt-1"
              />
              {terminateError && (
                <p className="text-red-500 text-sm mt-1">{terminateError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTerminateModal(false);
                  setTerminateError("");
                  setTerminateReason("");
                }}
                className="border px-4 py-2 rounded w-full"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminateClient}
                className="bg-red-600 text-white px-4 py-2 rounded w-full"
              >
                Confirm Terminate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {historyClient && (
        <ClientHistoryModal
          clientId={historyClient}
          onClose={() => setHistoryClient(null)}
        />
      )}

    </div>
  );
};

export default ClientCRM;