const fetch = require("node-fetch");

// ── Query parameter parser ────────────────────────────────────────────────

/**
 * Safely parse all supported query parameters from a URL query string.
 * All fields are optional; sane defaults are provided.
 *
 * @param {object} queryParams  Raw key→value object from URL
 * @returns {object}            Cleaned, validated parameter set
 */
function parseParams(queryParams) {
  const q = queryParams || {};

  return {
    // Identity
    userId:   sanitizeText(q.user,     16),
    username: sanitizeText(q.username, 32) || "User",
    avatar:   sanitizeUrl(q.avatar),
    title:    sanitizeText(q.title,    40),
    bio:      sanitizeText(q.bio,      120),

    // Appearance
    theme:    sanitizeEnum(q.theme,   ["dark","cyberpunk","pastel","minimal"], "dark"),
    color:    sanitizeHex(q.color),
    bg:       sanitizeUrl(q.bg),
    overlay:  sanitizeEnum(q.overlay, ["dark","light","none"], "dark"),
    blur:     sanitizeInt(q.blur, 0, 20, 0),
    glow:     sanitizeBool(q.glow, false),

    // Layout
    style:    sanitizeEnum(q.style, ["compact","full","banner"], "full"),

    // Stats
    xp:       sanitizeInt(q.xp,       0, 9_999_999, null),
    xpMax:    sanitizeInt(q.xpmax,    1, 9_999_999, null),
    level:    sanitizeInt(q.level,    0, 9999,      null),
    rank:     sanitizeInt(q.rank,     0, 9999,      null),
    messages: sanitizeInt(q.messages, 0, 9_999_999, null),
    streak:   sanitizeInt(q.streak,   0, 9999,      null),

    // Badges
    badges:   parseBadges(q.badges),
  };
}

// ── Sanitisers ────────────────────────────────────────────────────────────

function sanitizeText(val, maxLen) {
  if (typeof val !== "string" || !val.trim()) return null;
  return val.trim().slice(0, maxLen);
}

function sanitizeUrl(val) {
  if (typeof val !== "string") return null;
  try {
    const u = new URL(val);
    if (u.protocol === "https:" || u.protocol === "http:") return u.href;
  } catch {}
  return null;
}

function sanitizeHex(val) {
  if (typeof val !== "string") return null;
  const cleaned = val.replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return "#" + cleaned;
  }
  return null;
}

function sanitizeEnum(val, allowed, def) {
  if (typeof val === "string" && allowed.includes(val.toLowerCase())) {
    return val.toLowerCase();
  }
  return def;
}

function sanitizeInt(val, min, max, def) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function sanitizeBool(val, def) {
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return def;
}

function parseBadges(val) {
  if (typeof val !== "string" || !val.trim()) return [];
  const allowed = ["vip","mod","booster","dev","staff","bot","early","verified","premium","partner"];
  return val.split(",")
    .map(b => b.trim().toLowerCase())
    .filter(b => allowed.includes(b))
    .slice(0, 8);
}

// ── Image fetching ────────────────────────────────────────────────────────

/**
 * Fetch a remote image and return a Buffer.
 * Returns null on any error so callers can use fallbacks.
 *
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<Buffer|null>}
 */
async function fetchImageBuffer(url, timeoutMs = 4000) {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// ── Colour helpers ────────────────────────────────────────────────────────

/** Hex → {r,g,b} */
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full  = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Build rgba() string */
function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Clamp a number */
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

/** Format large numbers: 1200 → "1.2K" */
function formatNumber(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ── Badge emoji map ───────────────────────────────────────────────────────

const BADGE_META = {
  vip:      { label: "VIP",      emoji: "👑", color: "#ffd700" },
  mod:      { label: "Mod",      emoji: "🛡️", color: "#5865f2" },
  booster:  { label: "Booster",  emoji: "🚀", color: "#ff73fa" },
  dev:      { label: "Dev",      emoji: "⚙️", color: "#43b581" },
  staff:    { label: "Staff",    emoji: "🔧", color: "#f04747" },
  bot:      { label: "Bot",      emoji: "🤖", color: "#7289da" },
  early:    { label: "Early",    emoji: "🌟", color: "#faa61a" },
  verified: { label: "Verified", emoji: "✅", color: "#3ba55d" },
  premium:  { label: "Premium",  emoji: "💎", color: "#00d4ff" },
  partner:  { label: "Partner",  emoji: "🤝", color: "#ff8c00" },
};

function getBadgeMeta(key) {
  return BADGE_META[key] || { label: key, emoji: "🏷️", color: "#888888" };
}

module.exports = {
  parseParams,
  fetchImageBuffer,
  hexToRgb,
  rgba,
  clamp,
  formatNumber,
  getBadgeMeta,
};
