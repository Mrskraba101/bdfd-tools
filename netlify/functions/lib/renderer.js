const nodePath = require("path");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { getTheme }  = require("./themes");
const { fetchImageBuffer, rgba, formatNumber, getBadgeMeta, clamp } = require("./utils");

// ── Register bundled fonts ────────────────────────────────────────────────
// Lambda has no system fonts; we ship Liberation Sans (Arial-compatible).
// Both weights register under the same family "CardFont" so bold resolves.
const ASSETS_DIR = nodePath.join(__dirname, "..", "assets");
GlobalFonts.registerFromPath(nodePath.join(ASSETS_DIR, "font-regular.ttf"), "CardFont");
GlobalFonts.registerFromPath(nodePath.join(ASSETS_DIR, "font-bold.ttf"),    "CardFont");

const F  = (size)        => `${size}px CardFont`;
const FB = (size)        => `bold ${size}px CardFont`;

// ── Layout constants ──────────────────────────────────────────────────────

const LAYOUTS = {
  full:    { width: 620, height: 200 },
  compact: { width: 420, height: 130 },
  banner:  { width: 680, height: 260 },
};

const AVATAR_SIZE = { full: 80, compact: 54, banner: 96 };
const AVATAR_PAD  = { full: 24, compact: 16, banner: 28 };

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

async function renderCard(params) {
  const theme  = getTheme(params.theme);
  const layout = params.style in LAYOUTS ? params.style : "full";
  const { width, height } = LAYOUTS[layout];

  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext("2d");

  const accent = params.color || theme.accent;

  await drawBackground(ctx, params, theme, width, height);
  if (params.glow) drawGlow(ctx, accent, width, height);
  drawSurface(ctx, theme, width, height, layout);

  const avatarBuf = await fetchImageBuffer(params.avatar);
  const avSize    = AVATAR_SIZE[layout];
  const avPad     = AVATAR_PAD[layout];
  await drawAvatar(ctx, avatarBuf, theme, accent, avPad, avPad, avSize, params.glow);

  const textX = avPad + avSize + avPad;
  drawTextBlock(ctx, params, theme, accent, textX, avPad, width - textX - avPad, layout);

  const hasStats = params.xp != null || params.level != null || params.rank != null
    || params.messages != null || params.streak != null;
  if (hasStats) drawStats(ctx, params, theme, accent, textX, height, width, avPad, layout);
  if (params.badges.length > 0) drawBadges(ctx, params.badges, theme, width, avPad, layout);

  drawBorder(ctx, theme, accent, width, height, params.glow);

  return canvas.encode("png");
}

// ─────────────────────────────────────────────────────────────────────────
// Draw helpers
// ─────────────────────────────────────────────────────────────────────────

async function drawBackground(ctx, params, theme, width, height) {
  ctx.save();
  roundRect(ctx, 0, 0, width, height, theme.borderRadius);
  ctx.clip();

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);

  if (params.bg) {
    try {
      const buf = await fetchImageBuffer(params.bg);
      if (buf) {
        const img   = await loadImage(buf);
        const scale = Math.max(width / img.width, height / img.height);
        const dw    = img.width  * scale;
        const dh    = img.height * scale;
        const dx    = (width  - dw) / 2;
        const dy    = (height - dh) / 2;
        if (params.blur > 0) ctx.filter = `blur(${params.blur}px)`;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.filter = "none";
      }
    } catch {}
  }

  if (params.overlay !== "none") {
    ctx.fillStyle = params.overlay === "light"
      ? "rgba(255,255,255,0.50)"
      : theme.overlayColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

function drawGlow(ctx, accent, width, height) {
  const grad = ctx.createRadialGradient(
    width * 0.3, height * 0.5, 0,
    width * 0.3, height * 0.5, width * 0.6
  );
  grad.addColorStop(0, rgba(accent, 0.18));
  grad.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawSurface(ctx, theme, width, height, layout) {
  if (layout === "banner") {
    ctx.save();
    roundRect(ctx, 10, 10, width - 20, height - 20, Math.max(theme.borderRadius - 4, 4));
    ctx.fillStyle = rgba(theme.surface, 0.55);
    ctx.fill();
    ctx.restore();
  }
}

async function drawAvatar(ctx, buf, theme, accent, x, y, size, glow) {
  ctx.save();

  if (glow) {
    const ringGrad = ctx.createRadialGradient(
      x + size / 2, y + size / 2, size * 0.4,
      x + size / 2, y + size / 2, size * 0.7
    );
    ringGrad.addColorStop(0, rgba(accent, 0.6));
    ringGrad.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  if (buf) {
    try {
      const img = await loadImage(buf);
      ctx.drawImage(img, x, y, size, size);
    } catch {
      drawAvatarFallback(ctx, theme, accent, x, y, size);
    }
  } else {
    drawAvatarFallback(ctx, theme, accent, x, y, size);
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 2, 0, Math.PI * 2);
  ctx.strokeStyle = accent;
  ctx.lineWidth   = 3;
  ctx.stroke();
}

function drawAvatarFallback(ctx, theme, accent, x, y, size) {
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, theme.surface);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = rgba(theme.text, 0.5);
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.38, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + size * 0.5, y + size * 0.82, size * 0.3, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTextBlock(ctx, params, theme, accent, x, y, maxW, layout) {
  const isCompact = layout === "compact";

  // ── Title tag ────────────────────────────────────────────────────────────
  if (params.title && !isCompact) {
    ctx.font = FB(10);
    const tagText = params.title.toUpperCase();
    const tagPad  = 6;
    const tw      = ctx.measureText(tagText).width + tagPad * 2;
    roundRect(ctx, x, y, tw, 18, 4);
    ctx.fillStyle = rgba(accent, 0.18);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillText(tagText, x + tagPad, y + 12);
    y += 24;
  }

  // ── Username ─────────────────────────────────────────────────────────────
  const userSize = isCompact ? 16 : 22;
  ctx.font      = FB(userSize);
  ctx.fillStyle = theme.text;
  ctx.fillText(params.username, x, y + userSize);
  y += userSize + 4;

  // ── User ID ──────────────────────────────────────────────────────────────
  if (params.userId && !isCompact) {
    ctx.font      = F(12);
    ctx.fillStyle = theme.textMuted;
    ctx.fillText(`#${params.userId}`, x, y + 12);
    y += 18;
  }

  // ── Bio ──────────────────────────────────────────────────────────────────
  if (params.bio && (layout === "full" || layout === "banner")) {
    ctx.font      = F(12);
    ctx.fillStyle = theme.textSecondary;
    wrapText(ctx, params.bio, maxW).slice(0, 2).forEach(line => {
      ctx.fillText(line, x, y + 14);
      y += 16;
    });
  }
}

function drawStats(ctx, params, theme, accent, textX, cardHeight, cardWidth, pad, layout) {
  const isCompact = layout === "compact";
  const statsY    = isCompact ? cardHeight - 34 : cardHeight - 58;
  const statsW    = cardWidth - textX - pad;

  // ── Stat pills ───────────────────────────────────────────────────────────
  const pills = [];
  if (params.rank     != null) pills.push({ label: `#${params.rank}`,               icon: "Rank"     });
  if (params.messages != null) pills.push({ label: `${formatNumber(params.messages)} msgs`, icon: "Msgs" });
  if (params.streak   != null) pills.push({ label: `${params.streak}d streak`,       icon: "Streak"   });

  if (pills.length && !isCompact) {
    ctx.font = F(11);
    let px = textX;
    pills.forEach(p => {
      const tw = ctx.measureText(p.label).width + 16;
      roundRect(ctx, px, statsY, tw, 22, 11);
      ctx.fillStyle = rgba(accent, 0.15);
      ctx.fill();
      ctx.fillStyle = theme.textSecondary;
      ctx.fillText(p.label, px + 8, statsY + 15);
      px += tw + 8;
    });
  }

  // ── XP bar ───────────────────────────────────────────────────────────────
  if (params.xp != null || params.level != null) {
    const barY = isCompact ? cardHeight - 20 : cardHeight - 28;
    const barH = isCompact ? 8 : 10;
    const barX = isCompact ? pad : textX;
    const barW = isCompact ? cardWidth - pad * 2 : statsW;

    if (params.level != null && !isCompact) {
      ctx.font      = FB(11);
      ctx.fillStyle = theme.textMuted;
      const lbl = params.xp != null
        ? `Level ${params.level}  ·  ${formatNumber(params.xp)} / ${formatNumber(params.xpMax || params.xp * 2)} XP`
        : `Level ${params.level}`;
      ctx.fillText(lbl, barX, barY - 5);
    }

    roundRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.fillStyle = theme.progressBg;
    ctx.fill();

    const pct = params.xpMax
      ? clamp(params.xp / params.xpMax, 0, 1)
      : params.xp != null ? 0.65 : 0;

    if (pct > 0) {
      const fillW = Math.max(barH, barW * pct);
      const grad  = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      grad.addColorStop(0, theme.progressFill[0]);
      grad.addColorStop(1, theme.progressFill[1] || theme.progressFill[0]);
      roundRect(ctx, barX, barY, fillW, barH, barH / 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }
}

function drawBadges(ctx, badges, theme, cardWidth, pad, layout) {
  const isCompact = layout === "compact";
  const badgeH    = isCompact ? 18 : 22;
  const badgeGap  = 6;
  const by        = isCompact ? pad : pad + 4;

  // Measure all badges first so we can right-align
  ctx.font = F(isCompact ? 10 : 11);
  const items = badges.map(key => {
    const meta = getBadgeMeta(key);
    // Use text label instead of emoji — emoji rendering is unreliable on Lambda
    const text = meta.label.toUpperCase();
    const tw   = ctx.measureText(text).width + 12;
    return { text, tw, color: meta.color };
  });

  let bx = cardWidth - pad;
  [...items].reverse().forEach(item => {
    bx -= item.tw + badgeGap;
    roundRect(ctx, bx, by, item.tw, badgeH, badgeH / 2);
    ctx.fillStyle = rgba(item.color, 0.25);
    ctx.fill();
    ctx.strokeStyle = rgba(item.color, 0.8);
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, bx + 6, by + badgeH - 5);
  });
}

function drawBorder(ctx, theme, accent, width, height, glow) {
  ctx.save();
  roundRect(ctx, 0, 0, width, height, theme.borderRadius);
  if (glow) {
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur  = 16;
  }
  ctx.strokeStyle = glow ? accent : theme.border;
  ctx.lineWidth   = glow ? 2 : 1.5;
  ctx.stroke();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y,         x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words   = text.split(" ");
  const lines   = [];
  let   current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

module.exports = { renderCard };
