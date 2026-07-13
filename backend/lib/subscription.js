export const PLAN_CONFIG = {
  Free: {
    amount: 0,
    durationDays: 2,
  },
  Lite: {
    amount: 0.025,
    durationDays: 2,
  },
  Basic: {
    amount: 0.5,
    durationDays: 7,
  },
  Premium: {
    amount: 0.85,
    durationDays: 30,
  },
};

export function getPlanConfig(subscription) {
  return PLAN_CONFIG[subscription] || PLAN_CONFIG.Free;
}

export function getNextBillingDate(fromDate = new Date(), subscription) {
  const plan = getPlanConfig(subscription);
  const next = new Date(fromDate);
  next.setDate(next.getDate() + plan.durationDays);
  return next;
}
