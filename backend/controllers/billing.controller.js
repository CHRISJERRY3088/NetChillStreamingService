import { ENV } from "../lib/env.js";
import { findUserById, updateUserById } from "../lib/user.repository.js";
import { broadcastToUser } from "../lib/sse.js";
import { sendReceiptEmail } from "../Emails/receiptEmail.js";
import { PLAN_CONFIG, getNextBillingDate } from "../lib/subscription.js";

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

function normalizeSubscriptionName(subscription) {
  if (typeof subscription !== "string") return "";
  const value = subscription.trim();
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getSubscriptionFromTxRef(txRef = "") {
  const parts = txRef.split("_");
  if (parts.length < 4) return null;
  return parts[2];
}

function getUserIdFromTxRef(txRef = "") {
  const parts = txRef.split("_");
  if (parts.length < 4) return null;
  return parts[1];
}

async function flutterwaveRequest(path, options = {}) {
  if (!ENV.FLW_SECRET_KEY) {
    throw new Error("Missing FLW_SECRET_KEY in backend environment");
  }

  const response = await fetch(`${FLW_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.FLW_SECRET_KEY}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok || data.status !== "success") {
    throw new Error(data.message || `Flutterwave request failed (${response.status})`);
  }

  return data;
}

async function createFlutterwaveRecurringPlan({ name, amount, currency = ENV.FLW_CURRENCY || "USD" }) {
  if (!ENV.FLW_SECRET_KEY || !name || !Number(amount)) {
    return null;
  }

  const planName = String(name).slice(0, 100);
  const requestVariants = [
    {
      path: "/subscriptions/plans",
      payload: { name: planName, amount: Number(amount), interval: "monthly", currency },
    },
    {
      path: "/subscriptions/plan",
      payload: { name: planName, amount: Number(amount), interval: "monthly", currency },
    },
    {
      path: "/subscriptions/plans",
      payload: { name: planName, amount: Number(amount), interval: "monthly", currency, plan_name: planName },
    },
  ];

  for (const variant of requestVariants) {
    try {
      const response = await flutterwaveRequest(variant.path, {
        method: "POST",
        body: JSON.stringify(variant.payload),
      });

      const plan = response?.data || response?.plan || null;
      const planCode = plan?.plan_code || plan?.code || plan?.id || null;
      if (planCode) {
        return planCode;
      }
    } catch (error) {
      console.warn("Flutterwave recurring plan creation skipped:", error.message);
    }
  }

  return null;
}

async function applySuccessfulPayment({
  userId,
  subscription,
  amount,
  txRef,
  transactionId,
  paymentMethod,
  currency,
  billingToken = null,
}) {
  const normalizedSubscription = normalizeSubscriptionName(subscription) || "Free";
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found for payment update");
  }

  const history = Array.isArray(user.subscriptionHistory) ? user.subscriptionHistory : [];
  const existing = history.find(
    (entry) => entry.txRef === txRef || entry.transactionId === String(transactionId)
  );

  if (existing) {
    return user;
  }

  const now = new Date();
  const selectedPlan = PLAN_CONFIG[normalizedSubscription] || PLAN_CONFIG.Free;
  const nextBilling = getNextBillingDate(now, normalizedSubscription);

  const updatedHistory = [
    ...history,
    {
      plan: normalizedSubscription,
      amount: Number(amount) || selectedPlan.amount || 0,
      currency: currency || ENV.FLW_CURRENCY || "USD",
      status: "successful",
      gateway: "flutterwave",
      txRef,
      transactionId: String(transactionId || ""),
      paymentMethod: paymentMethod || "Flutterwave",
      paidAt: now.toISOString(),
      periodStart: now.toISOString(),
      periodEnd: nextBilling.toISOString(),
    },
  ];

  const updates = {
    subscription: normalizedSubscription,
    paymentStatus: "Paid",
    currency: currency || ENV.FLW_CURRENCY || "USD",
    subscriptionStartDate: now.toISOString(),
    subscriptionEndDate: nextBilling.toISOString(),
    lastPaymentAmount: Number(amount) || selectedPlan.amount || 0,
    lastPaymentDate: now.toISOString(),
    lastPaymentMethod: paymentMethod || "Flutterwave",
    lastPaymentTxnId: String(transactionId || txRef),
    subscriptionHistory: updatedHistory,
  };

  // Save billing token for recurring support if available
  if (billingToken) {
    updates.refreshToken = String(billingToken);
  }

  const updatedUser = await updateUserById(userId, updates);

  // Notify user's SSE connections about the subscription update
  try {
    broadcastToUser(userId, 'subscription-updated', {
      userId,
      subscription: updates.subscription,
      subscriptionEndDate: updates.subscriptionEndDate,
    });
  } catch (e) {
    console.warn('Failed broadcasting SSE update', e);
  }

  // Send receipt email if possible
  try {
    await sendReceiptEmail({
      toEmail: updatedUser.email,
      fullName: updatedUser.fullName,
      plan: normalizedSubscription,
      amount: updates.lastPaymentAmount,
      currency: updates.currency || ENV.FLW_CURRENCY || 'USD',
      txRef,
      paidAt: updates.lastPaymentDate,
    });
  } catch (e) {
    console.warn('Failed sending receipt email', e);
  }

  return updatedUser;
}

export const initializeFlutterwavePayment = async (req, res) => {
  try {
    const { subscription } = req.body;
    const normalizedSubscription = normalizeSubscriptionName(subscription);

    if (!PLAN_CONFIG[normalizedSubscription]) {
      return res.status(400).json({ message: "Choose Lite, Basic, or Premium plan" });
    }

    const txRef = `netchill_${req.user._id}_${normalizedSubscription}_${Date.now()}`;
    const recurringBillingEnabled = Boolean(req.user?.recurringBillingEnabled || req.body?.recurringBillingEnabled);
    const recurringPlanCode = recurringBillingEnabled && normalizedSubscription !== "Free"
      ? await createFlutterwaveRecurringPlan({
          name: `${normalizedSubscription} Plan`,
          amount: PLAN_CONFIG[normalizedSubscription].amount,
          currency: ENV.FLW_CURRENCY || "USD",
        })
      : null;

    const payload = {
      tx_ref: txRef,
      amount: PLAN_CONFIG[normalizedSubscription].amount,
      currency: ENV.FLW_CURRENCY || "USD",
      redirect_url: `${ENV.CLIENT_URL || "http://localhost:3000"}/account.html`,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: req.user.email,
        name: req.user.fullName,
      },
      customizations: {
        title: "NetChill Subscription",
        description: `${normalizedSubscription} subscription payment`,
      },
      meta: {
        userId: String(req.user._id),
        subscription: normalizedSubscription,
        recurringBillingEnabled,
        recurringPlanCode: recurringPlanCode || undefined,
      },
    };

    if (recurringPlanCode) {
      payload.payment_plan = recurringPlanCode;
    }

    const payment = await flutterwaveRequest("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return res.status(200).json({
      message: "Flutterwave checkout initialized",
      paymentLink: payment.data.link,
      txRef,
    });
  } catch (error) {
    console.error("initializeFlutterwavePayment error:", error);
    return res.status(500).json({ message: error.message || "Unable to initialize payment" });
  }
};

export const verifyFlutterwavePayment = async (req, res) => {
  try {
    const { transaction_id: transactionId, tx_ref: txRef } = req.query;

    if (!transactionId || !txRef) {
      return res.status(400).json({ message: "transaction_id and tx_ref are required" });
    }

    const verification = await flutterwaveRequest(`/transactions/${transactionId}/verify`, {
      method: "GET",
    });

    const transaction = verification.data;
    const verifiedTxRef = transaction.tx_ref;

    if (verifiedTxRef !== txRef) {
      return res.status(400).json({ message: "Payment reference mismatch" });
    }

    if (transaction.status !== "successful") {
      return res.status(400).json({ message: "Payment was not successful" });
    }

    const subscription = normalizeSubscriptionName(
      transaction.meta?.subscription || getSubscriptionFromTxRef(txRef) || "Free"
    );
    const txUserId = transaction.meta?.userId || getUserIdFromTxRef(txRef);

    if (String(txUserId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Payment does not belong to this user" });
    }

    // Try to extract a billing/authorization token for recurring use
    const billingToken = transaction.authorization?.authorization_code || transaction.meta?.auth_code || transaction.meta?.billing_token || transaction.customer?.id || null;

    const updatedUser = await applySuccessfulPayment({
      userId: req.user._id,
      subscription,
      amount: transaction.amount,
      txRef,
      transactionId,
      paymentMethod: transaction.payment_type || "Flutterwave",
      currency: transaction.currency,
      billingToken,
    });

    return res.status(200).json({
      message: "Payment verified and subscription activated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("verifyFlutterwavePayment error:", error);
    return res.status(500).json({ message: error.message || "Payment verification failed" });
  }
};

export const flutterwaveWebhook = async (req, res) => {
  try {
    const hash = req.headers["verif-hash"];

    if (!ENV.FLW_WEBHOOK_HASH || hash !== ENV.FLW_WEBHOOK_HASH) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const event = req.body;
    if (event?.event !== "charge.completed") {
      return res.status(200).json({ message: "Event ignored" });
    }

    const data = event.data;
    if (!data || data.status !== "successful") {
      return res.status(200).json({ message: "Charge not successful" });
    }

    const txRef = data.tx_ref;
    const subscription = normalizeSubscriptionName(data.meta?.subscription || getSubscriptionFromTxRef(txRef));
    const userId = data.meta?.userId || getUserIdFromTxRef(txRef);

    if (!userId || !subscription || !PLAN_CONFIG[subscription]) {
      return res.status(400).json({ message: "Invalid payment metadata" });
    }

    const billingToken = data.authorization?.authorization_code || data.meta?.auth_code || data.meta?.billing_token || data.customer?.id || null;

    await applySuccessfulPayment({
      userId,
      subscription,
      amount: data.amount,
      txRef,
      transactionId: data.id,
      paymentMethod: data.payment_type || "Flutterwave",
      currency: data.currency,
      billingToken,
    });

    return res.status(200).json({ message: "Webhook processed" });
  } catch (error) {
    console.error("flutterwaveWebhook error:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

export const simulateWebhook = async (req, res) => {
  try {
    const subscription = normalizeSubscriptionName(req.body?.subscription || req.user?.subscription || "Lite");
    if (!subscription || !PLAN_CONFIG[subscription]) {
      return res.status(400).json({ message: "Invalid subscription for test webhook" });
    }

    const txRef = `simulated_${req.user._id}_${subscription}_${Date.now()}`;
    const updatedUser = await applySuccessfulPayment({
      userId: req.user._id,
      subscription,
      amount: PLAN_CONFIG[subscription].amount,
      txRef,
      transactionId: txRef,
      paymentMethod: "webhook-test",
      currency: ENV.FLW_CURRENCY || "USD",
      billingToken: req.user?.refreshToken || null,
    });

    return res.status(200).json({
      message: "Webhook simulation processed",
      user: updatedUser,
      subscription,
    });
  } catch (error) {
    console.error("simulateWebhook error:", error);
    return res.status(500).json({ message: error.message || "Webhook simulation failed" });
  }
};

export const getSubscriptionHistory = async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const history = [...(user.subscriptionHistory || [])].sort(
      (a, b) => new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime()
    );

    return res.status(200).json({ history });
  } catch (error) {
    console.error("getSubscriptionHistory error:", error);
    return res.status(500).json({ message: "Failed to fetch subscription history" });
  }
};
