# Communication Features - Image & Location Sharing

## Overview
The communication section now supports rich messaging capabilities including image sharing and real-time location sharing with interactive maps.

## Features Implemented

### 1. **Image Sharing** 📷
- **Upload images** directly from the chat interface
- **Supported formats**: JPEG, PNG, GIF, WebP
- **File size limit**: 5MB per image
- **Preview before sending**: See your image before it's sent
- **Full-size viewing**: Click on any image to view it in full size
- **Available to**: All roles (Volunteers, Organizers, Citizens)

#### How to Use:
1. Click the 📷 camera icon in the message input
2. Select an image from your device
3. Preview appears - you can remove it if needed
4. Type an optional message
5. Click "Send"

### 2. **Location Sharing** 📍
- **Auto-detect location**: Uses your device's GPS
- **Address resolution**: Automatically converts coordinates to human-readable addresses
- **Interactive maps**: View shared locations on Leaflet maps
- **Map interaction**: Click markers to see address details
- **Privacy**: Location is only shared when you explicitly click the button
- **Available to**: All roles (Volunteers, Organizers, Citizens)

#### How to Use:
1. Click the 📍 location icon in the message input
2. Allow browser to access your location (one-time permission)
3. Your location is captured with address
4. Preview appears - you can remove it if needed
5. Type an optional message
6. Click "Send"

### 3. **Map Integration** 🗺️
- **Technology**: Leaflet.js with OpenStreetMap tiles
- **Interactive**: Pan, zoom, and click markers
- **Responsive**: Works on all device sizes
- **Fallback**: Shows coordinates if address lookup fails

## Technical Implementation

### Backend Changes

#### Model Updates (`EventMessage.js`)
```javascript
{
  message: String,
  image: String,        // URL to uploaded image
  location: {
    lat: Number,       // Latitude
    lng: Number,       // Longitude
    address: String    // Human-readable address
  },
  // ... other fields
}
```

#### API Endpoints
- **POST `/api/upload/image`**: Upload image files
  - Accepts: multipart/form-data
  - Returns: { imageUrl, fileName, fileSize }
  
- **POST `/api/chat/event/:eventId`**: Send messages
  - Accepts: { message, image?, location? }
  - Returns: saved message with all data

### Frontend Changes

####New Component (`LocationMap.jsx`)
- Displays interactive Leaflet map
- Shows location marker with popup
- Displays address below map

#### Updated Components
- **EventDetailPage.jsx**: Full image and location support
  - Image upload with preview
  - Geolocation API integration
  - Enhanced message display
  - Real-time socket updates

### Dependencies Added
```json
{
  "leaflet": "^1.9.x",
  "react-leaflet": "^4.2.x"
}
```

## User Experience Flow

### Sending a Message with Image:
1. User clicks 📷 button
2. "Uploading image..." indicator appears
3. Image uploads to server
4. Message is saved to database with image URL
5. Socket emits real-time update
6. All participants see the image instantly

### Sending a Message with Location:
1. User clicks 📍 button
2. Browser requests location permission (first time only)
3. "Location captured!" toast appears
4. Preview shows the address
5. User can add message text
6. Click "Send" to share
7. Recipients see interactive map with the location

### Viewing Messages:
- **Text messages**: Display normally
- **Messages with images**: Image shows below text, clickable for full view
- **Messages with location**: Interactive map displays with marker
- **Messages with both**: All elements display together beautifully

## Security Considerations

1. **Image Upload Security**:
   - File type validation (only images allowed)
   - File size limit (5MB maximum)
   - Authentication required
   - Files stored in restricted directory

2. **Location Privacy**:
   - Explicit user action required
   - Browser permission needed
   - No background tracking
   - Location only shared in specific event chats

3. **Access Control**:
   - Only participants can view messages
   - Images require authentication to view
   - Socket connections are authenticated

## Browser Compatibility

### Required Features:
- **Geolocation API**: Chrome 5+, Firefox 3.5+, Safari 5+, Edge 12+
- **File API**: All modern browsers
- **Leaflet Maps**: All modern browsers
- **Web Sockets**: All modern browsers

### Fallback Behavior:
- If geolocation unavailable: Button disabled with tooltip
- If map fails to load: Shows coordinates as text
- If image fails to load: Shows broken image with retry option

## Testing Checklist

✅ Image upload works
✅ Location capture works
✅ Maps display correctly
✅ Real-time updates work
✅ Mobile responsive
✅ Error handling works
✅ File size validation works
✅ Permission handling works

## Future Enhancements (Optional)

1. **Image Compression**: Automatically compress images before upload
2. **Multiple Images**: Send multiple images in one message
3. **Image Gallery**: View all event images in a gallery
4. **Location History**: Track location updates over time
5. **Route Planning**: Suggest routes to event locations
6. **AR Integration**: Augmented reality for location finding

## Support

For issues or questions about these features:
- Check browser console for errors
- Verify location permissions are granted
- Ensure file sizes are under 5MB
- Check network connectivity for maps

---

**Last Updated**: February 13, 2026
**Version**: 1.0.0
