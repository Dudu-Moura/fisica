export interface PlanetTheme {
  id: string;
  label: string;
  gravity: number;
  pageBgTop: string;
  pageBgBottom: string;
  ink: string;
  inkMuted: string;
  panel: string;
  panelBorder: string;
  accent: string;
  accentDeep: string;
  skyLine: string;
  focus: string;
  error: string;
  skyStops: [string, string, string];
  groundBase: string;
  groundEdge: string;
  stars: boolean;
}

export const PLANETS: PlanetTheme[] = [
  {
    id: "terra",
    label: "Terra",
    gravity: 9.81,
    pageBgTop: "#cfe6f4",
    pageBgBottom: "#e8f0e0",
    ink: "#1e3228",
    inkMuted: "#4a6356",
    panel: "rgba(255, 255, 255, 0.72)",
    panelBorder: "rgba(30, 50, 40, 0.12)",
    accent: "#c45c26",
    accentDeep: "#9a3f14",
    skyLine: "#2a5a8a",
    focus: "#2a5a8a",
    error: "#a33a2c",
    skyStops: ["#8ec5e8", "#c5dff0", "#d9e8c8"],
    groundBase: "#6b8f4e",
    groundEdge: "#557a3c",
    stars: false,
  },
  {
    id: "lua",
    label: "Lua",
    gravity: 1.62,
    pageBgTop: "#10131c",
    pageBgBottom: "#05060a",
    ink: "#e7ebf5",
    inkMuted: "#9aa3b8",
    panel: "rgba(255, 255, 255, 0.07)",
    panelBorder: "rgba(255, 255, 255, 0.14)",
    accent: "#e8b34a",
    accentDeep: "#c68f2a",
    skyLine: "#cfd8ea",
    focus: "#e8b34a",
    error: "#ff8a75",
    skyStops: ["#05070d", "#12141f", "#22242f"],
    groundBase: "#8a867d",
    groundEdge: "#5f5c56",
    stars: true,
  },
  {
    id: "marte",
    label: "Marte",
    gravity: 3.71,
    pageBgTop: "#f0c9a0",
    pageBgBottom: "#f6ded0",
    ink: "#3a1f12",
    inkMuted: "#6b4630",
    panel: "rgba(255, 250, 245, 0.65)",
    panelBorder: "rgba(90, 40, 20, 0.18)",
    accent: "#2a5a8a",
    accentDeep: "#1d3f61",
    skyLine: "#7a3420",
    focus: "#2a5a8a",
    error: "#a33a2c",
    skyStops: ["#d98a4f", "#e6b184", "#f0d2b0"],
    groundBase: "#b5502e",
    groundEdge: "#8a3a1f",
    stars: false,
  },
  {
    id: "jupiter",
    label: "Júpiter",
    gravity: 24.79,
    pageBgTop: "#d9b27e",
    pageBgBottom: "#efd3a0",
    ink: "#3a2410",
    inkMuted: "#6e4f2a",
    panel: "rgba(255, 245, 230, 0.62)",
    panelBorder: "rgba(90, 55, 20, 0.2)",
    accent: "#2a5a8a",
    accentDeep: "#1d3f61",
    skyLine: "#5a3a1e",
    focus: "#2a5a8a",
    error: "#a33a2c",
    skyStops: ["#c98a4a", "#dba86a", "#efc98f"],
    groundBase: "#a66a3a",
    groundEdge: "#7a4b24",
    stars: false,
  },
];

export function findPlanet(gravity: number): PlanetTheme {
  return PLANETS.find((p) => p.gravity === gravity) ?? PLANETS[0];
}
