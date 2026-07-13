import { supabase } from "../lib/supabaseClient.js";
import { sendWelcomeEmail } from "../Emails/emailHandlers.js";
import { ENV } from "../lib/env.js";
import { countUsers, getAllUsers as getUserRows, getRecentUsers, getSubscriptionBreakdown } from "../lib/user.repository.js";

// Helper to get everything about a user including their history
async function getFullUserData(supabaseUser) {
    const { data: history } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false });

    const metadata = supabaseUser.user_metadata || {};
    
    return {
        _id: supabaseUser.id,
        fullName: metadata.fullName,
        email: supabaseUser.email,
        subscription: metadata.subscription || "Free",
        paymentStatus: metadata.paymentStatus || "Unpaid",
        trialEndDate: metadata.trialEndDate,
        subscriptionHistory: history || [], // Complex data from SQL table
    };
}

export const signup = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);

        // 1. Auth Signup
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    fullName,
                    subscription: "Free",
                    paymentStatus: "Unpaid",
                    trialEndDate: trialEndDate.toISOString(),
                }
            }
        });

        if (error) return res.status(400).json({ message: error.message });

        sendWelcomeEmail(email, fullName, ENV.CLIENT_URL).catch(console.error);

        const fullUser = await getFullUserData(data.user);
        return res.status(201).json(fullUser);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Log a payment into Subscription History
export const recordPayment = async (req, res) => {
    try {
        const { plan_name, amount, txn_id, duration_days } = req.body;
        const userId = req.user.id; // From your auth middleware

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration_days);

        // 1. Insert into history table
        const { data: history, error: historyError } = await supabase
            .from('subscriptions')
            .insert([{ 
                user_id: userId, 
                plan_name, 
                amount, 
                txn_id, 
                status: 'Paid',
                end_date: endDate.toISOString() 
            }]);

        if (historyError) throw historyError;

        // 2. Update user profile metadata
        const { data: updatedUser, error: userError } = await supabase.auth.updateUser({
            data: { 
                subscription: plan_name,
                paymentStatus: "Paid",
                subscriptionEndDate: endDate.toISOString()
            }
        });

        if (userError) throw userError;

        return res.status(200).json({ message: "Payment recorded", history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to record payment" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return res.status(400).json({ message: "Invalid credentials" });

        const fullUser = await getFullUserData(data.user);
        return res.status(200).json({ user: fullUser, session: data.session });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getProfile = async (req, res) => {
    try {
        // Supabase middleware should put user in req.user
        const { data: { user }, error } = await supabase.auth.getUser(req.headers.authorization?.split(" ")[1]);
        if (error || !user) return res.status(401).json({ message: "Unauthorized" });

        const fullUser = await getFullUserData(user);
        res.status(200).json(fullUser);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getOverview = async (req, res) => {
    try {
        const [totalUsers, recentUsers, subscriptionBreakdown] = await Promise.all([
            countUsers(),
            getRecentUsers(6),
            getSubscriptionBreakdown(),
        ]);

        res.status(200).json({
            totalUsers,
            recentUsers,
            subscriptionBreakdown,
        });
    } catch (error) {
        console.error("Admin overview error:", error);
        res.status(500).json({ message: "Failed to load admin overview" });
    }
};

export const getActivityStats = async (req, res) => {
    try {
        const recentUsers = await getRecentUsers(10);
        res.status(200).json({
            recentUsers,
            totalUsers: await countUsers(),
        });
    } catch (error) {
        console.error("Admin activity error:", error);
        res.status(500).json({ message: "Failed to load activity stats" });
    }
};

export const getAllUsersAdmin = async (req, res) => {
    try {
        const users = await getUserRows();
        res.status(200).json(users);
    } catch (error) {
        console.error("Admin users error:", error);
        res.status(500).json({ message: "Failed to load users" });
    }
};

export const trackAction = async (req, res) => {
    try {
        res.status(200).json({ message: "Action tracked" });
    } catch (error) {
        res.status(500).json({ message: "Failed to track action" });
    }
};

export { getAllUsersAdmin as getAllUsers };