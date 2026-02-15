# UnityAid - Volunteer Coordination Platform

A professional MERN stack web application for managing volunteer coordination, community events, and emergency support.

## 🚀 NEW: Complete Event & Help Request System

**UnityAid now features a comprehensive, real-world volunteer coordination system!**

### Key Features

✅ **Dual Event System**
- Organizer-created events for community activities
- Citizen-initiated help requests for immediate assistance
- Unified event model with role-based permissions

✅ **Real-Time Communication**
- Socket.IO-powered live chat in event rooms
- Instant message delivery with persistence
- Participant-specific chat access

✅ **Live Status Tracking**
- 4-stage visual progress tracker (Pending → Assigned → In Progress → Completed)
- Real-time status updates across all participants
- Volunteer-controlled status progression

✅ **Smart Skill Matching**
- Automatic volunteer notifications based on required skills
- Skill-based event filtering and matching
- Custom skill management for volunteers

✅ **Strict Role Permissions**
- Citizens: Create help requests, view events
- Volunteers: Accept events, update status, chat
- Organizers: Create events, manage volunteers
- Complete access control at every level

### Quick Links

📖 **[Complete Documentation](EVENT_SYSTEM_DOCUMENTATION.md)** - Full system guide  
⚡ **[Quick Setup Guide](QUICK_SETUP_GUIDE.md)** - Get started in 5 minutes  
📋 **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical details  

### Testing the System

```bash
# Run automated integration tests
node test-event-system.js
```

---

## Original Features

- **Beautiful Homepage**: Attractive landing page with images and professional design
- **Authentication System**: Complete login and registration with JWT tokens
- **Role-based Access**: User, Volunteer, and Organizer roles with different dashboards
- **Professional UI**: Modern, responsive design using Tailwind CSS
- **Backend API**: Express.js server with MongoDB and JWT authentication

## Tech Stack

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios
- Vite
- Socket.IO Client (NEW)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Socket.IO (NEW)

## Project Structure

```
unityaid/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components (NEW: EventDetailPage, CreateHelpRequestPage)
│   │   ├── services/     # Services (NEW: Enhanced socketService)
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/              # Express backend API
│   ├── models/           # MongoDB models (UPDATED: Event model)
│   ├── routes/           # API routes (UPDATED: All role routes)
│   ├── controllers/      # Business logic (NEW: Complete implementations)
│   ├── middleware/       # Express middleware
│   ├── server.js         # Server entry point (Socket.IO integrated)
│   └── package.json
├── test-event-system.js  # Integration test suite (NEW)
├── EVENT_SYSTEM_DOCUMENTATION.md  # Complete documentation (NEW)
├── QUICK_SETUP_GUIDE.md  # Setup guide (NEW)
├── IMPLEMENTATION_SUMMARY.md  # Technical summary (NEW)
└── package.json          # Root package.json
```

## Installation

### 1. Install all dependencies

```bash
npm run install-all
```

Or install separately:

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Set up environment variables

Create a `.env` file in the `backend` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/unityaid
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Start MongoDB

Make sure MongoDB is running on your system. If using MongoDB Atlas, update the `MONGO_URI` in `.env`.

### 4. Run the application

From the root directory:

```bash
npm run dev
```

This will start both frontend (port 3000) and backend (port 5000) servers concurrently.

Or run separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Request Examples

#### Register
```json
POST /api/auth/register
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Volunteer",
  "skills": ["Medical", "Rescue"]
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123",
  "role": "Volunteer"
}
```

## User Roles

- **User**: Can view events and request assistance
- **Volunteer**: Can browse and join events, track hours
- **Organizer**: Can create and manage events, coordinate volunteers

## Development

### Available Scripts

**Root:**
- `npm run dev` - Start both frontend and backend
- `npm run install-all` - Install all dependencies

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## Security Notes

- Change `JWT_SECRET` in production
- Use strong passwords
- Implement rate limiting in production
- Use HTTPS in production
- Validate and sanitize all inputs

## License

© 2024 UnityAid. All rights reserved.

