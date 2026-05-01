/**
 * Theme configurations for Discord-style profile cards.
 * Each theme defines colors, fonts, gradients, glow, and layout hints.
 * Add a new theme by exporting a new key following this schema.
 */

const THEMES = {
  // ── Dark (Discord default feel) ──────────────────────────────────────────
  dark: {
    background: "#1e2030",
    surface: "#252840",
    surfaceAlt: "#2e3250",
    accent: "#5865f2",
    accentGradient: ["#5865f2", "#7289da"],
    text: "#ffffff",
    textMuted: "#8e9297",
    textSecondary: "#b9bbbe",
    progressBg: "#1a1d2e",
    progressFill: ["#5865f2", "#7289da"],
    badgeBg: "#2e3250",
    badgeText: "#ffffff",
    border: "#3d4270",
    glow: "rgba(88,101,242,0.4)",
    font: "bold",
    borderRadius: 18,
    shadowColor: "rgba(0,0,0,0.6)",
    overlayColor: "rgba(30,32,48,0.75)",
  },

  // ── Cyberpunk ────────────────────────────────────────────────────────────
  cyberpunk: {
    background: "#0a0a1a",
    surface: "#10102a",
    surfaceAlt: "#1a0a2e",
    accent: "#00ffcc",
    accentGradient: ["#00ffcc", "#ff00aa"],
    text: "#e0e0ff",
    textMuted: "#7070aa",
    textSecondary: "#a0a0dd",
    progressBg: "#05051a",
    progressFill: ["#00ffcc", "#ff00aa"],
    badgeBg: "#1a0a2e",
    badgeText: "#00ffcc",
    border: "#00ffcc",
    glow: "rgba(0,255,204,0.5)",
    font: "bold",
    borderRadius: 4,
    shadowColor: "rgba(0,255,204,0.2)",
    overlayColor: "rgba(10,10,26,0.82)",
  },

  // ── Pastel ───────────────────────────────────────────────────────────────
  pastel: {
    background: "#f0e6ff",
    surface: "#ffffff",
    surfaceAlt: "#fce4ec",
    accent: "#c77dff",
    accentGradient: ["#c77dff", "#ff9de2"],
    text: "#3a2a4a",
    textMuted: "#9e82b0",
    textSecondary: "#6e5a80",
    progressBg: "#e8d5f5",
    progressFill: ["#c77dff", "#ff9de2"],
    badgeBg: "#fce4ec",
    badgeText: "#6e5a80",
    border: "#e0c8f0",
    glow: "rgba(199,125,255,0.3)",
    font: "normal",
    borderRadius: 24,
    shadowColor: "rgba(100,60,120,0.15)",
    overlayColor: "rgba(240,230,255,0.70)",
  },

  // ── Minimal ──────────────────────────────────────────────────────────────
  minimal: {
    background: "#f9f9f9",
    surface: "#ffffff",
    surfaceAlt: "#f0f0f0",
    accent: "#1a1a1a",
    accentGradient: ["#1a1a1a", "#555555"],
    text: "#111111",
    textMuted: "#888888",
    textSecondary: "#444444",
    progressBg: "#e0e0e0",
    progressFill: ["#333333", "#777777"],
    badgeBg: "#eeeeee",
    badgeText: "#333333",
    border: "#dddddd",
    glow: "rgba(0,0,0,0.08)",
    font: "normal",
    borderRadius: 12,
    shadowColor: "rgba(0,0,0,0.1)",
    overlayColor: "rgba(249,249,249,0.80)",
  },
};

/**
 * Returns a theme by name, falling back to "dark" if unknown.
 * @param {string} name
 * @returns {object}
 */
function getTheme(name) {
  return THEMES[name] || THEMES.dark;
}

module.exports = { THEMES, getTheme };
