import React, { useState } from 'react';
import { Eye, Save, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { createAppreciationCertificate } from '../../services/appreciationCertificates';
import { AppreciationCertificateData } from '../../services/appreciationCertificate';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface AppreciationCertificateEditorProps {
  certificateData: AppreciationCertificateData;
  updateCertificateData: (
    field: keyof AppreciationCertificateData,
    value: string
  ) => void;
  onPreview: () => void;
}

const AppreciationCertificateEditor: React.FC<AppreciationCertificateEditorProps> = ({
  certificateData,
  updateCertificateData,
  onPreview,
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = async () => {
  const element = document.querySelector("#certificate-preview");

  if (!element) {
    toast.error("Preview not found");
    return;
  }

  try {
    const canvas = await html2canvas(element as HTMLElement);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

    pdf.save("certificate.pdf");
  } catch (err) {
    console.error(err);
    toast.error("Download failed");
  }
};

  const handleSave = async () => {
  if (!user) {
    return toast.error('You must be logged in to save certificates.');
  }

  if (!certificateData.recipientName || !certificateData.appreciationFor) {
    return toast.error('Recipient name and appreciation reason are required.');
  }

  setIsSaving(true);

  try {
    toast.loading('Saving certificate...', { id: 'save-certificate' });

    await createAppreciationCertificate({
      recipient_name: certificateData.recipientName,
      designation: certificateData.designation || null,
      appreciation_for: certificateData.appreciationFor,
      issue_date: certificateData.issueDate || null,
      joining_date: certificateData.joiningDate || null
    });

    toast.success('Certificate saved successfully!', { id: 'save-certificate' });

  } catch (err) {
    console.error(err);
    toast.error('Failed to save certificate.', { id: 'save-certificate' });

  } finally {
    setIsSaving(false);
  }
};

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-800 p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Appreciation Certificate Details
      </h2>

      {/* Recipient Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Recipient Information
        </h3>
        <input
          type="text"
          placeholder="Recipient Name"
          value={certificateData.recipientName}
          onChange={(e) => updateCertificateData('recipientName', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Designation"
          value={certificateData.designation || ''}
          onChange={(e) => updateCertificateData('designation', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Appreciation Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Appreciation Details
        </h3>
        <textarea
          rows={4}
          placeholder="Reason for appreciation"
          value={certificateData.appreciationFor}
          onChange={(e) => updateCertificateData('appreciationFor', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Joining Date */}
<div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
    Joining Date
  </h3>
  <input
    type="date"
    value={certificateData.joiningDate || ''}
    onChange={(e) => updateCertificateData('joiningDate', e.target.value)}
    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
  />
</div>


      {/* Date */}
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Certificate Date
        </h3>
        <input
          type="date"
          value={certificateData.issueDate}
          onChange={(e) => updateCertificateData('issueDate', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      {/* Actions */}
<div className="space-y-3 pt-4">
  <div className="flex space-x-3">
    <button
      onClick={onPreview}
      className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium space-x-2"
    >
      <Eye className="h-5 w-5" />
      <span>Preview</span>
    </button>

    <button
      onClick={handleSave}
      disabled={isSaving}
      className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium space-x-2 disabled:opacity-50"
    >
      <Save className="h-5 w-5" />
      <span>{isSaving ? 'Saving...' : 'Save Certificate'}</span>
    </button>
  </div>

  {/* Download Button */}
  <button
    onClick={handleDownload}
    className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium space-x-2"
  >
    <Download className="h-5 w-5" />
    <span>Download Certificate (PDF)</span>
  </button>
</div>

    </div>
  );
};

export default AppreciationCertificateEditor;
