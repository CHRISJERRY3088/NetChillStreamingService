import { supabase } from "../lib/supabaseClient.js";
import { ENV } from "../lib/env.js";
import jwt from 'jsonwebtoken';
import { findById } from '../lib/local_user_store.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;

        if (!token) return res.status(401).json({ message: "Unauthorized - No Token" });

        // Primary: try Supabase if configured
        if (ENV.SUPABASE_URL && (ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_SERVICE_ROLE_KEY)) {
            try {
                console.debug && console.debug('protectRoute: trying Supabase getUser');
                const { data: { user }, error } = await supabase.auth.getUser(token);
                console.debug && console.debug('protectRoute: supabase response', { user: !!user, error: error?.message });
                if (user && !error) {
                    req.user = user;
                    if (!req.user._id && req.user.id) req.user._id = req.user.id;
                    return next();
                }
            } catch (e) {
                console.debug && console.debug('protectRoute: supabase.getUser threw', e && e.message);
                // ignore and try local JWT fallback
            }
        }

        // Fallback: verify locally-signed JWT (development/local users)
        if (ENV.JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, ENV.JWT_SECRET);
                console.debug && console.debug('protectRoute: jwt decoded', decoded);
                const local = findById(decoded.id);
                console.debug && console.debug('protectRoute: local lookup', !!local);
                if (local) {
                    // Normalize user object similar to Supabase user shape
                    req.user = {
                        id: local.id || local._id,
                        _id: local.id || local._id,
                        email: local.email,
                        user_metadata: {
                            fullName: local.fullName || local.full_name,
                            subscription: local.subscription || 'Free',
                            paymentStatus: local.paymentStatus || 'Unpaid'
                        }
                    };
                    return next();
                }
            } catch (e) {
                console.debug && console.debug('protectRoute: jwt verify failed', e && e.message);
                // invalid JWT
            }
        }

        return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};