import type { AgreementId, SalaryAgreement } from "../types";

export const salaryAgreements: Record<AgreementId, SalaryAgreement> = {
  custom: {
    id: "custom",
    name: "Egendefinert lønn",
    description: "For deg som ikke finner tariffen din. Legg inn satsene fra arbeidsavtalen eller lønnsslippen.",
    steps: ["Egen sats"],
    groups: { Egen: { hourly: [0], overtime: [0], monthly: [0] } },
    notes: ["Bruk avtalte bruttosatser. OffshorePlus beregner ikke en ukjent tariff automatisk."],
  },
  sokkel4a2025: {
    id: "sokkel4a2025",
    name: "Sokkelavtalen 4A",
    description: "Bedriftstilpasset lønnssystem etter Sokkelavtalens punkt 4A.",
    effectiveFrom: "Satser fra 1. juni 2026",
    steps: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11*"],
    groupDescriptions: {
      S: "Fagansvarlige og sykepleier/HMS-koordinator",
      F: "Operatører, teknikere, elektrikere, mekanikere, kranførere og dekks-/maskinromsoperatører",
    },
    notes: [
      "Satsene inkluderer lokalt sokkeltillegg etter lønnsmatrisen, regulert fra 1. juni 2026.",
      "Tekniske tillegg er ikke endret her, siden disse justeres i det sentrale oppgjøret.",
      "Trinn 11 er forbeholdt bestemte stillinger med ekstra ansiennitetsutvikling.",
      "Sykepleier/HMS-koordinator har et fast tillegg på 8 % som må registreres separat under tillegg.",
    ],
    groups: {
      S: {
        monthly: [69081.77, 70252.01, 71422.17, 72592.41, 73762.57, 74932.81, 76102.98, 77273.21, 78443.38, 80362.5, 80956.77],
        hourly: [529.49, 538.93, 548.37, 556.75, 566.19, 574.58, 584.01, 592.4, 601.84, 616.52, 621.53],
        overtime: [874.45, 889.13, 903.81, 918.49, 933.16, 948.89, 963.57, 978.25, 992.93, 1017.04, 1024.44],
      },
      F: {
        monthly: [66853.57, 67833.56, 68847.77, 69861.9, 70876.12, 71890.25, 72904.46, 73918.6, 74932.81, 76851.93, 77538.1],
        hourly: [512.98, 520.06, 528.44, 535.78, 544.17, 551.51, 558.85, 567.24, 574.58, 589.26, 594.98],
        overtime: [846.57, 858.72, 871.3, 883.89, 897.52, 909.99, 922.68, 936.31, 948.89, 973.01, 981.56],
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
