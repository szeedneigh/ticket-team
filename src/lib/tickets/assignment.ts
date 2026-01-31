/**
 * Ticket Assignment Utilities
 *
 * Reusable helpers for auto-assigning tickets to staff.
 * Wraps suggestStaffAssignment from escalation-utils.
 */

import { suggestStaffAssignment } from '@/lib/chat/escalation-utils'

/**
 * Map ticket priority to the priority format expected by suggestStaffAssignment
 */
function mapPriority(priority: string): 'low' | 'medium' | 'high' {
  switch (priority) {
    case 'urgent':
    case 'critical':
      return 'high'
    case 'low':
      return 'low'
    case 'medium':
      return 'medium'
    case 'high':
      return 'high'
    default:
      return 'medium'
  }
}

/**
 * Pick the best staff member for a new ticket based on workload and category specialty.
 *
 * @param params - Category and priority of the ticket
 * @returns Staff ID or null if no staff available
 */
export async function pickAssigneeForTicket(params: {
  category: string
  priority: string
}): Promise<string | null> {
  const suggestion = await suggestStaffAssignment({
    category: params.category,
    priority: mapPriority(params.priority),
    description: '',
  })
  return suggestion?.staffId ?? null
}
