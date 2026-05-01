/**
 * Netlify Function: /card
 *
 * Generates a Discord-style profile card PNG from URL query parameters.
 * All parameters are optional — safe defaults are used when omitted.
 *
 * Example:
 *   GET /card?username=Nova&theme=cyberpunk&level=42&xp=3200&xpmax=5000&badges=vip,mod&glow=true
 */

const { parseParams } = require("./lib/utils");
const { renderCard }  = require("./lib/renderer");

// Simple in-memory LRU-style cache (key → {buf, ts})
const CACHE     = new Map();
const CACHE_TTL = 60_000; // 60 s
const CACHE_MAX = 100;

exports.handler = async function (event) {
  // Only GET allowed
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const params   = parseParams(event.queryStringParameters || {});
    const cacheKey = buildCacheKey(event.queryStringParameters);

    // ── Cache hit ────────────────────────────────────────────────────────
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return pngResponse(cached.buf, true);
    }

    // ── Render ───────────────────────────────────────────────────────────
    const pngBuffer = await renderCard(params);

    // Evict oldest if full
    if (CACHE.size >= CACHE_MAX) {
      CACHE.delete(CACHE.keys().next().value);
    }
    CACHE.set(cacheKey, { buf: pngBuffer, ts: Date.now() });

    return pngResponse(pngBuffer, false);

  } catch (err) {
    console.error("[card] Render error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate card", message: err.message }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────

function buildCacheKey(q) {
  if (!q) return "default";
  return Object.keys(q).sort().map(k => `${k}=${q[k]}`).join("&");
}

function pngResponse(buf, fromCache) {
  return {
    statusCode:      200,
    isBase64Encoded: true,
    body:            buf.toString("base64"),
    headers: {
      "Content-Type":  "image/png",
      "Cache-Control": "public, max-age=60",
      "X-Cache":       fromCache ? "HIT" : "MISS",
      "Access-Control-Allow-Origin": "*",
    },
  };
}
