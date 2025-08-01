import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  MapPin, 
  User, 
  Wrench,
  Navigation,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';

const LiveJobFeed = ({ 
  jobs = [], 
  onJobClick, 
  onRefresh, 
  refreshInterval = 30000,
  showFilters = true 
}) => {
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) {
        onRefresh();
        setLastRefresh(new Date());
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [onRefresh, refreshInterval]);

  // Filter jobs based on search and status
  useEffect(() => {
    let filtered = jobs;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.customer.firstName.toLowerCase().includes(term) ||
        job.customer.lastName.toLowerCase().includes(term) ||
        job.customer.address.toLowerCase().includes(term) ||
        job.vehicle.make.toLowerCase().includes(term) ||
        job.vehicle.model.toLowerCase().includes(term) ||
        job.confirmationCode.toLowerCase().includes(term)
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter]);

  // Get status badge configuration
  const getStatusConfig = (status) => {
    const configs = {
      'CONFIRMED': {
        label: 'Assigned',
        color: 'bg-gray-100 text-gray-800',
        icon: User,
        priority: 1
      },
      'EN_ROUTE': {
        label: 'On the Way',
        color: 'bg-blue-100 text-blue-800',
        icon: Navigation,
        priority: 2
      },
      'STARTED': {
        label: 'Started',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Play,
        priority: 3
      },
      'IN_PROGRESS': {
        label: 'In Progress',
        color: 'bg-orange-100 text-orange-800',
        icon: Activity,
        priority: 4
      },
      'COMPLETED': {
        label: 'Completed',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        priority: 5
      }
    };
    return configs[status] || configs['CONFIRMED'];
  };

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = (job) => {
    if (job.status === 'COMPLETED') return 'Completed';
    
    // This would typically be calculated based on service duration and start time
    const baseTime = job.services.length * 30; // 30 minutes per service
    const extraTime = (job.extras?.length || 0) * 15; // 15 minutes per add-on
    const totalMinutes = baseTime + extraTime;
    
    if (job.status === 'IN_PROGRESS' && job.startTime) {
      const startTime = new Date(job.startTime);
      const now = new Date();
      const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
      const remaining = Math.max(0, totalMinutes - elapsedMinutes);
      
      if (remaining === 0) return 'Overdue';
      return `${Math.floor(remaining / 60)}h ${remaining % 60}m`;
    }
    
    return `~${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  };

  // Check if job is late/delayed
  const isJobDelayed = (job) => {
    if (job.status === 'COMPLETED') return false;
    
    const appointmentTime = new Date(`${job.date} ${job.time}`);
    const now = new Date();
    const delayThreshold = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    return now > appointmentTime + delayThreshold && job.status === 'CONFIRMED';
  };

  // Group jobs by status for better organization
  const groupedJobs = filteredJobs.reduce((groups, job) => {
    const status = job.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(job);
    return groups;
  }, {});

  // Sort status groups by priority
  const sortedStatusGroups = Object.entries(groupedJobs).sort(([a], [b]) => {
    const priorityA = getStatusConfig(a).priority;
    const priorityB = getStatusConfig(b).priority;
    return priorityA - priorityB;
  });

  const statusCounts = {
    ALL: jobs.length,
    CONFIRMED: jobs.filter(j => j.status === 'CONFIRMED').length,
    EN_ROUTE: jobs.filter(j => j.status === 'EN_ROUTE').length,
    STARTED: jobs.filter(j => j.status === 'STARTED').length,
    IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS').length,
    COMPLETED: jobs.filter(j => j.status === 'COMPLETED').length
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Live Job Feed</h3>
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {filteredJobs.length} active
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              Last update: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={() => {
                if (onRefresh) {
                  onRefresh();
                  setLastRefresh(new Date());
                }
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by customer, address, or vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'CONFIRMED', label: 'Assigned' },
                { key: 'EN_ROUTE', label: 'En Route' },
                { key: 'STARTED', label: 'Started' },
                { key: 'IN_PROGRESS', label: 'In Progress' },
                { key: 'COMPLETED', label: 'Completed' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label} ({statusCounts[key]})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Job Feed */}
      <div className="max-h-96 overflow-y-auto">
        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h4>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your filters or search terms.'
                : 'No active jobs at the moment.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedStatusGroups.map(([status, statusJobs]) => (
              <div key={status}>
                {/* Status Group Header */}
                <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center">
                    {React.createElement(getStatusConfig(status).icon, { 
                      className: "w-4 h-4 mr-2 text-gray-600" 
                    })}
                    <span className="text-sm font-medium text-gray-700">
                      {getStatusConfig(status).label} ({statusJobs.length})
                    </span>
                  </div>
                </div>

                {/* Jobs in this status */}
                {statusJobs.map((job) => {
                  const statusConfig = getStatusConfig(job.status);
                  const StatusIcon = statusConfig.icon;
                  const isDelayed = isJobDelayed(job);
                  const estimatedTime = getEstimatedTimeRemaining(job);

                  return (
                    <div
                      key={job.id}
                      onClick={() => onJobClick && onJobClick(job)}
                      className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isDelayed ? 'border-l-4 border-red-500 bg-red-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Customer and Job Info */}
                          <div className="flex items-center mb-2">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} mr-3`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </div>
                            {isDelayed && (
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Delayed
                              </div>
                            )}
                          </div>

                          <div className="flex items-center mb-1">
                            <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate">
                              {job.customer.firstName} {job.customer.lastName}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              #{job.confirmationCode}
                            </span>
                          </div>

                          <div className="flex items-center mb-1">
                            <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {job.customer.address}, {job.customer.city}
                            </span>
                          </div>

                          <div className="flex items-center mb-2">
                            <Wrench className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                            </span>
                          </div>

                          {/* Services */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {job.services.slice(0, 3).map((service, index) => (
                              <span
                                key={index}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {service}
                              </span>
                            ))}
                            {job.services.length > 3 && (
                              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                +{job.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Time and Detailer Info */}
                        <div className="ml-4 text-right flex-shrink-0">
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {job.time}
                          </div>
                          
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {estimatedTime}
                          </div>

                          {job.detailer && (
                            <div className="text-xs text-gray-500">
                              {job.detailer.name}
                            </div>
                          )}

                          {/* Priority Indicator */}
                          {job.status === 'IN_PROGRESS' && (
                            <div className="mt-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar for In Progress Jobs */}
                      {job.status === 'IN_PROGRESS' && job.startTime && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>Started {new Date(job.startTime).toLocaleTimeString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min(100, Math.max(10, 
                                  ((new Date() - new Date(job.startTime)) / (1000 * 60 * 90)) * 100
                                ))}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Live updates every {refreshInterval / 1000}s</span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span>Connected</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>{filteredJobs.filter(j => j.status === 'IN_PROGRESS').length} active jobs</span>
            <span>{filteredJobs.filter(j => isJobDelayed(j)).length} delayed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveJobFeed;