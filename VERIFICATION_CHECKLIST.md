# NetChill Connection Verification Checklist

## ✅ What's Been Connected

### Backend Files Modified:
- `server.js` - Added CORS middleware for frontend communication
- `.env.example` - Configuration template

### Frontend Files Created/Modified:
- `api.js` - ✅ NEW: Complete API client with all endpoints
- `login.html` - ✅ UPDATED: Login/Signup with backend connection
- `dashboard.html` - ✅ NEW: User profile page connected to backend
- `index.html` - ✅ UPDATED: Added authentication checks

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env and add your Supabase URL and JWT_SECRET
```

### Step 2: Start Backend
```bash
# From project root
npm run server
# Should see: "Server running on port: 3000"
```

### Step 3: Open Frontend
```
Open in browser: http://localhost:3000/login.html
```

## ✨ Features Now Available

### Sign Up Flow
- User creates account with email, password, name, subscription level
- Data sent to backend: `POST /api/auth/signup`
- User redirected to home page after success

### Login Flow
- User logs in with email and password
- JWT token stored in httpOnly cookie (secure)
- User redirected to home page after success

### Dashboard Features
- View profile information
- Edit full name and subscription level
- See account status and member since date
- Logout button

### Protected Routes
- Dashboard (`/dashboard.html`) requires login
- Automatic redirect to login if not authenticated
- Profile data loaded from backend

## 🔑 API Endpoints Used

```
POST   /api/auth/signup           - Create account
POST   /api/auth/login            - Login user
POST   /api/auth/logout           - Logout user
GET    /api/auth/me               - Get current profile
PUT    /api/auth/update-profile   - Update profile
GET    /api/health                - Server health check
```

## 🔍 Testing Instructions

### 1. Test Backend Is Running
```javascript
// Open browser console and run:
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
```

### 2. Test Sign Up
- Go to: `http://localhost:3000/login.html`
- Click "SIGN UP" tab
- Fill in form and submit
- Should redirect to home page if successful

### 3. Test Login
- Go to: `http://localhost:3000/login.html`
- Click "LOGIN" tab
- Use credentials from signup
- Should redirect to home page

### 4. Test Dashboard
- After login, go to: `http://localhost:3000/dashboard.html`
- Should see profile data from backend
- Try editing profile

### 5. Test Logout
- Click "LOGOUT" button on dashboard
- Should redirect to login page

## 📝 Environment Setup

### Backend .env Required Fields
```
PORT=3000
MONGO_URL=mongodb://localhost:27017/netchill
JWT_SECRET=your_secret_key_change_in_production
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Optional Fields
```
RESEND_API_KEY=your_key (for email notifications)
EMAIL_FROM=noreply@netchill.com
EMAIL_FROM_NAME=NetChill
```

## 🐛 Common Issues & Fixes

### "Could not connect to server"
- Check backend is running: `npm run server`
- Check port 3000 is not blocked
- Check backend logs for errors

### CORS Error in Browser Console
- Verify `CLIENT_URL` in backend `.env` matches frontend origin
- Ensure cors package is installed: `npm install cors` in backend

### Login not working but no error
- MongoDB might not be connected (check backend logs)
- `JWT_SECRET` might be missing from `.env`
- Check credentials are correct

### Cookies not saving
- Browser cookies must be enabled
- Check that credentials: 'include' is used in fetch (already done in api.js)
- In production, must use HTTPS

## 📁 File Structure Summary

```
NetChill/
├── backend/
│   ├── .env                    ← Create this
│   ├── .env.example            ✅ Template
│   ├── server.js               ✅ Updated with CORS
│   ├── auth.route.js           ✅ All routes working
│   └── ... other files
│
├── frontend/
│   ├── api.js                  ✅ NEW - API client
│   ├── login.html              ✅ Updated
│   ├── dashboard.html          ✅ NEW - Profile page
│   ├── index.html              ✅ Updated with auth
│   └── ... other files
│
└── FRONTEND_BACKEND_SETUP.md   ✅ Complete guide
```

## ✅ Verification Checklist

- [ ] Backend `.env` file created with MongoDB URL
- [ ] `npm run server` starts without errors
- [ ] Can visit `http://localhost:3000/login.html`
- [ ] Can create new account
- [ ] Can login with created account
- [ ] Dashboard shows profile information
- [ ] Can edit profile
- [ ] Can logout successfully
- [ ] Frontend shows "DASHBOARD" button when logged in
- [ ] Frontend shows "LOGIN / SIGN UP" button when logged out

## 🚀 Next Steps

1. Create `.env` file in backend
2. Start backend server
3. Test the flow above
4. Deploy to production when ready
5. Update API_BASE_URL in api.js for production

---

**Need help?** Check `FRONTEND_BACKEND_SETUP.md` for detailed integration guide.
