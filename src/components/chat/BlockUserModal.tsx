import React from 'react';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: () => void;
  error: string | null;
}

export function BlockUserModal({ isOpen, onClose, onBlock, error }: BlockUserModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a2b2e] rounded-lg shadow-xl p-6 w-96 max-w-[90%]">
        <h3 className="text-xl font-semibold text-white mb-4">Block User</h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to block this user? You won't see their messages anymore until you unblock them.
        </p>
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onBlock}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Block User
          </button>
        </div>
      </div>
    </div>
  );
}