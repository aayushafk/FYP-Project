# UnityAid

UnityAid is a volunteer coordination platform designed to connect volunteers, organizations, and administrators in one place.

## Project Guidance: How to Use the System

UnityAid helps people find volunteer opportunities, manage applications, and keep platform activity organized. Use the platform based on your role:

### Volunteer

Use this role if you want to find and apply for volunteer opportunities.

#### 1. Register
- Open the platform and select **Sign Up** or **Register**.
- Enter your name, email address, password, and any other required details.
- Submit the form to create your volunteer account.

#### 2. Log In
- Go to the **Login** page.
- Enter your email address and password.
- Click **Login** to open your dashboard.

#### 3. Browse Opportunities
- Go to the **Opportunities** or **Events** section.
- Review available volunteer roles, event details, dates, locations, and required skills.
- Choose an opportunity that matches your interests and availability.

#### 4. Apply for an Opportunity
- Open the opportunity details page.
- Click **Apply** and provide any information requested.
- Submit your application and wait for the organization to review it.

#### 5. Track Your Applications
- Open **My Applications** or your dashboard.
- Check the status of each application, such as **Pending**, **Approved**, or **Rejected**.
- Review any updates or messages from the organization.

**Tip:** Keep your profile updated so organizations can better match you with suitable opportunities.

### Organization / NGO

Use this role if you want to post opportunities and manage volunteers.

#### 1. Log In
- Sign in with your organization account.
- Open the organization dashboard.

#### 2. Post Opportunities
- Select **Create Opportunity** or **Post Event**.
- Enter the title, description, date, time, location, required skills, and volunteer needs.
- Review the details and publish the opportunity.

#### 3. Manage Applicants
- Open the **Applicants** or **Applications** section.
- Review volunteer profiles and submitted application details.
- Compare applicants based on skills, availability, and suitability.

#### 4. Approve or Reject Volunteers
- Select each applicant and choose **Approve** or **Reject**.
- Approved volunteers can be contacted for the next steps.
- Rejected applicants will see the updated status in the system.

**Tip:** Clear opportunity descriptions usually attract more suitable applicants.

### Admin

Use this role if you are responsible for overseeing platform activity and user management.

#### 1. Log In to the Admin Panel
- Sign in using your administrator credentials.
- Open the admin dashboard to view system activity.

#### 2. Manage Users
- View volunteer and organization accounts.
- Update, activate, or remove accounts when needed.
- Monitor user access and account status.

#### 3. Monitor Activities
- Review posted opportunities, applications, and user interactions.
- Watch for unusual or inappropriate activity.
- Keep the system organized and reliable.

#### 4. Handle Reports and Feedback
- Open the **Reports** or **Feedback** section.
- Review issues, complaints, and suggestions.
- Take action where needed to maintain a safe platform.

**Tip:** Regular monitoring helps keep the platform trustworthy for all users.

### Helpful Notes
- Use accurate information when registering or posting opportunities.
- Check your dashboard regularly for updates and messages.
- Organizations should review applications promptly so volunteers are not left waiting.
- If you have trouble logging in or accessing your account, contact the system administrator.

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

