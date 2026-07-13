import { supabaseAdmin } from "./supabase.js";

export async function createAnalyticsEntry({ action, metadata }) {
  const { error } = await supabaseAdmin.from("analytics").insert({
    action,
    metadata: metadata || {},
  });
  if (error) throw error;
}

export async function getAnalyticsSince(sinceIso) {
  const { data, error } = await supabaseAdmin
    .from("analytics")
    .select("action,timestamp,metadata")
    .gte("timestamp", sinceIso)
    .order("timestamp", { ascending: true });
  if (error) throw error;
  return data || [];
}
