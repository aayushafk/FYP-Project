# UnityAid Event & Help Request System - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Start MongoDB
```bash
# Make sure MongoDB is running
mongod
# Or if using MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # Mac
```

### Step 2: Setup Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the server
npm start
```

**Expected Output:**
```
MongoDB connected successfully
Server running on port 5000
Socket.IO server ready for connections
```

### Step 3: Setup Frontend
```bash
# Open a new terminal
cd frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
VITE ready in xxx ms
Local: http://localhost:5173/
```

### Step 4: Create Test Users

**Option A: Use the browser**
1. Open http://localhost:5173
2. Click "Register"
3. Create accounts for different roles:
   - Citizen: For requesting help
   - Volunteer: For accepting and completing tasks
   - Organizer: For creating events

**Option B: Use the seed script**
```bash
cd backend
node scripts/seedTestUsers.js
```

---

## 🧪 Testing the Complete Flow

### Test 1: Citizen Creates Help Request

1. **Login as Citizen**
   - Email: `citizen@test.com`
   - Password: `password123`

2. **Create Help Request**
   - Navigate to Dashboard
   - Click "Request Help" or "Create Help Request"
   - Fill in:
     * Title: "Need help with grocery shopping"
     * Category: "Elder Care"
     * Description: "Elderly person needs assistance"
     * Location: "123 Main Street"
     * Skills: Add "Driving" and "Elder Care"
   - Click "Create Help Request"

3. **Verify Creation**
   - Should redirect to event detail page
   - Status should show "Pending"
   - No volunteers assigned yet

### Test 2: Volunteer Accepts Request

1. **Open New Browser/Incognito**
   - Login as Volunteer
   - Email: `volunteer@test.com`
   - Password: `password123`

2. **Update Volunteer Skills** (if needed)
   - Go to Profile or Skills page
   - Add "Driving" and "Elder Care"

3. **View Available Requests**
   - Navigate to Dashboard or Events
   - Should see the help request created earlier
   - Look for skill match indicator (if skills match)

4. **Accept Request**
   - Click on the help request
   - Click "Accept Request" button
   - Status should change from "Pending" → "Assigned"
   - Volunteer should be added to assigned list

### Test 3: Real-Time Chat

1. **In Citizen Browser**
   - Still on event detail page
   - Should see volunteer has been assigned
   - Type a message in chat: "Thank you for accepting!"
   - Press Send

2. **In Volunteer Browser**
   - On the same event detail page
   - Should immediately see the message appear (real-time)
   - Reply: "Happy to help! When would be a good time?"

3. **Verify Real-Time**
   - Messages should appear instantly in both browsers
   - No page refresh needed

### Test 4: Status Progression

**In Volunteer Browser:**

1. **Start Work**
   - On event detail page
   - Status tracker shows "Assigned" (blue)
   - Click "Start Progress" button
   - Status changes to "In Progress" (purple)

2. **Complete Task**
   - After work is done
   - Click "Mark Complete" button
   - Status changes to "Completed" (green)

**In Citizen Browser:**
- Watch the status tracker update in real-time
- No refresh needed
- Should see visual progression
- Should receive notification

### Test 5: Organizer Creates Event

1. **Login as Organizer**
   - Email: `organizer@test.com`
   - Password: `password123`
   - Note: Organizer must be admin-verified first

2. **Create Event**
   - Click "Create Event"
   - Fill in:
     * Title: "Community Food Drive"
     * Category: "Food Distribution"
     * Description: "Help distribute food to families"
     * Location: "Community Center"
     * Start Date/Time: Tomorrow at 9:00 AM
     * End Date/Time: Tomorrow at 5:00 PM
     * Volunteers Needed: 10
     * Skills: "Food Distribution", "Logistics & Transport"
   - Click "Create Event"

3. **Verify Notifications**
   - Citizens should receive notification
   - Volunteers with matching skills should be notified

4. **Volunteer Joins**
   - Login as volunteer
   - View the event
   - Click "Accept Request"
   - Volunteer is added to the event

---

## 📊 Verification Checklist

### Backend Health Checks
- [ ] MongoDB connection successful
- [ ] Server running on port 5000
- [ ] Socket.IO initialized
- [ ] No error messages in console

### Frontend Health Checks
- [ ] App loads at localhost:5173
- [ ] No console errors (check browser DevTools)
- [ ] Can navigate between pages
- [ ] Can login/register

### Feature Checks
- [ ] **Authentication**: Can register and login
- [ ] **Create Request**: Citizen can create help request
- [ ] **Create Event**: Organizer can create event
- [ ] **Accept**: Volunteer can accept requests/events
- [ ] **Chat**: Messages send and receive in real-time
- [ ] **Status**: Volunteer can update status
- [ ] **Real-Time**: Status updates appear immediately
- [ ] **Notifications**: Users receive notifications
- [ ] **Permissions**: Users can only access allowed features

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB connection error
```
**Solution:**
1. Start MongoDB: `mongod` or `brew services start mongodb-community`
2. Check MongoDB is running: `mongo` (should connect)
3. Verify MONGO_URI in backend/.env

### Socket Connection Failed
```
Socket.IO connection error
```
**Solution:**
1. Check backend server is running
2. Verify CORS settings in server.js
3. Check frontend VITE_API_BASE_URL in .env
4. Open browser DevTools → Network tab → WS to see WebSocket connections

### Cannot Accept Event/Request
```
Error 403: Not authorized
```
**Solution:**
1. Verify user is logged in
2. Check token is valid (localStorage)
3. Ensure volunteer has proper role
4. Check not already assigned

### Status Not Updating
```
Status stuck on old value
```
**Solution:**
1. Refresh the page
2. Check Socket.IO connection (DevTools console)
3. Verify volunteer is assigned to the event
4. Check backend logs for errors

### No Messages Showing
```
Chat is empty
```
**Solution:**
1. Check Socket.IO connection
2. Verify both users are in the same event room
3. Check browser console for errors
4. Try sending a new message

---

## 🔍 Monitoring & Debugging

### Backend Logs
Watch backend console for:
```
User connected: [socket-id]
User [name] joined event room [eventId]
Status updated for event [eventId]: Pending → Assigned
Message saved to database
```

### Frontend DevTools
1. **Console Tab**: Check for errors
2. **Network Tab**: 
   - Check API calls (200 status)
   - Check WS connections (WebSocket)
3. **Application Tab**:
   - Check localStorage for token
   - Check localStorage for user data

### Database Inspection
```bash
# Connect to MongoDB
mongo

# Switch to database
use unityaid

# Check events
db.events.find().pretty()

# Check users
db.users.find().pretty()

# Check messages
db.eventmessages.find().pretty()

# Check notifications
db.notifications.find().pretty()
```

---

## 📈 Performance Tips

1. **Clean Old Data**
   ```javascript
   // Delete completed events older than 30 days
   db.events.deleteMany({
     trackingStatus: "Completed",
     updatedAt: { $lt: new Date(Date.now() - 30*24*60*60*1000) }
   })
   ```

2. **Index Optimization**
   ```javascript
   // Create indexes for better query performance
   db.events.createIndex({ type: 1, trackingStatus: 1 })
   db.events.createIndex({ createdBy: 1 })
   db.events.createIndex({ assignedVolunteers: 1 })
   db.users.createIndex({ role: 1, skills: 1 })
   ```

3. **Socket.IO Scaling**
   - For production, use Redis adapter
   - Enable sticky sessions
   - Use load balancer for multiple instances

---

## 🎯 Next Steps

After successful setup:

1. **Customize UI**: Update colors, logos in Tailwind config
2. **Add Features**: Review future enhancements in main documentation
3. **Deploy**: Prepare for production deployment
4. **Test**: Run through all user flows
5. **Secure**: Review security best practices

---

## 📞 Need Help?

If you encounter issues:
1. Check this troubleshooting guide
2. Review main documentation (EVENT_SYSTEM_DOCUMENTATION.md)
3. Check browser console and backend logs
4. Verify environment variables
5. Ensure all dependencies are installed

**Happy Coordinating! 🎉**
