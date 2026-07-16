import { supabase } from "../lib/supabaseClient.js"; // Ensure you have this helper
import { sendWelcomeEmail } from "../Emails/emailHandlers.js";
import { ENV } from "../lib/env.js";
import jwt from 'jsonwebtoken';
import { clearDeviceSession, findByEmail, rememberLogin } from "../lib/local_user_store.js";

function setAuthCookies(req, res, session) {
    if (!session?.access_token) return;

    const forwardedProto = req?.headers?.["x-forwarded-proto"] || req?.headers?.["X-Forwarded-Proto"];
    const protoValue = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    const isHttpsRequest = protoValue === "https" || req?.secure === true;
    const isSecureCookie = ENV.NODE_ENV === "production" && isHttpsRequest;

    const cookieOptions = {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: "lax",
    };

    res.cookie("jwt", session.access_token, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
    });

    if (session.refresh_token) {
        res.cookie("refreshToken", session.refresh_token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }
}

// Helper to format Supabase user data for your frontend
function buildUserPayload(supabaseUser) {
    if (!supabaseUser) return null;

    const metadata = supabaseUser.user_metadata || {};
    return {
        _id: supabaseUser.id, // Supabase uses UUID strings
        id: supabaseUser.id,
        fullName: metadata.fullName || "",
        email: supabaseUser.email,
        subscription: metadata.subscription || "Free",
        paymentStatus: metadata.paymentStatus || "Unpaid",
        accessAllowed: metadata.paymentStatus === "Paid" || true, // adjust logic here
    };
}

function getDeviceId(req) {
    const headerValue = req?.headers?.['x-device-id'] || req?.headers?.['X-Device-Id'] || req?.headers?.deviceid;
    if (headerValue) return String(headerValue);
    if (req?.body?.deviceId) return String(req.body.deviceId);
    if (req?.cookies?.deviceId) return String(req.cookies.deviceId);
    return null;
}

function getAuthenticatedUser(req) {
    const email = req?.body?.email || req?.body?.user?.email || null;
    if (req?.cookies?.jwt && ENV.JWT_SECRET) {
        try {
            const decoded = jwt.verify(req.cookies.jwt, ENV.JWT_SECRET);
            return { id: decoded.id, email: decoded.email || email };
        } catch (error) {
            // Ignore invalid or expired JWTs and fall back to request data.
        }
    }
    return { id: req?.body?.user?.id || null, email };
}

function sendLocalUserSession(req, res, localUser) {
    // Create signed JWTs for local development so protectRoute can verify them
    let accessToken = "local_access_token";
    let refreshToken = "local_refresh_token";
    try {
        if (ENV.JWT_SECRET) {
            accessToken = jwt.sign({ id: localUser.id || localUser._id, email: localUser.email }, ENV.JWT_SECRET, { expiresIn: '15m' });
            refreshToken = jwt.sign({ id: localUser.id || localUser._id }, ENV.JWT_SECRET, { expiresIn: '7d' });
        }
    } catch (err) {
        console.error('Failed to sign local JWTs:', err);
    }

    const fakeSession = { access_token: accessToken, refresh_token: refreshToken };
    setAuthCookies(req, res, fakeSession);
    return res.status(200).json({
        user: {
            _id: localUser.id || localUser._id || "local-1",
            id: localUser.id || localUser._id || "local-1",
            fullName: localUser.fullName || localUser.full_name || "Local User",
            email: localUser.email,
            subscription: localUser.subscription || "Free",
        },
        session: fakeSession,
    });
}

export const signup = async (req, res) => {
    try {
        const { fullName, email, password, subscription = "Free" } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 1. Create user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    fullName: fullName,
                    subscription,
                    paymentStatus: "Unpaid",
                }
            }
        });

        if (error) return res.status(400).json({ message: error.message });

        if (data?.session) {
            setAuthCookies(req, res, data.session);
        }

        rememberLogin({
            id: data?.user?.id || email,
            _id: data?.user?.id || email,
            fullName,
            email,
            subscription,
        }, new Date().toISOString(), getDeviceId(req));

        // 2. Send Welcome Email
        sendWelcomeEmail(email, fullName, ENV.CLIENT_URL)
            .catch(err => console.error("Email failed:", err));

        return res.status(201).json({
            message: data?.session
                ? "Signup successful. You are now logged in."
                : "Signup successful. Please check your email for verification.",
            user: buildUserPayload(data?.user),
            session: data?.session,
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Debug: log incoming login body
        console.debug && console.debug('LOGIN BODY:', req.body);

        // Temporary developer test user bypass
        if (email === "test@example.com" && password === "test") {
            const fakeSession = {
                access_token: "dev_access_token",
                refresh_token: "dev_refresh_token",
            };
            setAuthCookies(req, res, fakeSession);
            rememberLogin({
                id: "dev-1",
                _id: "dev-1",
                fullName: "Dev Test User",
                email,
                subscription: "Free",
            }, new Date().toISOString(), getDeviceId(req));
            return res.status(200).json({
                user: {
                    _id: "dev-1",
                    id: "dev-1",
                    fullName: "Dev Test User",
                    email,
                    subscription: "Free",
                },
                session: fakeSession,
            });
        }

        const deviceId = getDeviceId(req);
        const existingUser = findByEmail(email);

        const localUser = existingUser;
        if (localUser && localUser.password === password) {
            const updatedUser = rememberLogin(localUser, new Date().toISOString(), deviceId);
            return sendLocalUserSession(req, res, updatedUser);
        }

        if (!ENV.SUPABASE_URL || !(ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_SERVICE_ROLE_KEY)) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            const fallbackUser = await findByEmail(email);
            if (fallbackUser && fallbackUser.password === password) {
                const updatedUser = rememberLogin(fallbackUser, new Date().toISOString(), getDeviceId(req));
                return sendLocalUserSession(req, res, updatedUser);
            }
            return res.status(400).json({ message: error?.message || "Invalid credentials" });
        }

        if (!data?.user || !data?.session) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        setAuthCookies(req, res, data.session);

        const profile = buildUserPayload(data.user);
        rememberLogin({
            id: data.user.id,
            _id: data.user.id,
            fullName: profile?.fullName || data.user.email,
            email: data.user.email,
            subscription: profile?.subscription || 'Free',
        }, new Date().toISOString(), getDeviceId(req));

        return res.status(200).json({
            user: profile,
            session: data.session,
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = async (req, res) => {
    try {
        const user = getAuthenticatedUser(req);
        const deviceId = getDeviceId(req);
        clearDeviceSession(user, deviceId);
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Logout failed" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        if (ENV.SUPABASE_URL && (ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_SERVICE_ROLE_KEY)) {
const redirectTo = `${ENV.CLIENT_URL || 'http://localhost:10000'}/reset-password.html`;
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

            if (error) {
                console.warn('Password reset request error:', error.message || error);
                // Do not expose whether the email exists
            }

            return res.status(200).json({ message: "If that email is registered, you will receive password reset instructions shortly." });
        }

        const localUser = await findByEmail(email);
        if (localUser) {
            console.warn(`Forgot password requested for local user: ${email}`);
        }

        return res.status(200).json({ message: "If that email is registered, you will receive password reset instructions shortly." });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: "Unable to process password reset request" });
    }
};

    export const completeReset = async (req, res) => {
        try {
            const { access_token, password } = req.body;

            if (!access_token || !password) {
                return res.status(400).json({ message: 'access_token and password are required' });
            }

            if (!ENV.SUPABASE_URL) {
                return res.status(500).json({ message: 'Supabase not configured' });
            }

            const supabaseAuthUrl = ENV.SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/user';

            const resp = await fetch(supabaseAuthUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify({ password }),
            });

            const data = await resp.json().catch(() => null);

            if (!resp.ok) {
                console.error('Reset complete failed', data);
                return res.status(resp.status || 400).json({ message: data?.error || data?.message || 'Failed to update password' });
            }

            return res.json({ message: 'Password updated successfully' });
        } catch (err) {
            console.error('completeReset error', err);
            return res.status(500).json({ message: 'Server error' });
        }
    };

export const updateProfile = async (req, res) => {
    try {
        const { fullName, subscription } = req.body;

        // Update user metadata in Supabase
        const { data, error } = await supabase.auth.updateUser({
            data: { 
                fullName: fullName,
                subscription: subscription
            }
        });

        if (error) return res.status(400).json({ message: error.message });

        return res.status(200).json(buildUserPayload(data.user));
    } catch (error) {
        return res.status(500).json({ message: "Update failed" });
    }
};