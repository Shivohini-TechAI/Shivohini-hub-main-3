import React, { useState, useEffect } from 'react';
import { Search, X, User, Phone, Mail, MapPin, Tag, Calendar, RotateCcw, Trash2 } from 'lucide-react';
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
  is_terminated: boolean;
  terminated_at?: string;
  terminated_reason?: string;
  created_at: string;
  updated_at: string;
}

const TerminatedClients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [processingClientId, setProcessingClientId] = useState<string | null>(null);

  useEffect(() => {
    fetchTerminatedClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery]);

  const fetchTerminatedClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_terminated', true)
        .order('terminated_at', { ascending: false });

      if (queryError) throw queryError;

      setClients(data || []);
    } catch (err) {
      console.error('Error fetching terminated clients:', err);
      setError('Failed to load terminated clients');
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
      (client.phone && client.phone.includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query))
    );
    setFilteredClients(filtered);
  };

  const handleRecover = async (client: Client) => {
    if (!window.confirm(`Are you sure you want to recover "${client.name}"? This will restore it to the CRM pipeline.`)) {
      return;
    }

    try {
      setProcessingClientId(client.id);

      const { error: updateError } = await supabase
        .from('clients')
        .update({
          is_terminated: false,
          terminated_at: null,
          terminated_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (updateError) throw updateError;

      await fetchTerminatedClients();

      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
      }
    } catch (err) {
      console.error('Error recovering client:', err);
      alert('Failed to recover lead. Please try again.');
    } finally {
      setProcessingClientId(null);
    }
  };

  const handlePermanentDelete = async (client: Client) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE "${client.name}" and all associated notes? This action cannot be undone.`)) {
      return;
    }

    try {
      setProcessingClientId(client.id);

      const { error: deleteNotesError } = await supabase
        .from('client_stage_notes')
        .delete()
        .eq('client_id', client.id);

      if (deleteNotesError) throw deleteNotesError;

      const { error: deleteClientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (deleteClientError) throw deleteClientError;

      await fetchTerminatedClients();

      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Failed to delete lead. Please try again.');
    } finally {
      setProcessingClientId(null);
    }
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading terminated clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Terminated Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage terminated leads - recover or permanently delete
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Total Terminated: {clients.length}
          </h2>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No terminated clients match your search' : 'No terminated clients'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">
                        {client.name}
                      </h4>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        Terminated
                      </span>
                    </div>
                  </div>

                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-2" />
                      {client.phone}
                    </div>
                  )}

                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 truncate">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.email}
                    </div>
                  )}

                  {client.location && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {client.location}
                    </div>
                  )}

                  {client.source && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-500">
                      <Tag className="h-4 w-4 mr-2" />
                      {client.source}
                    </div>
                  )}

                  {client.terminated_at && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Terminated: {formatShortDate(client.terminated_at)}
                    </div>
                  )}

                  {client.terminated_reason && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Reason:</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                        {client.terminated_reason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRecover(client)}
                      disabled={processingClientId === client.id}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>{processingClientId === client.id ? 'Processing...' : 'Recover'}</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(client)}
                      disabled={processingClientId === client.id}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{processingClientId === client.id ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedClient.name}
              </h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                    Terminated Lead
                  </span>
                </div>
                {selectedClient.terminated_at && (
                  <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                    Terminated on: {formatDate(selectedClient.terminated_at)}
                  </p>
                )}
              </div>

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
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Requirement</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                          {selectedClient.requirement}
                        </p>
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

              {selectedClient.terminated_reason && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Termination Reason</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {selectedClient.terminated_reason}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleRecover(selectedClient)}
                  disabled={processingClientId === selectedClient.id}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{processingClientId === selectedClient.id ? 'Processing...' : 'Recover Lead'}</span>
                </button>
                <button
                  onClick={() => handlePermanentDelete(selectedClient)}
                  disabled={processingClientId === selectedClient.id}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{processingClientId === selectedClient.id ? 'Deleting...' : 'Delete Permanently'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminatedClients;
