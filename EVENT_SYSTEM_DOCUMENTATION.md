# UnityAid - Event & Help Request System

## Complete Volunteer Coordination Platform

UnityAid is a real-world NGO/emergency volunteer coordination platform that supports both organizer-created events and citizen-initiated help requests with real-time communication and status tracking.

---

## 🎯 System Overview

### Core Features

1. **Dual Event System**
   - **Organizer Events**: Organizations create volunteer events
   - **Citizen Requests**: Citizens request help from volunteers

2. **Real-Time Communication**
   - Socket.IO-powered live chat
   - Event-specific chat rooms
   - Message history persistence

3. **Status Tracking**
   - Visual progress tracker (4 stages)
   - Real-time status updates across all participants
   - Volunteer-controlled status progression

4. **Role-Based Permissions**
   - Strict access control by user role
   - Role-specific actions and views
   - Secure authentication middleware

5. **Skill Matching**
   - Automatic volunteer notifications based on skills
   - Skill-based event matching
   - Custom skill management

---

## 🗂️ Database Schema

### Event Model (Unified)

```javascript
{
  title: String (required),
  description: String (required),
  category: String,
  location: String (required),
  type: "organizer" | "citizen" (required),
  createdBy: ObjectId -> User (required),
  organizer: ObjectId -> User,
  assignedVolunteers: [ObjectId -> User],
  trackingStatus: "Pending" | "Assigned" | "In Progress" | "Completed",
  status: "upcoming" | "ongoing" | "completed" | "cancelled",
  requiredSkills: [String],
  startDateTime: Date,
  endDateTime: Date,
  volunteersNeeded: Number,
  contactInfo: String,
  createdAt: Date,
  updatedAt: Date
}
```

### User Model

```javascript
{
  fullName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: "citizen" | "volunteer" | "organizer" | "admin",
  phoneNumber: String,
  skills: [String],
  organizationName: String (for organizers),
  isAdminVerified: Boolean (for organizers),
  createdAt: Date,
  updatedAt: Date
}
```

### EventMessage Model

```javascript
{
  eventId: ObjectId -> Event (required),
  senderId: ObjectId -> User (required),
  senderName: String (required),
  senderRole: String (required),
  message: String (required),
  timestamp: Date,
  isRead: Boolean
}
```

---

## 🔄 User Flows

### Flow 1: Organizer Creates Event

```
1. Organizer logs in → Dashboard
2. Clicks "Create Event"
3. Fills form:
   - Title, Description, Category
   - Location, Date/Time
   - Required Skills
   - Volunteers Needed
4. Submits → Event created with type="organizer"
5. System Actions:
   - Notify all citizens about new event
   - Notify volunteers with matching skills
   - Set trackingStatus="Pending"
6. Event visible to:
   - All citizens (view only)
   - All volunteers (can accept)
   - Creating organizer (full control)
```

### Flow 2: Citizen Creates Help Request

```
1. Citizen logs in → Dashboard
2. Clicks "Request Help"
3. Fills form:
   - Title, Description, Category
   - Location
   - Required Skills (optional)
4. Submits → Event created with type="citizen"
5. System Actions:
   - Notify volunteers with matching skills
   - Set trackingStatus="Pending"
6. Request visible to:
   - Creating citizen (view + chat)
   - All volunteers (can accept)
   - All organizers (view only)
```

### Flow 3: Volunteer Accepts Event/Request

```
1. Volunteer views available events/requests
2. Sees skill-matched items highlighted
3. Clicks "Accept Request"
4. System Actions:
   - Add volunteer to assignedVolunteers array
   - Change trackingStatus from "Pending" → "Assigned"
   - Enable chat for volunteer
   - Notify creator (citizen or organizer)
5. Volunteer can now:
   - Access event chat
   - View creator details
   - Update status as work progresses
```

### Flow 4: Status Progression (Volunteer-Controlled)

```
Status Flow: Pending → Assigned → In Progress → Completed

Volunteer Actions:
- When volunteer accepts: Status = "Assigned"
- Volunteer clicks "Start Progress": Status = "In Progress"
- Volunteer clicks "Mark Complete": Status = "Completed"

Real-Time Updates:
- Status change emits socket event
- All participants see updated tracker
- Creator receives notification
- Status cannot be reversed
- Only assigned volunteers can update
```

### Flow 5: Real-Time Communication

```
Chat Access Rules:
- Event type="organizer":
  * Organizer (creator)
  * All assigned volunteers
  * Citizens (view only, unless organizer allows)

- Event type="citizen":
  * Citizen (creator)
  * Assigned volunteers only

Features:
- Text messages
- Real-time delivery via Socket.IO
- Message history saved to database
- Timestamps on all messages
- Sender identification (name + role)
```

---

## 🔐 Role-Based Permissions

### Citizen Role

**Can Do:**
- Create help requests (type="citizen")
- View all organizer events
- View their own requests
- Chat in their request room
- View assigned volunteers
- See real-time status updates
- View public event details

**Cannot Do:**
- Manually assign volunteers
- Update status
- Remove volunteers
- Create organizer events
- Access volunteer dashboard

### Volunteer Role

**Can Do:**
- View all events (organizer + citizen)
- Accept events/requests
- Update status (Assigned → In Progress → Completed)
- Chat in assigned events
- View skill-matched opportunities
- Manage personal skills

**Cannot Do:**
- Create events or requests
- Remove themselves after accepting
- Change status backwards
- Access events they're not assigned to

### Organizer Role

**Can Do:**
- Create events (type="organizer")
- View all help requests
- Assign volunteers to their events
- Chat in their events
- View volunteer list and skills
- Update event details
- View real-time progress

**Cannot Do:**
- Create citizen requests
- Update volunteer progress status
- Force-complete events
- Access other organizers' events

### Admin Role

**Can Do:**
- Verify organizers
- Monitor all system activity
- Access all events and requests
- View system analytics
- Manage users

---

## 🚀 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login
GET    /api/auth/current-user      - Get current user
```

### Citizen Endpoints
```
POST   /api/citizen/request        - Create help request
GET    /api/citizen/requests       - Get my requests
GET    /api/citizen/request/:id    - Get request details
GET    /api/citizen/events         - View all organizer events
GET    /api/citizen/notifications  - Get notifications
```

### Volunteer Endpoints
```
GET    /api/volunteer/available-events    - Get all events (skill-matched)
POST   /api/volunteer/event/:id/accept    - Accept event
PUT    /api/volunteer/event/:id/status    - Update event status
GET    /api/volunteer/my-events           - Get assigned events
GET    /api/volunteer/profile/skills      - Get skills
PUT    /api/volunteer/profile/skills      - Update skills
```

### Organizer Endpoints
```
POST   /api/organizer/event             - Create event
GET    /api/organizer/my-events         - Get my events
GET    /api/organizer/event/:id/details - Get event details
PUT    /api/organizer/event/:id/update  - Update event
GET    /api/organizer/help-requests     - View all citizen requests
GET    /api/organizer/volunteers        - Search volunteers by skill
```

### Public Endpoints
```
GET    /api/events/:eventId             - Get event details (any role)
```

---

## 🔌 Socket.IO Events

### Client → Server

```javascript
// Join event chat
socket.emit('joinEventChat', {
  eventId: string,
  userId: string,
  userName: string,
  userRole: string
})

// Send message
socket.emit('sendMessage', {
  eventId: string,
  message: string
})

// Join event room for status updates
socket.emit('joinEventRoom', {
  eventId: string,
  userId: string,
  userName: string,
  userRole: string
})

// Update status
socket.emit('updateStatus', {
  eventId: string,
  volunteerId: string,
  volunteerName: string,
  newStatus: string,
  fromStatus: string
})

// Leave rooms
socket.emit('leaveEventChat')
socket.emit('leaveEventRoom', { eventId })
```

### Server → Client

```javascript
// Message events
socket.on('receiveMessage', (data) => {
  // { id, senderId, senderName, senderRole, message, timestamp }
})

socket.on('userJoined', (data) => {
  // { message, timestamp }
})

socket.on('userLeft', (data) => {
  // { message, timestamp }
})

// Status events
socket.on('statusUpdated', (data) => {
  // { eventId, volunteerId, volunteerName, newStatus, fromStatus, timestamp, message }
})

// Error events
socket.on('messageError', (data) => {
  // { error: string }
})
```

---

## 📱 Frontend Components

### Pages

1. **EventDetailPage** (`/event/:eventId`)
   - Displays event/request details
   - Shows status tracker (real-time)
   - Lists assigned volunteers
   - Includes chat panel
   - "Accept Request" button (for volunteers)
   - Status update buttons (for assigned volunteers)

2. **CreateHelpRequestPage** (`/citizen/request/create`)
   - Form for citizens to create help requests
   - Category selection
   - Location input
   - Skill selection (quick select + custom)
   - Auto-notifies matching volunteers

3. **CreateEventPage** (`/organizer/event/create`)
   - Form for organizers to create events
   - Date/time selection
   - Volunteer capacity
   - Skill requirements
   - Auto-notifies citizens and volunteers

4. **EventsList** (Component)
   - Grid/list view of events
   - Filters by type (organizer/citizen)
   - Shows status badges
   - Skill match indicators
   - Click to view details

### Components

1. **StatusTracker**
   - 4-stage visual progress indicator
   - Highlights current status
   - Shows status transitions
   - Update buttons (for volunteers)

2. **ChatPanel**
   - Real-time message display
   - Message input
   - Sender identification
   - Timestamp display
   - Auto-scroll to latest

3. **NotificationBanner**
   - Bell icon with unread count
   - Dropdown notification list
   - Mark as read functionality
   - Auto-refresh every 30 seconds

---

## 🎨 Status Tracker UI

```
[1 Pending] ─── [2 Assigned] ─── [3 In Progress] ─── [4 Completed]
   (yellow)       (blue)            (purple)            (green)

Rules:
- Current status highlighted
- Previous statuses also highlighted
- Future statuses greyed out
- Progress line follows status
```

---

## 🧪 Testing the System

### Test Scenario 1: Citizen Help Request Flow

```bash
# 1. Register as citizen
POST /api/auth/register
{
  "fullName": "John Citizen",
  "email": "john@example.com",
  "password": "password123",
  "role": "citizen"
}

# 2. Login
POST /api/auth/login

# 3. Create help request
POST /api/citizen/request
{
  "title": "Need help with grocery shopping",
  "description": "Elderly person needs assistance",
  "category": "Elder Care",
  "location": "123 Main St",
  "requiredSkills": ["Driving", "Elder Care"]
}

# 4. Register as volunteer with matching skills
POST /api/auth/register
{
  "fullName": "Jane Volunteer",
  "email": "jane@example.com",
  "password": "password123",
  "role": "volunteer",
  "skills": ["Driving", "Elder Care"]
}

# 5. Volunteer accepts request
POST /api/volunteer/event/:eventId/accept

# 6. Check status (should be "Assigned")
GET /api/events/:eventId

# 7. Volunteer updates to "In Progress"
PUT /api/volunteer/event/:eventId/status
{ "status": "In Progress" }

# 8. Volunteer marks complete
PUT /api/volunteer/event/:eventId/status
{ "status": "Completed" }
```

### Test Scenario 2: Organizer Event Flow

```bash
# 1. Register as organizer
POST /api/auth/register
{
  "fullName": "Alice Organizer",
  "email": "alice@ngo.org",
  "password": "password123",
  "role": "organizer",
  "organizationName": "Community NGO"
}

# 2. Admin verifies organizer (manual step)

# 3. Create event
POST /api/organizer/event
{
  "title": "Community Food Drive",
  "description": "Distribute food to families",
  "category": "Food Distribution",
  "location": "Community Center",
  "startDateTime": "2025-03-01T09:00:00Z",
  "endDateTime": "2025-03-01T17:00:00Z",
  "requiredSkills": ["Food Distribution", "Logistics & Transport"],
  "volunteersNeeded": 10
}

# 4. Volunteers with matching skills receive notifications
# 5. Volunteers can accept and work together
```

---

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/unityaid
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- MongoDB v5+
- npm or yarn

### Installation

1. **Clone and Install Backend**
```bash
cd backend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. **Start Backend Server**
```bash
npm start
# Server runs on http://localhost:5000
```

4. **Install Frontend**
```bash
cd frontend
npm install
```

5. **Start Frontend Development Server**
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

6. **Create Admin User**
```bash
cd backend
node scripts/seedAdmin.js
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  - Pages: EventDetailPage, CreateHelpRequestPage    │
│  - Components: StatusTracker, ChatPanel, EventsList │
│  - Services: socketService, API client              │
│  - Contexts: AuthContext, NotificationContext       │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTP + WebSocket
                      │
┌─────────────────────▼───────────────────────────────┐
│              Backend (Express + Socket.IO)          │
│  - Routes: citizen, volunteer, organizer, auth      │
│  - Controllers: Business logic layer                │
│  - Middleware: Auth, Role checking                  │
│  - Socket.IO: Real-time events                      │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ Mongoose ODM
                      │
┌─────────────────────▼───────────────────────────────┐
│                   MongoDB Database                   │
│  - Collections: events, users, eventmessages,       │
│    notifications, uservolunteermessages             │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Key Design Decisions

1. **Unified Event Model**: Single model for both organizer events and citizen requests
   - Simpler database schema
   - Easier querying and filtering
   - Type field distinguishes source

2. **Volunteer-Controlled Status**: Only assigned volunteers can update status
   - Prevents unauthorized updates
   - Ensures authenticity of progress
   - Clear accountability

3. **Real-Time First**: Socket.IO for instant updates
   - Better user experience
   - Immediate feedback
   - Feels like real emergency coordination

4. **Skill-Based Matching**: Automatic volunteer notifications
   - Efficient volunteer deployment
   - Higher acceptance rates
   - Better matches for needs

5. **Role-Based Security**: Strict permission enforcement
   - Prevents unauthorized actions
   - Clear separation of concerns
   - Audit trail ready

---

## 🐛 Common Issues & Solutions

### Issue: Socket not connecting
**Solution**: Ensure backend server is running and CORS is properly configured

### Issue: Status not updating in real-time
**Solution**: Check that both users are in the same event room and Socket.IO connection is active

### Issue: Volunteer cannot update status
**Solution**: Verify volunteer is in assignedVolunteers array and current status allows progression

### Issue: Notifications not appearing
**Solution**: Check notification endpoints are accessible and token is valid

---

## 📈 Future Enhancements

- [ ] Push notifications (Firebase/OneSignal)
- [ ] File/image sharing in chat
- [ ] Location sharing on map
- [ ] Event calendar view
- [ ] Volunteer ratings and reviews
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Volunteer hour tracking

---

## 📄 License

MIT License - feel free to use this system for your volunteer coordination needs!

---

## 👥 Support

For issues, questions, or contributions, please refer to the project repository.

**Built with ❤️ for volunteer coordinators and community helpers**
