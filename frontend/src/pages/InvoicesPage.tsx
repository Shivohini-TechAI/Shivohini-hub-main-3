import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import InvoiceEditor from '../components/invoices/InvoiceEditor';
import TabbedRightPane from '../components/invoices/TabbedRightPane';

const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 lg:ml-64 top-16 flex flex-col">
      {/* Header with Settings Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invoice Creator</h1>
        <button
          onClick={() => navigate('/admin/invoices/settings')}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Seed Defaults</span>
        </button>
      </div>

      {/* Invoice Editor and Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Editor */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
          <InvoiceEditor />
        </div>

        {/* Right Pane - Tabbed Preview & Records */}
        <div className="w-1/2">
          <TabbedRightPane />
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
