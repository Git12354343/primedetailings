// src/components/dashboard/ActiveJobBanner.jsx
import React from 'react';
import { Timer } from 'lucide-react';

const ActiveJobBanner = ({ activeJob, calculateWorkTime, onCompleteJob }) => {
  if (!activeJob) return null;

  return (
    <div className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            <div>
              <p className="font-medium">
                Active Job: {activeJob.customer.firstName} {activeJob.customer.lastName}
              </p>
              <p className="text-sm text-blue-100">
                Working for {calculateWorkTime(activeJob.id)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onCompleteJob(activeJob.id)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Complete Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveJobBanner;