import { renewExpiredSubscriptions } from "../lib/user.repository.js";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function runSubscriptionRenewal() {
  const now = new Date();
  const result = await renewExpiredSubscriptions(now.toISOString());
  if (result.renewedCount > 0 || result.downgradedCount > 0) {
    console.log(`[renewal-job] Renewed ${result.renewedCount} paid subscription(s); downgraded ${result.downgradedCount} expired subscription(s) to Free.`);
  }

  return result;
}

export function startSubscriptionRenewalJob() {
  // Run immediately at startup, then run hourly.
  runSubscriptionRenewal().catch((error) => {
    console.error("[renewal-job] Initial run failed:", error.message);
  });

  setInterval(() => {
    runSubscriptionRenewal().catch((error) => {
      console.error("[renewal-job] Scheduled run failed:", error.message);
    });
  }, ONE_HOUR_MS);
}
