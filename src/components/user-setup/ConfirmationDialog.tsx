import React from 'react';
import { X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  avatarPreview: string | null;
}

export function ConfirmationDialog({ isOpen, onConfirm, onCancel, avatarPreview }: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-96 max-w-[90%]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Save Avatar?</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-center mb-6">
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-500"
            />
          )}
        </div>
        <p className="text-gray-600 mb-6">Are you sure you want to save this avatar?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}