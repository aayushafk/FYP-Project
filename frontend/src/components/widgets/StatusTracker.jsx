import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import '../styles/StatusTracker.css'

const StatusTracker = ({
  eventId,
  currentStatus = 'Pending',
  volunteerStatus = null,
  assignedVolunteers = [],
  currentUserId,
  onStatusUpdate,
  onLoadingChange
}) => {
  const { user } = useAuth()
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [updating, setUpdating] = useState(false)

  const STATUS_STAGES = ['Pending', 'Assigned', 'In Progress', 'Completed']
  const STATUS_LABELS = {
    'Pending': 'Pending',
    'Assigned': 'Assigned',
    'In Progress': 'In Progress',
    'Completed': 'Completed'
  }

  // Check if current user is an assigned volunteer
  const isAssignedVolunteer = assignedVolunteers?.some(
    volunteer => volunteer._id === currentUserId || volunteer === currentUserId
  )

  // Determine which status to display
  const displayStatus = volunteerStatus || currentStatus

  // Get current status index
  const currentStatusIndex = STATUS_STAGES.indexOf(displayStatus)

  // Check if volunteer can update status
  const canUpdateStatus = user?.role === 'volunteer' && isAssignedVolunteer

  // Get allowed transitions for volunteer
  const getAllowedTransitions = () => {
    const allowed = []
    if (displayStatus === 'Assigned') {
      allowed.push('In Progress')
    } else if (displayStatus === 'In Progress') {
      allowed.push('Completed')
    }
    return allowed
  }

  const allowedTransitions = getAllowedTransitions()

  const handleStatusClick = (newStatus) => {
    if (!canUpdateStatus) return
    if (!allowedTransitions.includes(newStatus)) return

    setConfirmDialog({
      from: displayStatus,
      to: newStatus
    })
  }

  const confirmStatusChange = async () => {
    if (!confirmDialog) return

    setUpdating(true)
    onLoadingChange?.(true)

    try {
      await onStatusUpdate({
        eventId,
        newStatus: confirmDialog.to,
        fromStatus: confirmDialog.from
      })
      setConfirmDialog(null)
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
      onLoadingChange?.(false)
    }
  }

  const getStatusProgressPercentage = () => {
    return ((currentStatusIndex + 1) / STATUS_STAGES.length) * 100
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#gray'
      case 'Assigned':
        return '#blue'
      case 'In Progress':
        return '#orange'
      case 'Completed':
        return '#green'
      default:
        return '#gray'
    }
  }

  return (
    <div className="status-tracker">
      <div className="status-header">
        <h3>Task Status</h3>
        <span className={`status-badge status-${displayStatus.toLowerCase().replace(' ', '-')}`}>
          {STATUS_LABELS[displayStatus]}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${getStatusProgressPercentage()}%`
            }}
          />
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper-container">
        {STATUS_STAGES.map((stage, index) => (
          <div key={stage} className="stepper-item">
            <div
              className={`stepper-step ${
                index <= currentStatusIndex ? 'completed' : ''
              } ${index === currentStatusIndex ? 'active' : ''}`}
              style={{
                backgroundColor:
                  index <= currentStatusIndex
                    ? getStatusColor(stage)
                    : '#e0e0e0'
              }}
            >
              {index <= currentStatusIndex ? '✓' : index + 1}
            </div>
            <span className="step-label">{stage}</span>

            {/* Action Buttons for Volunteer */}
            {canUpdateStatus &&
              allowedTransitions.includes(stage) &&
              stage === STATUS_STAGES[currentStatusIndex + 1] && (
                <button
                  className="update-status-btn"
                  onClick={() => handleStatusClick(stage)}
                  disabled={updating}
                  title={`Update to ${stage}`}
                >
                  ↓
                </button>
              )}
          </div>
        ))}
      </div>

      {/* Info Text */}
      <div className="status-info">
        {user?.role === 'volunteer' && isAssignedVolunteer && (
          <p className="info-volunteer">
            {allowedTransitions.length > 0
              ? `You can update status to: ${allowedTransitions.join(', ')}`
              : 'Task is complete. No further updates available.'}
          </p>
        )}
        {(user?.role === 'organizer' || user?.role === 'user') && (
          <p className="info-readonly">
            Waiting for volunteer to update task status
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <h4>Confirm Status Update</h4>
            <p>
              Are you sure you want to update the status from{' '}
              <strong>{confirmDialog.from}</strong> to{' '}
              <strong>{confirmDialog.to}</strong>?
            </p>
            <div className="dialog-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmDialog(null)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={confirmStatusChange}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusTracker
