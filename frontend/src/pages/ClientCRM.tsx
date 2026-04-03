import React, { useState, useEffect } from 'react';
import { Search, X, User, Phone, Mail, MapPin, Tag, Calendar, CheckCircle, Plus, FileText, Trash2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  source?: string;
  requirement?: string;
  current_stage: 'new_lead' | 'call_and_check' | 'budget_approval' | 'requirement_discussion' | 'handover';
  is_terminated?: boolean;
  terminated_at?: string;
  terminated_reason?: string;
  created_at: string;
  updated_at: string;
}

interface StageNote {
  id: string;
  client_id: string;
  stage: string;
  note_date: string;
  note: string;
  deadline_date?: string;
  created_at: string;
}

const stages = [
  { key: 'new_lead', label: 'New Lead' },
  { key: 'call_and_check', label: 'Call & Check' },
  { key: 'budget_approval', label: 'Budget Approval' },
  { key: 'requirement_discussion', label: 'Requirement Discussion' },
  { key: 'handover', label: 'Handover' }
] as const;

const stageColors: Record<string, string> = {
  new_lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  call_and_check: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  budget_approval: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  requirement_discussion: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  handover: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
};

const ClientCRM: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);
  const [stageNotes, setStageNotes] = useState<StageNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showAddNoteForm, setShowAddNoteForm] = useState<string | null>(null);
  const [newNoteData, setNewNoteData] = useState({
    note_date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminatingClient, setTerminatingClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [showStageChangeModal, setShowStageChangeModal] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<Client['current_stage'] | null>(null);
  const [stageChangeData, setStageChangeData] = useState({
    deadline: '',
    note: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    source: '',
    requirement: '',
    current_stage: 'new_lead' as Client['current_stage']
  });
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_terminated', false)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      (client.phone && client.phone.includes(query))
    );
    setFilteredClients(filtered);
  };

  const getClientsByStage = (stage: string) => {
    return filteredClients.filter(client =>
      client.current_stage === stage && !client.is_terminated
    );
  };

  const fetchClientDetails = async (clientId: string) => {
    try {
      setLoadingClientDetails(true);

      const { data, error: queryError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (queryError) throw queryError;

      if (data) {
        setSelectedClient(data);
        fetchStageNotes(clientId);
      }
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setLoadingClientDetails(false);
    }
  };

  const fetchStageNotes = async (clientId: string) => {
    try {
      setLoadingNotes(true);

      const { data, error: queryError } = await supabase
        .from('client_stage_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('note_date', { ascending: false });

      if (queryError) throw queryError;

      setStageNotes(data || []);
    } catch (err) {
      console.error('Error fetching stage notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
    fetchClientDetails(clientId);
  };

  const closeModal = () => {
    setSelectedClientId(null);
    setSelectedClient(null);
    setStageNotes([]);
    setShowAddNoteForm(null);
    setActiveTab('details');
    setNewNoteData({
      note_date: new Date().toISOString().split('T')[0],
      note: ''
    });
  };

  const handleAddNote = async (stage: string) => {
    if (!selectedClient || !newNoteData.note.trim()) return;

    try {
      setSavingNote(true);

      const { error: insertError } = await supabase
        .from('client_stage_notes')
        .insert({
          client_id: selectedClient.id,
          stage: stage,
          note_date: newNoteData.note_date,
          note: newNoteData.note.trim()
        });

      if (insertError) throw insertError;

      setNewNoteData({
        note_date: new Date().toISOString().split('T')[0],
        note: ''
      });
      setShowAddNoteForm(null);

      await fetchStageNotes(selectedClient.id);
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedClient) return;
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('client_stage_notes')
        .delete()
        .eq('id', noteId);

      if (deleteError) throw deleteError;

      await fetchStageNotes(selectedClient.id);
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleStageChange = (newStage: Client['current_stage']) => {
    if (!selectedClient || newStage === selectedClient.current_stage) return;

    // Open modal to capture deadline and note
    setPendingStageChange(newStage);
    setStageChangeData({ deadline: '', note: '' });
    setShowStageChangeModal(true);
  };

  const confirmStageChange = async () => {
    if (!selectedClient || !pendingStageChange) return;

    // Validate required fields
    if (!stageChangeData.deadline.trim()) {
      alert('Please select a deadline date.');
      return;
    }

    if (!stageChangeData.note.trim()) {
      alert('Please enter a note explaining the next actions or status.');
      return;
    }

    try {
      setUpdatingStage(true);

      // Update the client's stage in Supabase
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          current_stage: pendingStageChange,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id);

      if (updateError) throw updateError;

      // Add note with deadline for the stage change
      const { error: noteError } = await supabase
        .from('client_stage_notes')
        .insert({
          client_id: selectedClient.id,
          stage: pendingStageChange,
          note_date: new Date().toISOString().split('T')[0],
          note: stageChangeData.note.trim(),
          deadline_date: stageChangeData.deadline
        });

      if (noteError) throw noteError;

      // Update local state
      setSelectedClient(prev => prev ? { ...prev, current_stage: pendingStageChange } : null);

      // Close modal and reset
      setShowStageChangeModal(false);
      setPendingStageChange(null);
      setStageChangeData({ deadline: '', note: '' });

      // Refresh clients list to move the card to the correct column
      await fetchClients();

      // Refresh stage notes to show the new note
      await fetchStageNotes(selectedClient.id);

    } catch (err) {
      console.error('Error updating client stage:', err);
      alert('Failed to update client stage. Please try again.');
    } finally {
      setUpdatingStage(false);
    }
  };

  const closeStageChangeModal = () => {
    setShowStageChangeModal(false);
    setPendingStageChange(null);
    setStageChangeData({ deadline: '', note: '' });
  };

  const getNotesForStage = (stage: string) => {
    return stageNotes.filter(note => note.stage === stage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNoteDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateClient = async () => {
    if (!formData.name.trim()) {
      alert('Client name is required');
      return;
    }

    try {
      setSavingClient(true);
     //changes done
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          location: formData.location.trim() || null,
          source: formData.source.trim() || null,
          requirement: formData.requirement.trim() || null,
          current_stage: formData.current_stage
        })
        .select() //changes
        .single()
        ;

      if (insertError) throw insertError;
      //changes
      if (newClient) {
      await supabase
        .from('client_stage_notes')
        .insert({
          client_id: newClient.id,
          stage: formData.current_stage,
          note_date: new Date().toISOString().split('T')[0],
          note: 'Lead created',
          deadline_date: new Date().toISOString().split('T')[0] // Calendar date
        });
    }
    //end
      setShowCreateModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        source: '',
        requirement: '',
        current_stage: 'new_lead'
      });

      await fetchClients();
    } catch (err) {
      console.error('Error creating client:', err);
      alert('Failed to create client. Please try again.');
    } finally {
      setSavingClient(false);
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;
    if (!formData.name.trim()) {
      alert('Client name is required');
      return;
    }

    try {
      setSavingClient(true);

      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          location: formData.location.trim() || null,
          source: formData.source.trim() || null,
          requirement: formData.requirement.trim() || null,
          current_stage: formData.current_stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id);

      if (updateError) throw updateError;

      setShowEditModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        source: '',
        requirement: '',
        current_stage: 'new_lead'
      });

      await fetchClients();

      if (selectedClient.current_stage !== formData.current_stage) {
        closeModal();
      } else {
        await fetchClientDetails(selectedClient.id);
      }
    } catch (err) {
      console.error('Error updating client:', err);
      alert('Failed to update client. Please try again.');
    } finally {
      setSavingClient(false);
    }
  };

  const openEditModal = () => {
    if (!selectedClient) return;

    setFormData({
      name: selectedClient.name,
      phone: selectedClient.phone || '',
      email: selectedClient.email || '',
      location: selectedClient.location || '',
      source: selectedClient.source || '',
      requirement: selectedClient.requirement || '',
      current_stage: selectedClient.current_stage
    });

    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      location: '',
      source: '',
      requirement: '',
      current_stage: 'new_lead'
    });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      location: '',
      source: '',
      requirement: '',
      current_stage: 'new_lead'
    });
  };

  const handleTerminateClient = async () => {
    if (!selectedClient) return;

    try {
      setTerminatingClient(true);

      const { error: updateError } = await supabase
        .from('clients')
        .update({
          is_terminated: true,
          terminated_at: new Date().toISOString(),
          terminated_reason: terminationReason.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id);

      if (updateError) throw updateError;

      setShowTerminateModal(false);
      setTerminationReason('');
      closeModal();
      await fetchClients();
    } catch (err) {
      console.error('Error terminating client:', err);
      alert('Failed to terminate lead. Please try again.');
    } finally {
      setTerminatingClient(false);
    }
  };

  const openTerminateModal = () => {
    setTerminationReason('');
    setShowTerminateModal(true);
  };

  const closeTerminateModal = () => {
    setShowTerminateModal(false);
    setTerminationReason('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Client CRM</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your client pipeline and track progress through each stage</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Lead</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by client name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex gap-4 min-w-min">
        {stages.map(({ key, label }) => {
          const stageClients = getClientsByStage(key);
          return (
            <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex-shrink-0 w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium">
                  {stageClients.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {stageClients.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No clients in this stage</p>
                  </div>
                ) : (
                  stageClients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => handleClientClick(client.id)}
                      className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
                            {client.name}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${stageColors[key]}`}>
                            {label}
                          </span>
                        </div>

                        {client.location && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            📍 {client.location}
                          </p>
                        )}

                        {client.phone && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            📞 {client.phone}
                          </p>
                        )}

                        {client.email && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            ✉️ {client.email}
                          </p>
                        )}

                        {client.source && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Source: {client.source}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {filteredClients.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? 'No clients match your search' : 'No clients yet'}
          </p>
        </div>
      )}

      {selectedClientId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loadingClientDetails ? 'Loading...' : selectedClient?.name || 'Client Details'}
              </h2>
              <div className="flex items-center space-x-2">
                {selectedClient && !loadingClientDetails && (
                  <>
                    <button
                      onClick={openTerminateModal}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Terminate Lead"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={openEditModal}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit Client"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={closeModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {loadingClientDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Loading client details...</p>
                </div>
              </div>
            ) : selectedClient ? (
              <div className="flex flex-col h-full">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                  <div className="flex gap-8">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'details'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Client Details
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'timeline'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Stage Timeline & Notes
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'details' ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <User className="h-5 w-5 mr-2" />
                          Client Details
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedClient.name}</p>
                      </div>
                    </div>

                    {selectedClient.phone && (
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedClient.phone}</p>
                        </div>
                      </div>
                    )}

                    {selectedClient.email && (
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedClient.email}</p>
                        </div>
                      </div>
                    )}

                    {selectedClient.location && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedClient.location}</p>
                        </div>
                      </div>
                    )}

                    {selectedClient.source && (
                      <div className="flex items-start">
                        <Tag className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Source</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedClient.source}</p>
                        </div>
                      </div>
                    )}

                    {selectedClient.requirement && (
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Requirement</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{selectedClient.requirement}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created At</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedClient.created_at)}</p>
                      </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Stage</h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Move client to:
                        </label>
                        <select
                          value={selectedClient.current_stage}
                          onChange={(e) => handleStageChange(e.target.value as Client['current_stage'])}
                          disabled={updatingStage}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {stages.map(({ key, label }) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                        {updatingStage && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Updating stage...</p>
                        )}
                      </div>
                    </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Stage Timeline & Notes</h3>
                  {loadingNotes ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stages.map(({ key, label }, index) => {
                        const isCurrentStage = selectedClient.current_stage === key;
                        const isPastStage = stages.findIndex(s => s.key === selectedClient.current_stage) > index;
                        const stageNotesData = getNotesForStage(key);

                        return (
                          <div key={key} className="flex items-start">
                            <div className="flex flex-col items-center mr-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isPastStage ? 'bg-green-500 dark:bg-green-600' :
                                isCurrentStage ? 'bg-blue-500 dark:bg-blue-600' :
                                'bg-gray-300 dark:bg-gray-600'
                              }`}>
                                {isPastStage ? (
                                  <CheckCircle className="h-5 w-5 text-white" />
                                ) : (
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                )}
                              </div>
                              {index < stages.length - 1 && (
                                <div className={`w-0.5 flex-1 min-h-[80px] ${
                                  isPastStage ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}></div>
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className={`font-medium mb-2 ${
                                isCurrentStage ? 'text-blue-600 dark:text-blue-400' :
                                isPastStage ? 'text-green-600 dark:text-green-400' :
                                'text-gray-500 dark:text-gray-400'
                              }`}>
                                {label}
                                {isCurrentStage && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                    Current Stage
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2">
                                {stageNotesData.length > 0 ? (
                                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                                    {stageNotesData.map((note) => (
                                      <div key={note.id} className="flex items-start justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 last:pb-0">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatNoteDate(note.note_date)}</span>
                                          </div>
                                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{note.note}</p>
                                          {note.deadline_date && (
                                            <div className="flex items-center gap-2 mt-2">
                                              <Calendar className="h-3 w-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                Deadline: {formatNoteDate(note.deadline_date)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => handleDeleteNote(note.id)}
                                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 p-1"
                                          title="Delete note"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">No notes yet</p>
                                )}

                                {showAddNoteForm === key ? (
                                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                      <input
                                        type="date"
                                        value={newNoteData.note_date}
                                        onChange={(e) => setNewNoteData(prev => ({ ...prev, note_date: e.target.value }))}
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      />
                                    </div>
                                    <textarea
                                      value={newNoteData.note}
                                      onChange={(e) => setNewNoteData(prev => ({ ...prev, note: e.target.value }))}
                                      placeholder="Enter note..."
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      rows={3}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleAddNote(key)}
                                        disabled={savingNote || !newNoteData.note.trim()}
                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {savingNote ? 'Saving...' : 'Save Note'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowAddNoteForm(null);
                                          setNewNoteData({
                                            note_date: new Date().toISOString().split('T')[0],
                                            note: ''
                                          });
                                        }}
                                        className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowAddNoteForm(key)}
                                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Add Note</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                    </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-center text-gray-500 dark:text-gray-400">Client not found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New Lead</h2>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="h-4 w-4 inline mr-2" />
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Referral, Website, Social Media"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Requirement
                </label>
                <textarea
                  value={formData.requirement}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirement: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter client requirement or scope"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stage
                </label>
                <select
                  value={formData.current_stage}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_stage: e.target.value as Client['current_stage'] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {stages.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={savingClient || !formData.name.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingClient ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Lead</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="h-4 w-4 inline mr-2" />
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Referral, Website, Social Media"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Requirement
                </label>
                <textarea
                  value={formData.requirement}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirement: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter client requirement or scope"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stage
                </label>
                <select
                  value={formData.current_stage}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_stage: e.target.value as Client['current_stage'] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {stages.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditClient}
                  disabled={savingClient || !formData.name.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingClient ? 'Updating...' : 'Update Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStageChangeModal && selectedClient && pendingStageChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full border border-white/20 dark:border-gray-700/50">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Move to {stages.find(s => s.key === pendingStageChange)?.label}</h2>
                <button
                  onClick={closeStageChangeModal}
                  disabled={updatingStage}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  Please provide a deadline and note for this stage change.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Deadline Date *
                </label>
                <input
                  type="date"
                  value={stageChangeData.deadline}
                  onChange={(e) => setStageChangeData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={updatingStage}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Note *
                </label>
                <textarea
                  value={stageChangeData.note}
                  onChange={(e) => setStageChangeData(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Explain next actions, status, or any relevant information..."
                  rows={4}
                  disabled={updatingStage}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeStageChangeModal}
                  disabled={updatingStage}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStageChange}
                  disabled={updatingStage || !stageChangeData.deadline.trim() || !stageChangeData.note.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStage ? 'Moving Stage...' : 'Move Stage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTerminateModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full border border-white/20 dark:border-gray-700/50">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Terminate Lead</h2>
                <button
                  onClick={closeTerminateModal}
                  disabled={terminatingClient}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  Are you sure you want to terminate this lead? This will remove it from the pipeline.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Termination Note / Reason (Optional)
                </label>
                <textarea
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter reason for termination..."
                  rows={4}
                  disabled={terminatingClient}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeTerminateModal}
                  disabled={terminatingClient}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTerminateClient}
                  disabled={terminatingClient}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {terminatingClient ? 'Terminating...' : 'Terminate Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientCRM;