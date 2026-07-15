import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { signup, login, logout, updateProfile, forgotPassword, completeReset } from "./controllers/auth.controllers.js";
import { protectRoute } from './middleware/auth.middleware.js';
import { findUserById, updateUserById } from './lib/user.repository.js';
import { findById as findLocalById, findByEmail as findLocalByEmail } from './lib/local_user_store.js';
import "dotenv/config";

const router = express.Router();

// Helper: generate tokens
const generateTokens = (user) => {
  // Use the user's ID (handle both MongoDB _id and local id)
  const userId = user._id || user.id;
  
  const accessToken = jwt.sign(
    { id: userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET, // Ensure this matches your login controller secret
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Standard Cookie Options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' is required for cross-site cookies
  path: '/', // Critical: ensures cookie is sent for all routes
};

// ─── STANDARD AUTH ROUTES ──────────────────────────────────
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-complete", completeReset);
router.put("/update-profile", protectRoute, updateProfile);

// ─── GOOGLE OAUTH ROUTES ────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  async (req, res) => {
    try {
        if (!req.user) return res.redirect(`${process.env.CLIENT_URL}/login`);

        const { accessToken, refreshToken } = generateTokens(req.user);
        
        // Save refresh token to DB if user exists in DB
        if (req.user._id) {
            await updateUserById(req.user._id, { refreshToken });
        }

        // Set Access Token Cookie
        res.cookie('jwt', accessToken, { 
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
        });

        // Set Refresh Token Cookie
        res.cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Redirect to your Lagos-based frontend dashboard
        res.redirect(`${process.env.CLIENT_URL}/index.html`); 
    } catch (error) {
        console.error("OAuth Callback Error:", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }
);

// ─── USER DATA ROUTE ───────────────────────────────────────
router.get('/me', protectRoute, async (req, res) => {
  try {
    // protectRoute should have attached user info to req.user via the JWT
    const userId = req.user.id || req.user._id;

    // 1. Try DB
    let user = await findUserById(userId).catch(() => null);

    // 2. Try Local Store Fallback
    if (!user) {
        user = findLocalById(userId) || findLocalByEmail(req.user.email);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Strip sensitive data
    const userObj = user.toObject ? user.toObject() : user;
    const { password, refreshToken, ...safeUser } = userObj;
    
    return res.json(safeUser);
  } catch (err) {
    console.error("Error in /me:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── REFRESH TOKEN ROUTE ────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Find user to validate the token stored in DB matches the cookie
    const user = await findUserById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    const tokens = generateTokens(user);
    await updateUserById(user._id, { refreshToken: tokens.refreshToken });

    res.cookie('jwt', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    // Also update refresh cookie to extend life
    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Tokens refreshed successfully' });
  } catch (error) {
    console.error("Refresh Error:", error);
    res.status(403).json({ message: 'Session expired, please login again' });
  }
});

export default router;