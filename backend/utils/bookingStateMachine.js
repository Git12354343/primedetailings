/**
 * Booking State Machine
 * Enforces valid state transitions and permissions
 * Prevents invalid jumps and ensures workflow integrity
 */

const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  EN_ROUTE: 'EN_ROUTE',
  STARTED: 'STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
  NO_SHOW: 'NO_SHOW'
};

const UserRole = {
  CUSTOMER: 'CUSTOMER',
  DETAILER: 'DETAILER',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM'
};

/**
 * State transition rules
 * Format: { from: [allowed_to_states] }
 */
const STATE_TRANSITIONS = {
  [BookingStatus.PENDING]: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELED
  ],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.EN_ROUTE,
    BookingStatus.CANCELED,
    BookingStatus.NO_SHOW
  ],
  [BookingStatus.EN_ROUTE]: [
    BookingStatus.STARTED,
    BookingStatus.CANCELED,
    BookingStatus.NO_SHOW
  ],
  [BookingStatus.STARTED]: [
    BookingStatus.IN_PROGRESS,
    BookingStatus.CANCELED
  ],
  [BookingStatus.IN_PROGRESS]: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELED
  ],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELED]: [],
  [BookingStatus.NO_SHOW]: []
};

/**
 * Role permissions for each status
 * Format: { status: [allowed_roles] }
 */
const STATUS_PERMISSIONS = {
  [BookingStatus.PENDING]: [UserRole.SYSTEM],
  [BookingStatus.CONFIRMED]: [UserRole.ADMIN, UserRole.SYSTEM],
  [BookingStatus.EN_ROUTE]: [UserRole.DETAILER, UserRole.ADMIN],
  [BookingStatus.STARTED]: [UserRole.DETAILER, UserRole.ADMIN],
  [BookingStatus.IN_PROGRESS]: [UserRole.DETAILER, UserRole.ADMIN],
  [BookingStatus.COMPLETED]: [UserRole.DETAILER, UserRole.ADMIN],
  [BookingStatus.CANCELED]: [UserRole.CUSTOMER, UserRole.DETAILER, UserRole.ADMIN],
  [BookingStatus.NO_SHOW]: [UserRole.DETAILER, UserRole.ADMIN]
};

/**
 * Required fields for each status transition
 */
const REQUIRED_FIELDS = {
  [BookingStatus.CONFIRMED]: ['detailerId'],
  [BookingStatus.EN_ROUTE]: ['enRouteAt'],
  [BookingStatus.STARTED]: ['startedAt'],
  [BookingStatus.COMPLETED]: ['completedAt']
};

/**
 * Validate if a state transition is allowed
 * @param {string} currentStatus - Current booking status
 * @param {string} newStatus - Desired new status
 * @param {string} userRole - Role of user making the change
 * @param {object} booking - Current booking object
 * @returns {object} { valid: boolean, error?: string }
 */
function validateTransition(currentStatus, newStatus, userRole, booking = {}) {
  // Check if transition is valid
  const allowedTransitions = STATE_TRANSITIONS[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid state transition from ${currentStatus} to ${newStatus}`,
      code: 'INVALID_TRANSITION'
    };
  }

  // Check if user has permission for this status
  const allowedRoles = STATUS_PERMISSIONS[newStatus];
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return {
      valid: false,
      error: `Role ${userRole} not authorized to set status ${newStatus}`,
      code: 'UNAUTHORIZED_TRANSITION'
    };
  }

  // Check required fields
  const requiredFields = REQUIRED_FIELDS[newStatus] || [];
  for (const field of requiredFields) {
    if (!booking[field] && field !== 'detailerId') {
      return {
        valid: false,
        error: `Field ${field} is required for status ${newStatus}`,
        code: 'MISSING_REQUIRED_FIELD'
      };
    }
  }

  // Special validation: EN_ROUTE requires assigned detailer
  if (newStatus === BookingStatus.EN_ROUTE && !booking.detailerId) {
    return {
      valid: false,
      error: 'Detailer must be assigned before marking as en route',
      code: 'DETAILER_NOT_ASSIGNED'
    };
  }

  return { valid: true };
}

/**
 * Get timestamp field name for a status
 * @param {string} status - Booking status
 * @returns {string|null} - Timestamp field name
 */
function getTimestampField(status) {
  const timestampMap = {
    [BookingStatus.EN_ROUTE]: 'enRouteAt',
    [BookingStatus.STARTED]: 'startedAt',
    [BookingStatus.COMPLETED]: 'completedAt'
  };
  return timestampMap[status] || null;
}

/**
 * Get all allowed next states for current status
 * @param {string} currentStatus - Current booking status
 * @param {string} userRole - Role of user
 * @returns {array} - Array of allowed next statuses
 */
function getAllowedNextStates(currentStatus, userRole) {
  const transitions = STATE_TRANSITIONS[currentStatus] || [];
  return transitions.filter(status => {
    const allowedRoles = STATUS_PERMISSIONS[status] || [];
    return allowedRoles.includes(userRole);
  });
}

/**
 * Check if status is terminal (no further transitions)
 * @param {string} status - Booking status
 * @returns {boolean}
 */
function isTerminalStatus(status) {
  return [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELED,
    BookingStatus.NO_SHOW
  ].includes(status);
}

/**
 * Get human-readable status description
 * @param {string} status - Booking status
 * @returns {string}
 */
function getStatusDescription(status) {
  const descriptions = {
    [BookingStatus.PENDING]: 'Waiting for confirmation',
    [BookingStatus.CONFIRMED]: 'Confirmed and scheduled',
    [BookingStatus.EN_ROUTE]: 'Detailer is on the way',
    [BookingStatus.STARTED]: 'Service has started',
    [BookingStatus.IN_PROGRESS]: 'Service in progress',
    [BookingStatus.COMPLETED]: 'Service completed',
    [BookingStatus.CANCELED]: 'Booking canceled',
    [BookingStatus.NO_SHOW]: 'Customer did not show up'
  };
  return descriptions[status] || status;
}

/**
 * Calculate estimated completion time based on status and service duration
 * @param {string} status - Current booking status
 * @param {number} estimatedDuration - Estimated duration in minutes
 * @param {Date} startedAt - When service started
 * @returns {Date|null}
 */
function getEstimatedCompletion(status, estimatedDuration, startedAt) {
  if (!startedAt || !estimatedDuration) return null;
  
  const inProgressStatuses = [
    BookingStatus.STARTED,
    BookingStatus.IN_PROGRESS
  ];
  
  if (!inProgressStatuses.includes(status)) return null;
  
  const completionTime = new Date(startedAt);
  completionTime.setMinutes(completionTime.getMinutes() + estimatedDuration);
  
  return completionTime;
}

module.exports = {
  BookingStatus,
  UserRole,
  validateTransition,
  getTimestampField,
  getAllowedNextStates,
  isTerminalStatus,
  getStatusDescription,
  getEstimatedCompletion,
  STATE_TRANSITIONS,
  STATUS_PERMISSIONS
};