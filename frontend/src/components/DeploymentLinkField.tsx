import React, { useState } from 'react';
import { ExternalLink, Edit2, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeploymentLinkFieldProps {
  deploymentLink?: string;
  canEdit: boolean;
  onUpdate: (newLink: string) => Promise<void>;
  variant?: 'compact' | 'full';
}

const DeploymentLinkField: React.FC<DeploymentLinkFieldProps> = ({
  deploymentLink,
  canEdit,
  onUpdate,
  variant = 'full'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(deploymentLink || '');
  const [isSaving, setIsSaving] = useState(false);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    if (trimmedValue && !validateUrl(trimmedValue)) {
      toast.error('Invalid URL. Must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(trimmedValue);
      setIsEditing(false);
      toast.success('Deployment link updated successfully');
    } catch (error) {
      toast.error('Failed to update deployment link');
      console.error('Error updating deployment link:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(deploymentLink || '');
    setIsEditing(false);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
        <span className="text-gray-600 dark:text-gray-400">Deployment:</span>

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              disabled={isSaving}
              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
              title="Save"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              disabled={isSaving}
              className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {deploymentLink ? (
              <a
                href={deploymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="truncate max-w-[150px]">{deploymentLink}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            ) : (
              <span className="text-gray-500 dark:text-gray-500 text-xs">No link added</span>
            )}
            {canEdit && (
              <button
                onClick={handleStartEdit}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Edit deployment link"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deployment:</span>

      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {deploymentLink ? (
            <a
              href={deploymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
            >
              <span>{deploymentLink}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-gray-500 dark:text-gray-500 text-sm">No deployment link added</span>
          )}
          {canEdit && (
            <button
              onClick={handleStartEdit}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Edit deployment link"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeploymentLinkField;
