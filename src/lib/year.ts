import type { TripSetup, UserProfile, YearTrip } from "../types";
import { calculateTrip } from "./calculation";
import { addDays } from "./date";

export function snapshotTrip(setup: TripSetup, profile: UserProfile): YearTrip {
  const start = new Date(setup.paidStart);
  const end = addDays(start, setup.rotationOnDays);
  const calc = calculateTrip(setup, new Date(end.getTime() + 60_000));
  const rate = setup.taxRate ?? profile.defaultTaxRate;
  return {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    title: profile.employer || "Offshore-tur",
    startDate: start.toISOString(), endDate: end.toISOString(),
    paymentMonth: end.toISOString().slice(0, 7),
    regularPay: calc.basePay, nightPay: calc.nightPay,
    overtimePay: calc.overtimePay, waitingPay: calc.waitingPay,
    swingPay: calc.swingPay, otherAdditions: calc.customAdditionsPay,
    grossEarned: calc.gross, expectedNet: calc.gross * (1 - rate / 100),
    offshoreDays: setup.rotationOnDays, overtimeHours: calc.overtimeHours,
    createdAt: new Date().toISOString(),
  };
}

export function summarizeYear(trips: YearTrip[], profile: UserProfile, year: number) {
  const rows = trips.filter(t => new Date(t.startDate).getFullYear() === year);
  const sum = (pick: (t: YearTrip) => number) => rows.reduce((n, t) => n + pick(t), 0);
  const gross = sum(t => t.grossEarned);
  const expectedNet = sum(t => t.expectedNet);
  const actualNet = sum(t => t.actualPaid ?? t.expectedNet);
  const lastMonth = rows.reduce((n, t) => Math.max(n, new Date(t.endDate).getMonth() + 1), 0);
  const elapsedMonths = Math.max(1, lastMonth);
  return {
    rows, gross, expectedNet, actualNet,
    regular: sum(t => t.regularPay), overtime: sum(t => t.overtimePay),
    additions: sum(t => t.nightPay + t.waitingPay + t.swingPay + t.otherAdditions),
    offshoreDays: sum(t => t.offshoreDays), overtimeHours: sum(t => t.overtimeHours),
    holidayAccrued: gross * profile.holidayPayRate / 100,
    projectedGross: rows.length ? gross / elapsedMonths * 12 : 0,
    projectedNet: rows.length ? actualNet / elapsedMonths * 12 : 0,
    variance: actualNet - expectedNet,
  };
}
