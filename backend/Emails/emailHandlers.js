import { getResendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate, createReceiptEmailTemplate } from "./emailTemplate.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.warn("Email service not configured, skipping welcome email");
    return null;
  }

  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to NetChill",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }

  return data;
};

export const sendReceiptEmail = async ({ toEmail, fullName, plan, amount, currency, txRef, paidAt }) => {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.warn("RESEND not configured - skipping receipt email");
    return null;
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: toEmail,
      subject: `Receipt - ${plan} subscription payment`,
      html: createReceiptEmailTemplate({ fullName, plan, amount, currency, txRef, paidAt }),
    });

    if (error) {
      console.error("Failed sending receipt email", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("sendReceiptEmail error", err);
    return null;
  }
};