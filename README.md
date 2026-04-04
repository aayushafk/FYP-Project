# UnityAid

UnityAid is a MERN-based volunteer coordination platform.

This workspace is now separated into dedicated projects:

- frontend application in the frontend folder
- backend API in the backend folder

## Project Structure

```
Demo Project/
├── backend/    # Express + MongoDB API
├── frontend/   # React + Vite app
└── README.md
```

## Run Frontend

```
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000 by default.

## Run Backend

```
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:5000 by default.

## Build Frontend

```
cd frontend
npm run build
```

## Notes

- Frontend API requests are proxied to backend via Vite config.
- Keep all client-side code inside frontend and server-side code inside backend to avoid duplication.

