import React, { useState } from 'react';
import { FileText, List } from 'lucide-react';

import AppreciationCertificateEditor from '../components/appreciation/AppreciationCertificateEditor';
import AppreciationCertificatePreview from '../components/appreciation/AppreciationCertificatePreview';
import AppreciationCertificateRecords from '../components/appreciation/AppreciationCertificateRecords';

import { AppreciationCertificateData } from '../services/appreciationCertificate';

const AppreciationCertificateCreator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'records'>('records');
  const [showPreview, setShowPreview] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [certificateData, setCertificateData] =
    useState<AppreciationCertificateData>({
      recipientName: '',
      designation: '',
      appreciationFor: '',
      issueDate: new Date().toISOString().split('T')[0],
      joiningDate: '',
    });

  const updateCertificateData = (
    field: keyof AppreciationCertificateData,
    value: string
  ) => {
    setCertificateData(prev => ({ ...prev, [field]: value }));
  };

  const handleView = (cert: any) => {
    setCertificateData({
      recipientName: cert.recipient_name,
      designation: cert.designation || '',
      appreciationFor: cert.appreciation_for,
      issueDate: cert.issue_date || new Date().toISOString().split('T')[0],
      joiningDate: cert.joining_date || '',
    });
    setShowPreview(true);
    setActiveTab('preview');
  };

  const handleEdit = (cert: any) => {
    setCertificateData({
      recipientName: cert.recipient_name,
      designation: cert.designation || '',
      appreciationFor: cert.appreciation_for,
      issueDate: cert.issue_date || new Date().toISOString().split('T')[0],
      joiningDate: cert.joining_date || '',
    });
    setShowPreview(true);
    setActiveTab('preview');
  };

  return (
    <div className="fixed inset-0 lg:ml-64 top-16 flex flex-col bg-white">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <h1 className="text-xl font-semibold text-gray-900">
          Appreciation Certificate Creator
        </h1>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden bg-white">

        {/* LEFT — EDITOR */}
        <div className="w-1/2 border-r border-gray-200 bg-white">
          <AppreciationCertificateEditor
            certificateData={certificateData}
            updateCertificateData={updateCertificateData}
            onPreview={() => {
              setShowPreview(true);
              setActiveTab('preview');
            }}
          />
        </div>

        {/* RIGHT — TABS */}
        <div className="w-1/2 flex flex-col bg-white">

          {/* TABS — Records first, Preview second */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab('records')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'records'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List size={16} />
                <span>Records</span>
              </button>

              <button
                onClick={() => {
                  setShowPreview(true);
                  setActiveTab('preview');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText size={16} />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-auto bg-white">
            <div className={activeTab === 'records' ? 'block p-6' : 'hidden'}>
              <AppreciationCertificateRecords
                key={refreshKey}
                onView={handleView}
                onEdit={handleEdit}
                onRefresh={() => setRefreshKey(k => k + 1)}
              />
            </div>
            <div className={activeTab === 'preview' ? 'h-full' : 'hidden'}>
              <AppreciationCertificatePreview
                certificateData={certificateData}
                showPreview={showPreview}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppreciationCertificateCreator;