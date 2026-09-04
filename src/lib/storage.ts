import type { Certificate, CvProfile, TripSetup, UserProfile, YearTrip } from "../types";
import { salaryAgreements } from "../data/salaries";

const TRIP_KEY = "offshoreplus.trip.v1";
const THEME_KEY = "offshoreplus.theme";

export function loadTrip(): TripSetup | null {
  try {
    const value = localStorage.getItem(TRIP_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as TripSetup;
    const salaryGroup = salaryAgreements[parsed.agreementId]?.groups[parsed.group];
    return {
      ...parsed,
      // Oppdater lagrede turer når lønnstabellen endres. Gruppe og trinn er
      // fasiten; brukeren skal ikke måtte starte turen på nytt.
      hourlyRate: salaryGroup?.hourly[parsed.stepIndex] ?? parsed.hourlyRate,
      overtimeHours: parsed.overtimeHours ?? 0,
      taxMethod: parsed.taxMethod ?? "percentage",
      taxTable: parsed.taxTable ?? "",
      overtimeRate: salaryGroup?.overtime[parsed.stepIndex] ?? parsed.overtimeRate ?? 0,
      rotationOnDays: parsed.rotationOnDays ?? 14,
      rotationOffDays: parsed.rotationOffDays ?? 28,
      additionSessions: parsed.additionSessions ?? [],
      swingCompHours: parsed.swingCompHours ?? 0,
      // Appen skal alltid åpne med forventet utbetalt måned som standard.
      earningsView: "monthly-net",
    };
  } catch {
    return null;
  }
}

export function saveTrip(trip: TripSetup): void {
  localStorage.setItem(TRIP_KEY, JSON.stringify(trip));
  notifyStorageChange();
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


const CV_KEY = "offshoreplus.cv.v1";

export function loadCvProfile(): CvProfile | null {
  try {
    const value = localStorage.getItem(CV_KEY);
    return value ? (JSON.parse(value) as CvProfile) : null;
  } catch {
    return null;
  }
}

export function saveCvProfile(profile: CvProfile): void {
  localStorage.setItem(CV_KEY, JSON.stringify(profile));
  notifyStorageChange();
}

const CERTIFICATES_KEY = "offshoreplus.certificates.v1";

export function loadCertificates(): Certificate[] {
  try {
    const value = localStorage.getItem(CERTIFICATES_KEY);
    return value ? (JSON.parse(value) as Certificate[]) : [];
  } catch {
    return [];
  }
}

export function saveCertificates(certificates: Certificate[]): void {
  localStorage.setItem(CERTIFICATES_KEY, JSON.stringify(certificates));
  notifyStorageChange();
}

const PROFILE_KEY = "offshoreplus.profile.v1";
const YEAR_TRIPS_KEY = "offshoreplus.year-trips.v1";

export function loadUserProfile(): UserProfile {
  const fallback: UserProfile = { name: "", employer: "", holidayPayRate: 12, defaultTaxRate: 36, rotationLabel: "2 / 4" };
  try {
    const value = localStorage.getItem(PROFILE_KEY);
    return value ? { ...fallback, ...(JSON.parse(value) as UserProfile) } : fallback;
  } catch { return fallback; }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  notifyStorageChange();
}

export function loadYearTrips(): YearTrip[] {
  try {
    const value = localStorage.getItem(YEAR_TRIPS_KEY);
    return value ? (JSON.parse(value) as YearTrip[]) : [];
  } catch { return []; }
}

export function saveYearTrips(trips: YearTrip[]): void {
  localStorage.setItem(YEAR_TRIPS_KEY, JSON.stringify(trips));
  notifyStorageChange();
}

export const STORAGE_CHANGED_EVENT = "offshoreplus:storage-changed";
function notifyStorageChange() { window.dispatchEvent(new Event(STORAGE_CHANGED_EVENT)); }

export interface AppCloudData {
  trip: TripSetup | null;
  profile: UserProfile;
  yearTrips: YearTrip[];
  cvProfile: CvProfile | null;
  certificates: Certificate[];
}

export function exportCloudData(): AppCloudData {
  return { trip: loadTrip(), profile: loadUserProfile(), yearTrips: loadYearTrips(), cvProfile: loadCvProfile(), certificates: loadCertificates() };
}

export function importCloudData(data: AppCloudData): void {
  if (data.trip) localStorage.setItem(TRIP_KEY, JSON.stringify(data.trip));
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
  localStorage.setItem(YEAR_TRIPS_KEY, JSON.stringify(data.yearTrips));
  if (data.cvProfile) localStorage.setItem(CV_KEY, JSON.stringify(data.cvProfile));
  localStorage.setItem(CERTIFICATES_KEY, JSON.stringify(data.certificates));
  notifyStorageChange();
}
