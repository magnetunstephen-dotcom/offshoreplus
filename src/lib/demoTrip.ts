import { salaryAgreements } from "../data/salaries";
import type { TripSetup } from "../types";

// Preview only: never persist or sync this example as a user's trip.
export function createDemoTrip(now = new Date()): TripSetup {
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const rates = salaryAgreements.sokkel4a2025.groups.F;
  return {
    heliDeparture: start.toISOString(), paidStart: start.toISOString(),
    agreementId: "sokkel4a2025", group: "F", stepIndex: 1,
    pattern: now.getHours() >= 7 && now.getHours() < 19 ? "day" : "night", taxRate: 35, taxMethod: "percentage",
    hourlyRate: rates.hourly[1], overtimeRate: rates.overtime[1],
    nightAllowance: 136, overtimeHours: 0, rotationOnDays: 14, rotationOffDays: 28,
    additionSessions: [], swingCompHours: 0, earningsView: "monthly-gross", customAdditions: [],
  };
}
