import type { TripSetup } from "../types";

const TRIP_KEY = "offshoreplus.trip.v1";
const THEME_KEY = "offshoreplus.theme";

export function loadTrip(): TripSetup | null {
  try {
    const value = localStorage.getItem(TRIP_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as TripSetup;
    return {
      ...parsed,
      overtimeHours: parsed.overtimeHours ?? 0,
      overtimeRate: parsed.overtimeRate ?? 0,
      rotationOnDays: parsed.rotationOnDays ?? 14,
      rotationOffDays: parsed.rotationOffDays ?? 28,
      additionSessions: parsed.additionSessions ?? [],
      swingCompHours: parsed.swingCompHours ?? 0,
      earningsView: parsed.earningsView ?? "trip",
    };
  } catch {
    return null;
  }
}

export function saveTrip(trip: TripSetup): void {
  localStorage.setItem(TRIP_KEY, JSON.stringify(trip));
}

export function clearTrip(): void {
  localStorage.removeItem(TRIP_KEY);
}

export function loadTheme(): "dark" | "light" {
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function saveTheme(theme: "dark" | "light"): void {
  localStorage.setItem(THEME_KEY, theme);
}
