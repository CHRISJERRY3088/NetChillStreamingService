import { ENV } from "./env.js";
import { supabaseAdmin } from "./supabase.js";

export const connectDB = async () => {
    try {
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = ENV;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.warn("⚠️ Supabase credentials missing in ENV; continuing without DB verification.");
            return;
        }

        if (!supabaseAdmin || typeof supabaseAdmin !== "object") {
            throw new Error("Supabase admin client is not initialized.");
        }

        console.log("✅ Supabase client initialized successfully.");
    } catch (error) {
        console.warn("⚠️ Supabase connection check skipped:", error.message);
    }
};