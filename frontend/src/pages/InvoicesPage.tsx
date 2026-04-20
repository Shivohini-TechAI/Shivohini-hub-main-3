import React from 'react';
import InvoiceEditor from '../components/invoices/InvoiceEditor';
import TabbedRightPane from '../components/invoices/TabbedRightPane';

// 🔥 Removed Settings/Seed Defaults button entirely

const InvoicesPage: React.FC = () => {
  return (
    <div className="fixed inset-0 lg:ml-64 top-16 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Invoice Creator</h1>
      </div>

      {/* Invoice Editor and Preview */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-gray-200">
          <InvoiceEditor />
        </div>
        <div className="w-1/2">
          <TabbedRightPane />
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;