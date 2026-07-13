# NetChill Frontend-Backend Integration Guide

## Quick Start

Your frontend and backend are now connected! Here's what you need to do:

### 1. Backend Setup

#### Create .env file
```bash
# Navigate to backend folder
cd backend

# Copy the environment template
cp .env.example .env

# Edit .env with your configuration:
PORT=3000
MONGO_URL=mongodb://localhost:27017/netchill
JWT_SECRET=your_secret_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

#### Start Backend Server
```bash
# From project root
npm run server

# Or manually:
cd backend
npm start
```

**Expected output:**
```
Server running on port: 3000
```

### 2. Frontend Setup

The frontend is pre-configured to connect to `http://localhost:3000/api`

#### File Structure
- `api.js` - API client with all backend endpoints
- `login.html` - Login/Signup page
- `dashboard.html` - User profile and settings
- `index.html` - Home page

### 3. Available API Endpoints

#### Authentication Routes
```
POST   /api/auth/signup      - Create new account
POST   /api/auth/login       - Login user
POST   /api/auth/logout      - Logout user
GET    /api/auth/me          - Get current user profile
PUT    /api/auth/update-profile - Update user profile
POST   /api/auth/refresh     - Refresh access token
```

### 4. User Flow

1. **Sign Up** (`/login.html` - Signup tab)
   - User creates account with email, password, full name, subscription
   - Redirected to home page after success

2. **Login** (`/login.html` - Login tab)
   - User logs in with email and password
   - JWT stored in httpOnly cookie
   - Redirected to home page

3. **Dashboard** (`/dashboard.html`)
   - View profile information
   - Edit profile and subscription
   - Logout

4. **Logout**
   - Cookie cleared on server
   - User redirected to login page

### 5. Frontend API Usage

#### In your JavaScript files:
```javascript
// Import API functions
import { authAPI, authStorage } from './api.js';

// Sign up
const user = await authAPI.signup(fullName, email, password, subscription);

// Login
const user = await authAPI.login(email, password);

// Get profile
const profile = await authAPI.getProfile();

// Update profile
const updated = await authAPI.updateProfile({ fullName, subscription });

// Logout
await authAPI.logout();

// Check if logged in
if (authStorage.isLoggedIn()) {
  // User is authenticated
}
```

### 6. Configure API Base URL

Edit `frontend/api.js` to change the API URL:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

### 7. Troubleshooting

#### CORS Error?
- Make sure backend is running on port 3000
- Check that `cors` package is installed in backend
- Verify `CLIENT_URL` in backend `.env`

#### "Could not connect to server" error?
- Backend might not be running: `npm run server`
- Check if server is on correct port: 3000
- Check browser console for more details

#### Login not working?
- Ensure MongoDB is connected (check backend logs)
- Verify credentials are correct
- Check browser cookies are enabled

#### Cookies not persisting?
- Make sure you're using `credentials: 'include'` in fetch calls (already done in api.js)
- Browser must allow cookies for the domain
- Cookies are httpOnly and secure in production

### 8. Production Deployment

When deploying:

1. Set `NODE_ENV=production` in backend `.env`
2. Update `CLIENT_URL` to your production domain
3. Update `API_BASE_URL` in frontend/api.js
4. Use HTTPS in production
5. Set secure, random `JWT_SECRET`
6. Configure MongoDB Atlas or production database

### 9. File Locations

```
NetChill/
├── backend/
│   ├── .env              (Create from .env.example)
│   ├── server.js         (Main server file)
│   ├── auth.route.js     (Auth endpoints)
│   ├── controllers/
│   │   └── auth.controllers.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   └── users.js
│   └── lib/
│       ├── db.js
│       ├── env.js
│       └── resend.js
│
├── frontend/
│   ├── api.js            (API client - READY TO USE)
│   ├── login.html        (Login/Signup - CONNECTED)
│   ├── dashboard.html    (Profile page - CONNECTED)
│   ├── index.html        (Home page)
│   └── other files...
```

### 10. Next Steps

- [ ] Create `.env` file in backend with your MongoDB URL
- [ ] Start backend: `npm run server`
- [ ] Test signup at `/login.html`
- [ ] Test login
- [ ] View profile at `/dashboard.html`
- [ ] Deploy to production

## Support

All authentication endpoints use:
- **Format**: JSON
- **Auth**: JWT in httpOnly cookies
- **CORS**: Enabled for localhost:3000 and configured CLIENT_URL
