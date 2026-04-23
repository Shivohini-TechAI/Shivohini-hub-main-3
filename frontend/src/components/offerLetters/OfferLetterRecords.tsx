import React, { useEffect, useState } from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { safeArray } from "../../lib/api";
import { useAuth } from '../../hooks/useAuth';
import dayjs from 'dayjs';
import { getOfferLetters, deleteOfferLetter, type OfferLetter } from '../../services/offerLetters';
import { updateOfferLetterCheckbox } from '../../services/offerLetters';


interface OfferLetterRecordsProps {
  onView?: (offerLetter: OfferLetter) => void;
  onEdit?: (offerLetter: OfferLetter) => void;
  refreshTrigger?: number;
}

const OfferLetterRecords: React.FC<OfferLetterRecordsProps> = ({ onView, onEdit, refreshTrigger }) => {
  const { user } = useAuth();
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOfferLetters = async () => {
    if (!user) return;

    if (user.role !== 'admin' && user.role !== 'project_manager') {
      setError('Access denied: Only admin and project managers can view offer letters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getOfferLetters();
      setOfferLetters(safeArray(data));
    } catch (err) {
      console.error('Error loading offer letters:', err);
      setError('Failed to load offer letters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferLetters();
  }, [user, refreshTrigger]);

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('MM/DD/YYYY');
  };

  const handleView = (offer: OfferLetter) => {
    if (onView) {
      onView(offer);
    }
  };

  const handleEdit = (offer: OfferLetter) => {
    if (onEdit) {
      onEdit(offer);
    }
  };

  const handleDelete = async (offerId: string, candidateName: string) => {
    const confirmed = confirm(
      `Are you sure you want to delete the offer letter for ${candidateName}? This action cannot be undone.`
    );
  
    if (!confirmed) return;

    setProcessingId(offerId);
    try {
      toast.loading('Deleting offer letter...', { id: 'delete-offer' });

      await deleteOfferLetter(offerId);

      toast.success('Offer letter deleted successfully!', { id: 'delete-offer' });
      await loadOfferLetters();
    } catch (err) {
      console.error('Error deleting offer letter:', err);
      toast.error('Failed to delete offer letter. Please try again.', { id: 'delete-offer' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckboxToggle = async (
    offerId: string,
    field: 'nda_sent' | 'nda_received' | 'offer_sent' | 'offer_received'
  ) => {
    const offer = offerLetters.find(o => o.id === offerId);
    if (!offer) return;
    const newValue = !offer[field];

    setOfferLetters(prev =>
      prev.map(o =>
        o.id === offerId ? { ...o, [field]: newValue } : o
      )
    );

    try {
      await updateOfferLetterCheckbox(offerId, field, newValue);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update checkbox');
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      Sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      Accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || statusColors.Draft}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading offer letters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadOfferLetters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (offerLetters.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No offer letters found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Create your first offer letter to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
  <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            
            {/* ===================== TABLE HEAD ===================== */}
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Candidate Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>

                {/* NEW COLUMNS */}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  NDA Sent
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  NDA Received
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Offer Letter Sent
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Offer Letter Received
                </th>

                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            {/* ===================== TABLE BODY ===================== */}
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {safeArray(offerLetters).map((offer) => (
                <tr
                  key={offer.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {/* Candidate */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {offer.candidate_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {offer.candidate_email}
                    </div>
                  </td>

                  {/* Position */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {offer.position_title}
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {offer.department || '-'}
                    </div>
                  </td>

                  {/* Issue Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(offer.issue_date)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(offer.status)}
                  </td>

                  {/* NDA Sent */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={Boolean(offer.nda_sent)}
                      onChange={() => handleCheckboxToggle(offer.id, 'nda_sent')}
                      className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                  </td>

                  {/* NDA Received */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                     <input
    type="checkbox"
    checked={Boolean(offer.nda_received)}
    onChange={() => handleCheckboxToggle(offer.id, 'nda_received')}
    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
  />
                  </td>

                  {/* Offer Sent */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                     <input
    type="checkbox"
    checked={Boolean(offer.offer_sent)}
    onChange={() => handleCheckboxToggle(offer.id, 'offer_sent')}
    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
  />
                  </td>

                  {/* Offer Received */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <input
    type="checkbox"
    checked={Boolean(offer.offer_received)}
    onChange={() => handleCheckboxToggle(offer.id, 'offer_received')}
    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
  />
                  </td>

                  {/* ACTIONS (NON-COLLAPSING) */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2 flex-nowrap min-w-max">
                      <button
                        onClick={() => handleView(offer)}
                        disabled={processingId === offer.id}
                        className="inline-flex shrink-0 items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>

                      <button
                        onClick={() => handleEdit(offer)}
                        disabled={processingId === offer.id}
                        className="inline-flex shrink-0 items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(offer.id, offer.candidate_name)}
                        disabled={processingId === offer.id}
                        className="inline-flex shrink-0 items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

};

export default OfferLetterRecords;
