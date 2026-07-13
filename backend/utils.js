import jwt from "jsonwebtoken";
import { ENV } from "./lib/env.js";

/**
 * Note: If you are using Supabase Auth, Supabase provides its own 'access_token'.
 * This function is only needed if you want to create your own secondary session.
 */
export const generateToken = (userId, res) => {
  // Use SUPABASE_JWT_SECRET if available, otherwise your own JWT_SECRET
  const secret = ENV.SUPABASE_JWT_SECRET || ENV.JWT_SECRET;

  if (!secret) {
    console.error("❌ JWT Secret is missing in Environment Variables");
    throw new Error("Internal Server Configuration Error");
  }

  // Sign the token using the Supabase-compatible ID (usually a UUID)
  const token = jwt.sign({ sub: userId }, secret, {
    expiresIn: "7d",
  });

  // Set the cookie
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // Prevents XSS attacks
    sameSite: "strict", // Prevents CSRF attacks
    secure: ENV.NODE_ENV === "production", // Only over HTTPS in production
    path: "/", // Ensure cookie is available everywhere
  });

  return token;
};