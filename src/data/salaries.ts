import type { AgreementId, SalaryAgreement } from "../types";

export const salaryAgreements: Record<AgreementId, SalaryAgreement> = {
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
  sokkel4a2025: {
    id: "sokkel4a2025",
    name: "Sokkelavtalen 4a",
    description: "Stillinger omfattet av Sokkelavtalens 4a-bestemmelser.",
    steps: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11*"],
    groups: {
      S: {
        hourly: [505, 514, 523, 531, 540, 548, 557, 565, 574, 588, 597],
        overtime: [834, 848, 862, 876, 890, 905, 919, 933, 947, 970, 984],
      },
      F: {
        hourly: [488, 496, 504, 511, 519, 526, 533, 541, 548, 562, 571],
        overtime: [807, 819, 831, 843, 856, 868, 880, 892, 905, 928, 942],
      },
    },
  },
};
