import { useParams, Navigate } from 'react-router-dom'
import UserDashboard from './dashboards/UserDashboard'
import VolunteerDashboard from './dashboards/VolunteerDashboard'
import OrganizerDashboard from './dashboards/OrganizerDashboard'

const Dashboard = () => {
  const { role } = useParams()

  // Route to appropriate dashboard based on role
  switch (role?.toLowerCase()) {
    case 'user':
      return <UserDashboard />
    case 'volunteer':
      return <VolunteerDashboard />
    case 'organizer':
      return <OrganizerDashboard />
    default:
      return <Navigate to="/" replace />
  }
}

export default Dashboard

