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

## Project Guidance: How to Use the System

### Introduction
The Volunteer Coordination Platform helps connect volunteers with organizations and community needs in one place.
It is built with React.js for the frontend, Node.js/Express.js for the backend, and PostgreSQL for data management.

Use this guide to understand how to use the system based on your role.

---

## 1. Volunteer Guide

### 1.1 Register Your Account
1. Open the platform home page.
2. Select Sign Up.
3. Choose Volunteer as your role.
4. Fill in your details (name, email, password, contact details, skills, and availability).
5. Submit the registration form.

Tip: Use an active email address so you do not miss updates.

### 1.2 Log In
1. Select Log In.
2. Enter your email and password.
3. Open your Volunteer Dashboard.

### 1.3 Browse Opportunities
1. Go to the Opportunities section.
2. Use filters such as location, date, cause area, or required skills.
3. Open an opportunity to view full details.

### 1.4 Apply for Opportunities
1. Open the opportunity details page.
2. Select Apply.
3. Complete the required fields.
4. Submit your application.

Note: Some opportunities may close automatically after the deadline.

### 1.5 Track Your Applications
1. Go to My Applications in your dashboard.
2. Check statuses such as Pending, Approved, or Rejected.
3. Open application entries to read organization messages and next steps.

---

## 2. Organization/NGO Guide

### 2.1 Register or Log In
1. Create an account and choose Organization/NGO role, or log in to your existing account.
2. Complete your organization profile.

### 2.2 Post Opportunities
1. Open Create Opportunity.
2. Enter the opportunity information:
	- Title
	- Description and tasks
	- Required skills
	- Date, time, and location
	- Number of volunteers needed
	- Application deadline
3. Publish the opportunity.

Tip: Clear opportunity descriptions help attract suitable volunteers.

### 2.3 Manage Applicants
1. Open your posted opportunity.
2. Go to Applicants.
3. Review volunteer profiles and application details.

### 2.4 Approve or Reject Volunteers
1. Select an applicant.
2. Choose Approve or Reject.
3. Send a short response message when needed.

### 2.5 Monitor Active Opportunities
1. Use your dashboard to track application counts and approved volunteers.
2. Update or close opportunities when positions are filled.

---

## 3. Admin Guide

### 3.1 Access Admin Dashboard
1. Log in using an admin account.
2. Open the Admin Dashboard panel.

### 3.2 Manage Users
1. Go to User Management.
2. Search and filter by role or status.
3. Update roles, activate accounts, or suspend accounts if required.

### 3.3 Monitor Activities
1. Review platform activity metrics.
2. Track registrations, posted opportunities, applications, and approvals.

### 3.4 Handle Reports and Feedback
1. Open the Reports or Feedback section.
2. Review submitted issues.
3. Take action and mark resolved cases.

Tip: Regular report reviews help keep the platform safe and reliable.

---

## General Tips for All Users
- Keep your profile and contact details up to date.
- Check notifications regularly.
- Use clear and respectful communication.
- Contact support through the platform if you face account or login issues.

