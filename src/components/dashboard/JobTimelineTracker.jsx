import React from 'react';
import { 
  Clock, 
  Navigation, 
  Play, 
  Activity, 
  CheckCircle,
  MapPin,
  Timer,
  User,
  Loader2
} from 'lucide-react';

const JobTimelineTracker = ({ 
  booking, 
  timeTracking, 
  onStartNavigation,
  onStatusUpdate 
}) => {
  // Timeline stages with their corresponding statuses and icons
  const timelineStages = [
    {
      key: 'assigned',
      label: 'Assigned',
      icon: User,
      status: 'CONFIRMED',
      color: 'bg-gray-500',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
      timestamp: booking?.createdAt
    },
    {
      key: 'on_way',
      label: 'On the Way',
      icon: Navigation,
      status: 'EN_ROUTE',
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      timestamp: booking?.enRouteAt
    },
    {
      key: 'started',
      label: 'Started',
      icon: Play,
      status: 'STARTED',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      timestamp: booking?.startedAt
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: Activity,
      status: 'IN_PROGRESS',
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      timestamp: timeTracking?.startTime
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: CheckCircle,
      status: 'COMPLETED',
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      timestamp: timeTracking?.endTime || booking?.completedAt
    }
  ];

  // Get current stage index based on booking status
  const getCurrentStageIndex = () => {
    const statusMap = {
      'CONFIRMED': 0,
      'EN_ROUTE': 1,
      'STARTED': 2,
      'IN_PROGRESS': 3,
      'COMPLETED': 4
    };
    return statusMap[booking?.status] || 0;
  };

  const currentStageIndex = getCurrentStageIndex();

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return null;
    }
  };

  // Check if stage is completed
  const isStageCompleted = (index) => index < currentStageIndex;
  const isCurrentStage = (index) => index === currentStageIndex;
  const isFutureStage = (index) => index > currentStageIndex;

  // Handle stage action buttons
  const handleStageAction = (stage, index) => {
    if (index === currentStageIndex) {
      switch (stage.key) {
        case 'on_way':
          if (onStartNavigation) {
            onStartNavigation(booking);
          }
          if (onStatusUpdate) {
            onStatusUpdate(booking.id, 'EN_ROUTE');
          }
          break;
        case 'started':
          if (onStatusUpdate) {
            onStatusUpdate(booking.id, 'STARTED');
          }
          break;
        case 'in_progress':
          if (onStatusUpdate) {
            onStatusUpdate(booking.id, 'IN_PROGRESS');
          }
          break;
        case 'completed':
          if (onStatusUpdate) {
            onStatusUpdate(booking.id, 'COMPLETED');
          }
          break;
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Timer className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Job Progress</h3>
        </div>
        <div className="text-sm text-gray-500">
          {booking?.customer?.firstName} {booking?.customer?.lastName}
        </div>
      </div>

      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
              style={{ width: `${(currentStageIndex / (timelineStages.length - 1)) * 100}%` }}
            />
          </div>

          {/* Timeline Stages */}
          <div className="flex justify-between relative">
            {timelineStages.map((stage, index) => {
              const Icon = stage.icon;
              const completed = isStageCompleted(index);
              const current = isCurrentStage(index);
              const future = isFutureStage(index);
              const timestamp = formatTimestamp(stage.timestamp);

              return (
                <div key={stage.key} className="flex flex-col items-center relative">
                  {/* Stage Icon */}
                  <button
                    onClick={() => handleStageAction(stage, index)}
                    disabled={future}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${
                      completed 
                        ? `${stage.color} text-white border-transparent` 
                        : current
                        ? `bg-white ${stage.textColor} border-current shadow-lg scale-110`
                        : 'bg-gray-100 text-gray-400 border-gray-300'
                    } ${
                      current && !future ? 'cursor-pointer hover:scale-125' : ''
                    } ${
                      future ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    {current && booking?.status !== 'COMPLETED' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </button>

                  {/* Stage Label and Timestamp */}
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-medium ${
                      completed || current ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {stage.label}
                    </div>
                    {timestamp && (
                      <div className="text-xs text-gray-500 mt-1">
                        ✅ {timestamp}
                      </div>
                    )}
                    {current && !timestamp && (
                      <div className="text-xs text-blue-600 mt-1 font-medium">
                        Current
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Timeline */}
      <div className="md:hidden space-y-3">
        {timelineStages.map((stage, index) => {
          const Icon = stage.icon;
          const completed = isStageCompleted(index);
          const current = isCurrentStage(index);
          const future = isFutureStage(index);
          const timestamp = formatTimestamp(stage.timestamp);

          return (
            <div 
              key={stage.key} 
              className={`flex items-center p-3 rounded-lg border transition-all duration-300 ${
                completed 
                  ? `${stage.bgColor} border-transparent` 
                  : current
                  ? `${stage.bgColor} border-current shadow-md`
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Stage Icon */}
              <button
                onClick={() => handleStageAction(stage, index)}
                disabled={future}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mr-3 transition-all duration-300 ${
                  completed 
                    ? `${stage.color} text-white border-transparent` 
                    : current
                    ? `bg-white ${stage.textColor} border-current`
                    : 'bg-gray-200 text-gray-400 border-gray-300'
                } ${
                  current && !future ? 'cursor-pointer' : ''
                } ${
                  future ? 'cursor-not-allowed' : ''
                }`}
              >
                {current && booking?.status !== 'COMPLETED' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </button>

              {/* Stage Info */}
              <div className="flex-1">
                <div className={`font-medium ${
                  completed || current ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {stage.label}
                </div>
                {timestamp && (
                  <div className="text-sm text-gray-500">
                    ✅ {timestamp}
                  </div>
                )}
                {current && !timestamp && (
                  <div className="text-sm text-blue-600 font-medium">
                    Current Stage
                  </div>
                )}
              </div>

              {/* Action Indicator */}
              {current && !future && (
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Tap to advance
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      {booking?.status === 'CONFIRMED' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (onStartNavigation) {
                onStartNavigation(booking);
              }
              if (onStatusUpdate) {
                onStatusUpdate(booking.id, 'EN_ROUTE');
              }
            }}
            className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Start Navigation & Go En Route
          </button>
        </div>
      )}

      {/* Time Tracking Display */}
      {timeTracking?.isActive && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Active work time:</span>
            <span className="font-mono font-bold text-blue-600">
              {/* You can pass calculateWorkTime function here */}
              {timeTracking?.workTime || '0h 0m'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTimelineTracker;