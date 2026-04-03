import React, { useState, useRef } from 'react';
import { FileText, List } from 'lucide-react';
import OfferLetterEditor from '../components/OfferLetterEditor';
import OfferLetterPreview, { OfferLetterPreviewRef } from '../components/offerLetters/OfferLetterPreview';
import OfferLetterRecords from '../components/offerLetters/OfferLetterRecords';
import type { OfferLetter } from '../services/offerLetters';

export interface OfferLetterData {
  candidateName: string;
  candidateEmail: string;
  positionTitle: string;
  department: string;
  issueDate: string;
  acceptanceDeadline: string;
}

const OfferLetterCreator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'records'>('preview');
  const [offerData, setOfferData] = useState<OfferLetterData>({
    candidateName: '',
    candidateEmail: '',
    positionTitle: '',
    department: '',
    issueDate: new Date().toISOString().split('T')[0],
    acceptanceDeadline: '',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const offerLetterPreviewRef = useRef<OfferLetterPreviewRef>(null);

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleView = (offer: OfferLetter) => {
    setOfferData({
      candidateName: offer.candidate_name,
      candidateEmail: offer.candidate_email,
      positionTitle: offer.position_title,
      department: offer.department,
      issueDate: offer.issue_date,
      acceptanceDeadline: offer.acceptance_deadline,
    });
    setShowPreview(true);
    setActiveTab('preview');
  };

  const handleEdit = (offer: OfferLetter) => {
    setOfferData({
      candidateName: offer.candidate_name,
      candidateEmail: offer.candidate_email,
      positionTitle: offer.position_title,
      department: offer.department,
      issueDate: offer.issue_date,
      acceptanceDeadline: offer.acceptance_deadline,
    });
    setShowPreview(true);
    setActiveTab('preview');
  };

  const updateOfferData = (field: keyof OfferLetterData, value: string) => {
    setOfferData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 lg:ml-64 top-16 flex flex-col">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Offer Letter Creator</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
          <OfferLetterEditor
            offerData={offerData}
            updateOfferData={updateOfferData}
            onPreview={handlePreview}
            offerLetterPreviewRef={offerLetterPreviewRef}
          />
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => setActiveTab('records')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'records'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Offer Records</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'preview' ? (
              <OfferLetterPreview
                ref={offerLetterPreviewRef}
                offerData={offerData}
                showPreview={showPreview}
              />
            ) : (
              <OfferLetterRecords
                onView={handleView}
                onEdit={handleEdit}
                refreshTrigger={refreshTrigger}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferLetterCreator;
