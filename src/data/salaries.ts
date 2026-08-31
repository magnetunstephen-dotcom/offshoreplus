import type { AgreementId, SalaryAgreement } from "../types";

export const salaryAgreements: Record<AgreementId, SalaryAgreement> = {
  sokkel4a2025: {
    id: "sokkel4a2025",
    name: "Sokkelavtalen 4A",
    description: "Bedriftstilpasset lønnssystem etter Sokkelavtalens punkt 4A.",
    effectiveFrom: "Satser fra 1. juni 2024",
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
        monthly: [63282, 64398, 65514, 66630, 67746, 68863, 69979, 71095, 72211, 73714, 74830],
        hourly: [485, 494, 503, 511, 520, 528, 537, 545, 554, 565, 574],
        overtime: [801, 815, 829, 843, 858, 872, 886, 900, 914, 933, 947],
      },
      F: {
        monthly: [61124, 62092, 63059, 64026, 64993, 65961, 66928, 67895, 68863, 70365, 71482],
        hourly: [469, 476, 484, 491, 499, 506, 513, 521, 528, 540, 548],
        overtime: [774, 786, 798, 810, 823, 835, 847, 859, 872, 891, 905],
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
