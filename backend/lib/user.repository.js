import { supabaseAdmin } from "./supabase.js";
import { PLAN_CONFIG, getNextBillingDate } from "./subscription.js";

const USER_COLUMNS = [
  "id",
  "full_name",
  "email",
  "password",
  "profile_picture",
  "subscription",
  "payment_status",
  "trial_start_date",
  "trial_end_date",
  "subscription_start_date",
  "subscription_end_date",
  "last_payment_amount",
  "last_payment_date",
  "last_payment_method",
  "last_payment_txn_id",
  "subscription_history",
  "refresh_token",
  "recurring_billing_enabled",
  "created_at",
  "updated_at",
].join(",");

function mapUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    password: row.password,
    profilePicture: row.profile_picture || "",
    subscription: row.subscription || "Free",
    paymentStatus: row.payment_status || "Unpaid",
    trialStartDate: row.trial_start_date,
    trialEndDate: row.trial_end_date,
    subscriptionStartDate: row.subscription_start_date,
    subscriptionEndDate: row.subscription_end_date,
    lastPaymentAmount: row.last_payment_amount || 0,
    lastPaymentDate: row.last_payment_date,
    lastPaymentMethod: row.last_payment_method || "",
    lastPaymentTxnId: row.last_payment_txn_id || "",
    subscriptionHistory: Array.isArray(row.subscription_history) ? row.subscription_history : [],
    refreshToken: row.refresh_token || "",
    recurringBillingEnabled: Boolean(row.recurring_billing_enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUserUpdate(data) {
  const update = {};
  if (Object.hasOwn(data, "fullName")) update.full_name = data.fullName;
  if (Object.hasOwn(data, "email")) update.email = data.email;
  if (Object.hasOwn(data, "password")) update.password = data.password;
  if (Object.hasOwn(data, "profilePicture")) update.profile_picture = data.profilePicture;
  if (Object.hasOwn(data, "subscription")) update.subscription = data.subscription;
  if (Object.hasOwn(data, "paymentStatus")) update.payment_status = data.paymentStatus;
  if (Object.hasOwn(data, "trialStartDate")) update.trial_start_date = data.trialStartDate;
  if (Object.hasOwn(data, "trialEndDate")) update.trial_end_date = data.trialEndDate;
  if (Object.hasOwn(data, "subscriptionStartDate")) update.subscription_start_date = data.subscriptionStartDate;
  if (Object.hasOwn(data, "subscriptionEndDate")) update.subscription_end_date = data.subscriptionEndDate;
  if (Object.hasOwn(data, "lastPaymentAmount")) update.last_payment_amount = data.lastPaymentAmount;
  if (Object.hasOwn(data, "lastPaymentDate")) update.last_payment_date = data.lastPaymentDate;
  if (Object.hasOwn(data, "lastPaymentMethod")) update.last_payment_method = data.lastPaymentMethod;
  if (Object.hasOwn(data, "lastPaymentTxnId")) update.last_payment_txn_id = data.lastPaymentTxnId;
  if (Object.hasOwn(data, "subscriptionHistory")) update.subscription_history = data.subscriptionHistory;
  if (Object.hasOwn(data, "refreshToken")) update.refresh_token = data.refreshToken;
  if (Object.hasOwn(data, "recurringBillingEnabled")) update.recurring_billing_enabled = data.recurringBillingEnabled;
  update.updated_at = new Date().toISOString();
  return update;
}

async function runSingle(query) {
  const { data, error } = await query.single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function findUserByEmail(email) {
  const row = await runSingle(
    supabaseAdmin.from("users").select(USER_COLUMNS).eq("email", email)
  );
  return mapUser(row);
}

export async function findUserById(id) {
  const row = await runSingle(
    supabaseAdmin.from("users").select(USER_COLUMNS).eq("id", id)
  );
  return mapUser(row);
}

export async function createUser(userData) {
  const payload = {
    full_name: userData.fullName,
    email: userData.email,
    password: userData.password,
    profile_picture: userData.profilePicture || "",
    subscription: userData.subscription || "Free",
    payment_status: userData.paymentStatus || "Unpaid",
    trial_start_date: userData.trialStartDate,
    trial_end_date: userData.trialEndDate,
    subscription_start_date: userData.subscriptionStartDate,
    subscription_end_date: userData.subscriptionEndDate,
    last_payment_amount: userData.lastPaymentAmount || 0,
    last_payment_date: userData.lastPaymentDate,
    last_payment_method: userData.lastPaymentMethod || "",
    last_payment_txn_id: userData.lastPaymentTxnId || "",
    subscription_history: userData.subscriptionHistory || [],
    refresh_token: userData.refreshToken || "",
    recurring_billing_enabled: Boolean(userData.recurringBillingEnabled),
  };

  const row = await runSingle(
    supabaseAdmin.from("users").insert(payload).select(USER_COLUMNS)
  );
  return mapUser(row);
}

export async function updateUserById(id, updates) {
  const row = await runSingle(
    supabaseAdmin.from("users").update(toUserUpdate(updates)).eq("id", id).select(USER_COLUMNS)
  );
  return mapUser(row);
}

export async function countUsers() {
  const { count, error } = await supabaseAdmin.from("users").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

export async function getAllUsers() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(USER_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapUser);
}

export async function getRecentUsers(limit = 6) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(USER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapUser);
}

export async function getSubscriptionBreakdown() {
  const users = await getAllUsers();
  return users.reduce(
    (acc, user) => {
      const key = user.subscription || "Free";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { Free: 0, Basic: 0, Premium: 0 }
  );
}

export async function renewExpiredSubscriptions(nowIso) {
  const now = new Date(nowIso);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(USER_COLUMNS)
    .eq("payment_status", "Paid")
    .lt("subscription_end_date", nowIso);

  if (error) throw error;

  const users = (data || []).map(mapUser).filter(Boolean);
  let renewedCount = 0;
  let downgradedCount = 0;

  for (const user of users) {
    const plan = user.subscription || "Free";
    const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.Free;
    const hasBillingToken = Boolean(user.refreshToken);

    if (!hasBillingToken) {
      await updateUserById(user._id, {
        subscription: "Free",
        paymentStatus: "Unpaid",
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        lastPaymentMethod: user.lastPaymentMethod || "expired",
        lastPaymentTxnId: `${user.lastPaymentTxnId || "expired"}-downgraded`,
        subscriptionHistory: [
          ...(Array.isArray(user.subscriptionHistory) ? user.subscriptionHistory : []),
          {
            plan: "Free",
            amount: 0,
            currency: "USD",
            status: "expired",
            gateway: "system",
            txRef: `renewal_${user._id}_${Date.now()}`,
            transactionId: `renewal_${user._id}`,
            paymentMethod: "system",
            paidAt: now.toISOString(),
            periodStart: now.toISOString(),
            periodEnd: now.toISOString(),
          },
        ],
      });
      downgradedCount += 1;
      continue;
    }

    const nextBilling = getNextBillingDate(now, plan);
    const history = Array.isArray(user.subscriptionHistory) ? user.subscriptionHistory : [];

    await updateUserById(user._id, {
      subscription: plan,
      paymentStatus: "Paid",
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: nextBilling.toISOString(),
      lastPaymentAmount: Number(user.lastPaymentAmount || planConfig.amount || 0),
      lastPaymentDate: now.toISOString(),
      lastPaymentMethod: user.lastPaymentMethod || "auto-renew",
      lastPaymentTxnId: user.lastPaymentTxnId || `auto-renew-${user._id}`,
      subscriptionHistory: [
        ...history,
        {
          plan,
          amount: Number(user.lastPaymentAmount || planConfig.amount || 0),
          currency: "USD",
          status: "renewed",
          gateway: "auto-renew",
          txRef: `renewal_${user._id}_${Date.now()}`,
          transactionId: `renewal_${user._id}`,
          paymentMethod: user.lastPaymentMethod || "auto-renew",
          paidAt: now.toISOString(),
          periodStart: now.toISOString(),
          periodEnd: nextBilling.toISOString(),
        },
      ],
    });
    renewedCount += 1;
  }

  return { renewedCount, downgradedCount };
}
