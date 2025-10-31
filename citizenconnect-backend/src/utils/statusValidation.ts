/*
 * Status Validation Helper
 * Location: src/utils/statusValidation.ts
 * Purpose: Validate status transitions for 5-stage pipeline
 */

export enum ComplaintStatus {
  Raised = "Raised",
  Acknowledged = "Acknowledged",
  InProgress = "InProgress",
  Resolved = "Resolved",
  Closed = "Closed",
}

// Define valid transitions
const validTransitions: { [key: string]: ComplaintStatus[] } = {
  [ComplaintStatus.Raised]: [ComplaintStatus.Acknowledged],
  [ComplaintStatus.Acknowledged]: [ComplaintStatus.InProgress, ComplaintStatus.Raised], // Can go back to Raised if needed
  [ComplaintStatus.InProgress]: [ComplaintStatus.Resolved, ComplaintStatus.Acknowledged], // Can go back to Acknowledged
  [ComplaintStatus.Resolved]: [ComplaintStatus.Closed, ComplaintStatus.InProgress], // Can reopen if issue persists
  [ComplaintStatus.Closed]: [], // Final state - cannot change
};

/**
 * Check if status transition is valid
 */
export const isValidStatusTransition = (
  currentStatus: string,
  newStatus: string
): { valid: boolean; message?: string } => {
  // Convert to enum values
  const current = currentStatus as ComplaintStatus;
  const next = newStatus as ComplaintStatus;

  // Check if new status is a valid enum value
  if (!Object.values(ComplaintStatus).includes(next)) {
    return {
      valid: false,
      message: `Invalid status: ${newStatus}. Must be one of: ${Object.values(ComplaintStatus).join(", ")}`,
    };
  }

  // Can't change from Closed status
  if (current === ComplaintStatus.Closed) {
    return {
      valid: false,
      message: "Cannot change status of a closed complaint",
    };
  }

  // Check if transition is allowed
  const allowedTransitions = validTransitions[current] || [];
  
  if (!allowedTransitions.includes(next)) {
    return {
      valid: false,
      message: `Cannot transition from ${current} to ${next}. Valid next states: ${allowedTransitions.join(", ") || "None"}`,
    };
  }

  return { valid: true };
};

/**
 * Get next possible statuses for current status
 */
export const getNextPossibleStatuses = (currentStatus: string): ComplaintStatus[] => {
  return validTransitions[currentStatus as ComplaintStatus] || [];
};

/**
 * Get status progression percentage
 */
export const getStatusProgressPercentage = (status: string): number => {
  const progressMap: { [key: string]: number } = {
    [ComplaintStatus.Raised]: 20,
    [ComplaintStatus.Acknowledged]: 40,
    [ComplaintStatus.InProgress]: 60,
    [ComplaintStatus.Resolved]: 80,
    [ComplaintStatus.Closed]: 100,
  };

  return progressMap[status] || 0;
};

/**
 * Get human-readable status name
 */
export const getStatusDisplayName = (status: string): string => {
  const displayNames: { [key: string]: string } = {
    [ComplaintStatus.Raised]: "Raised",
    [ComplaintStatus.Acknowledged]: "Acknowledged",
    [ComplaintStatus.InProgress]: "In Progress",
    [ComplaintStatus.Resolved]: "Resolved",
    [ComplaintStatus.Closed]: "Closed",
  };

  return displayNames[status] || status;
};