import type { AgreementId, SalaryAgreement } from "../types";

export const salaryAgreements: Record<AgreementId, SalaryAgreement> = {
  sokkel4a2025: {
    id: "sokkel4a2025",
    name: "Sokkelavtalen 4A",
    description: "Bedriftstilpasset lønnssystem etter Sokkelavtalens punkt 4A.",
    effectiveFrom: "Satser fra 1. juni 2025",
    steps: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11*"],
    groupDescriptions: {
      S: "Fagansvarlige og sykepleier/HMS-koordinator",
      F: "Operatører, teknikere, elektrikere, mekanikere, kranførere og dekks-/maskinromsoperatører",
    },
    notes: [
      "Satsene inkluderer lokalt sokkeltillegg etter lønnsmatrisen.",
      "Trinn 11 er forbeholdt bestemte stillinger med ekstra ansiennitetsutvikling.",
      "Sykepleier/HMS-koordinator har et fast tillegg på 8 % som må registreres separat under tillegg.",
    ],
    groups: {
      S: {
        monthly: [65886.33, 67002.42, 68118.42, 69234.5, 70350.58, 71466.67, 72582.75, 73698.83, 74814.92, 76317.83, 77433.92],
        hourly: [505, 514, 523, 531, 540, 548, 557, 565, 574, 585, 594],
        overtime: [833.25, 848.1, 862.95, 876.15, 891, 904.2, 919.05, 932.25, 947.1, 965.25, 980.1],
      },
      F: {
        monthly: [63728.58, 64695.83, 65663.08, 66630.33, 67597.58, 68564.92, 69532.17, 70499.42, 71466.67, 72969.67, 74085.75],
        hourly: [489, 496, 504, 511, 519, 526, 533, 541, 548, 560, 568],
        overtime: [806.85, 818.4, 831.6, 843.15, 856.35, 867.9, 879.45, 892.65, 904.2, 924, 937.2],
      },
    },
  },
  safe2025: {
    id: "safe2025",
    name: "SAFE/NR – 2:4 avløsningssystem",
    description:
      "Flyttbare offshoreinnretninger og boring på permanent plasserte innretninger.",
    steps: ["0", "1", "2", "3", "4", "5", "6"],
    groups: {
      A: {
        hourly: [506.37, 516.15, 526.13, 536.31, 546.69, 557.29, 568.09],
        overtime: [835.5, 851.65, 868.12, 884.91, 902.05, 919.52, 937.35],
      },
      B: {
        hourly: [485.3, 494.66, 504.21, 513.95, 523.89, 534.03, 544.36],
        overtime: [800.74, 816.19, 831.95, 848.02, 864.42, 881.14, 898.2],
      },
      C: {
        hourly: [465.14, 474.1, 483.24, 492.56, 502.07, 511.77, 521.66],
        overtime: [767.48, 782.26, 797.34, 812.72, 828.41, 844.41, 860.74],
      },
      D: {
        hourly: [445.84, 454.42, 463.16, 472.09, 481.18, 490.47, 499.93],
        overtime: [735.64, 749.79, 764.22, 778.94, 793.95, 809.27, 824.89],
      },
      E: {
        hourly: [427.38, 435.59, 443.96, 452.49, 461.2, 470.08, 479.14],
        overtime: [705.18, 718.72, 732.53, 746.61, 760.98, 775.64, 790.58],
      },
    },
  },
};
