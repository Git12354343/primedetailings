// src/components/dashboard/NotesModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

const NotesModal = ({ booking, onClose, onSave }) => {
  const [notes, setNotes] = useState(booking?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(booking.id, notes);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">
              Job Notes - {booking.customer.firstName} {booking.customer.lastName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Private Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-white/15 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Add private notes about this job... (e.g., customer preferences, gate codes, specific instructions, job observations)"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes are private and only visible to detailers
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/15 rounded-md text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-400 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;