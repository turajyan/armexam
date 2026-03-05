// ── Theme definitions ─────────────────────────────────────────────────────────

export const THEMES = {
  dark: {
    id: "dark",
    label: "Dark 🌙",
    bg:      "#04080f",
    panel:   "#080f1a",
    card:    "#0d1829",
    border:  "#1a2540",
    border2: "#243050",
    dim:     "#1e293b",
    text:    "#e2e8f0",
    textSub: "#94a3b8",
    muted:   "#475569",
    gold:    "#c8a96e",
    goldDim: "#7c5830",
    success: "#22c55e",
    danger:  "#f87171",
    warning: "#f59e0b",
    info:    "#60a5fa",
    purple:  "#a78bfa",
    // scrollbar
    scrollThumb: "#243050",
    // sidebar
    sidebarBg:   "#080f1a",
    topbarBg:    "#080f1acc",
  },

  medium: {
    id: "medium",
    label: "Dim 🌆",
    bg:      "#1a1f2e",
    panel:   "#222840",
    card:    "#2a3050",
    border:  "#353d5c",
    border2: "#404870",
    dim:     "#2e3655",
    text:    "#dce3f0",
    textSub: "#8a94b0",
    muted:   "#5e6a8a",
    gold:    "#d4b278",
    goldDim: "#8a6535",
    success: "#34d399",
    danger:  "#fb7185",
    warning: "#fbbf24",
    info:    "#67b8f8",
    purple:  "#b89cf8",
    scrollThumb: "#404870",
    sidebarBg:   "#1e2438",
    topbarBg:    "#1e2438cc",
  },

  light: {
    id: "light",
    label: "Light ☀️",
    bg:      "#f0f4fa",
    panel:   "#ffffff",
    card:    "#f8faff",
    border:  "#dde3f0",
    border2: "#c8d0e8",
    dim:     "#e8edf8",
    text:    "#1a2040",
    textSub: "#4a5580",
    muted:   "#7a84a0",
    gold:    "#9a6c28",
    goldDim: "#c49040",
    success: "#16a34a",
    danger:  "#dc2626",
    warning: "#d97706",
    info:    "#2563eb",
    purple:  "#7c3aed",
    scrollThumb: "#c8d0e8",
    sidebarBg:   "#ffffff",
    topbarBg:    "#ffffffcc",
  },
};

export const DEFAULT_THEME = "dark";

// React context key for theme
export const THEME_KEY = "armexam_theme";

export const SETTINGS_KEY = "armexam_settings";
