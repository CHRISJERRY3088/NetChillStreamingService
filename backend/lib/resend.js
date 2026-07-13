import { Resend } from "resend";
import "dotenv/config";
import { ENV } from "./env.js";

let resendClient = null;

export const getResendClient = () => {
  if (!resendClient) {
    if (!ENV.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured - email sending disabled");
      return null;
    }
    resendClient = new Resend(ENV.RESEND_API_KEY);
  }
  return resendClient;
};

export const sender = {
    email: process.env.EMAIL_FROM,
    name: process.env.EMAIL_FROM_NAME,
};