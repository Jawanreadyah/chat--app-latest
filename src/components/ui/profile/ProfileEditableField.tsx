import React from 'react';
import { Edit2, Save, X } from 'lucide-react';

interface ProfileEditableFieldProps {
  fieldName: string;
  fieldLabel: string;
  fieldValue: string;
  isEditing: boolean;
  editValue: string;
  isUpdating: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isTextArea?: boolean;
  icon?: React.ReactNode;
  canEdit?: boolean;
}

export function ProfileEditableField({
  fieldName,
  fieldLabel,
  fieldValue,
  isEditing,
  editValue,
  isUpdating,
  onEdit,
  onCancel,
  onSave,
  onChange,
  isTextArea = false,
  icon,
  canEdit = true
}: ProfileEditableFieldProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-300 text-sm font-medium flex items-center">
          {icon && <span className="mr-1">{icon}</span>}
          {fieldLabel}
        </h3>
        {canEdit && !isEditing && (
          <button 
            onClick={onEdit}
            className="text-gray-400 hover:text-gray-300"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div>
          {isTextArea ? (
            <textarea
              name={fieldName}
              value={editValue}
              onChange={onChange}
              className="w-full bg-[#1a1b1e] text-white border border-[#404040] rounded p-2 mb-2"
              rows={3}
              autoFocus
            />
          ) : (
            <input
              type="text"
              name={fieldName}
              value={editValue}
              onChange={onChange}
              className="w-full bg-[#1a1b1e] text-white border border-[#404040] rounded p-2 mb-2"
              autoFocus
            />
          )}
          <div className="flex justify-end space-x-2">
            <button 
              onClick={onSave}
              disabled={isUpdating}
              className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors flex items-center space-x-1"
            >
              {isUpdating && <span className="animate-spin">⟳</span>}
              <span>Save</span>
            </button>
            <button 
              onClick={onCancel}
              className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-200">
          {fieldValue || (canEdit ? `Add your ${fieldLabel.toLowerCase()}` : 'Not specified')}
        </p>
      )}
    </div>
  );
}