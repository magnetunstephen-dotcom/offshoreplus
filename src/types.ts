export type AgreementId = "safe2025" | "sokkel4a2025";
export type ShiftPattern = "day" | "night" | "night-day" | "day-night";
export type LiveAdditionType = "overtime" | "waiting";
export type EarningsView = "trip" | "monthly";
export type CustomAdditionKind = "monthly-fixed" | "trip-fixed" | "trip-hours";
export type CustomAdditionRateBasis = "hourly" | "overtime" | "custom";

export interface SalaryGroup {
  hourly: number[];
  overtime: number[];
}

export interface SalaryAgreement {
  id: AgreementId;
  name: string;
  description: string;
  steps: string[];
  groups: Record<string, SalaryGroup>;
}

export interface LiveAdditionSession {
  id: string;
  type: LiveAdditionType;
  start: string;
  end?: string;
}

export interface CustomAddition {
  id: string;
  name: string;
  kind: CustomAdditionKind;
  enabled: boolean;
  amount: number;
  hours: number;
  occurrences: number;
  rateBasis: CustomAdditionRateBasis;
  customRate: number;
  note?: string;
}

export interface TripSetup {
  heliDeparture: string;
  paidStart: string;
  agreementId: AgreementId;
  group: string;
  stepIndex: number;
  pattern: ShiftPattern;
  taxRate: number;
  hourlyRate: number;
  nightAllowance: number;
  overtimeHours: number;
  overtimeRate: number;
  rotationOnDays: number;
  rotationOffDays: number;
  additionSessions: LiveAdditionSession[];
  swingCompHours: number;
  earningsView: EarningsView;
  customAdditions: CustomAddition[];
}

export interface HolidayEntry {
  date: Date;
  name: string;
  tariffOnly?: boolean;
}

export interface CvExperience {
  id: string;
  employer: string;
  period: string;
  role: string;
  details: string;
}

export interface CvEntry {
  id: string;
  title: string;
  detail: string;
}

export interface CvProfile {
  fullName: string;
  address: string;
  email: string;
  phone: string;
  birthDate: string;
  familyStatus: string;
  linkedin: string;
  keyQualifications: string;
  experiences: CvExperience[];
  education: CvEntry[];
  courses: CvEntry[];
  itSkills: string;
  languages: string;
  interests: string;
  references: CvEntry[];
}
