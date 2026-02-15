# UnityAid - Volunteer Coordination Platform

A professional MERN stack web application for managing volunteer coordination, community events, and emergency support.

## Features

- **Unified Login System**: Single login page for Organizer, Volunteer, and Citizen roles
- **Role-based Registration**: Different registration flows based on user role
- **Professional UI**: Modern, responsive design using Tailwind CSS
- **Form Validation**: Client-side validation for all forms
- **Role-specific Dashboards**: Redirects users to appropriate dashboard after login

## Tech Stack

- **React 18** - UI library
- **React Router v6** - Navigation and routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client for API calls
- **Vite** - Build tool and dev server

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Login.jsx          # Login component with role selection
│   │   ├── Register.jsx       # Registration component with conditional fields
│   │   └── Dashboard.jsx      # Role-specific dashboard placeholder
│   ├── App.jsx                # Main app component with routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind CSS imports
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── vite.config.js            # Vite configuration
```

## User Roles

### Organizer
- Can create and manage events
- Requires admin verification before creating events
- Access to organizer dashboard

### Volunteer
- Can browse and sign up for events
- Must select skills during registration
- Access to volunteer dashboard

### Citizen
- Can view community events
- Can request assistance
- Access to citizen dashboard

### Admin
- Separate login (not visible on public login page)
- Full system access

## API Endpoints (Placeholders)

The application includes placeholder API calls that need to be connected to your backend:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Notes

- Admin login is separate and hidden from the public login page
- All form validations are client-side
- Authentication tokens are stored in localStorage (replace with secure storage in production)
- API calls are placeholders and need to be connected to your backend

## License

© 2024 UnityAid. All rights reserved.

