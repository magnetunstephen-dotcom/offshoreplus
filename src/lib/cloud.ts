import type { User } from "@supabase/supabase-js";
import type { AppCloudData } from "./storage";
import { exportCloudData, importCloudData } from "./storage";
import { supabase } from "./supabase";

function merge(local: AppCloudData, remote: AppCloudData): AppCloudData {
  const trips = new Map(remote.yearTrips.map(t => [t.id, t]));
  local.yearTrips.forEach(t => trips.set(t.id, t));
  const localProfileHasData = Boolean(local.profile.name || local.profile.employer);
  return {
    trip: local.trip ?? remote.trip,
    profile: localProfileHasData ? local.profile : remote.profile,
    yearTrips: [...trips.values()],
    cvProfile: local.cvProfile ?? remote.cvProfile,
    certificates: local.certificates.length ? local.certificates : remote.certificates,
  };
}

export async function syncAccount(user: User): Promise<AppCloudData> {
  const local = exportCloudData();
  const { data, error } = await supabase.from("user_data").select("data").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  const combined = data?.data ? merge(local, data.data as AppCloudData) : local;
  importCloudData(combined);
  const { error: saveError } = await supabase.from("user_data").upsert({ user_id: user.id, data: combined, updated_at: new Date().toISOString() });
  if (saveError) throw saveError;
  return combined;
}

export async function pushLocalData(user: User): Promise<void> {
  const { error } = await supabase.from("user_data").upsert({ user_id: user.id, data: exportCloudData(), updated_at: new Date().toISOString() });
  if (error) throw error;
}
