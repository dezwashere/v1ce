import React from "react";

const COIN_COLORS = {
  gold: { bg: "#F5D680", border: "#0a0a0a", text: "#0a0a0a", accent: "#C4922E" },
  silver: { bg: "#E0E0E0", border: "#0a0a0a", text: "#0a0a0a", accent: "#909090" },
  bronze: { bg: "#CD7F32", border: "#0a0a0a", text: "#0a0a0a", accent: "#8B4513" },
  rose_gold: { bg: "#E8B4B8", border: "#0a0a0a", text: "#0a0a0a", accent: "#A45A68" },
  midnight: { bg: "#0a0a0a", border: "#fff", text: "#fff", accent: "#555" },
  emerald: { bg: "#2E8B57", border: "#0a0a0a", text: "#0a0a0a", accent: "#155E30" },
};

const NUMBER_STYLES = {
  classic:   { fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: "0.02em" },
  poppins:   { fontFamily: "'Poppins', sans-serif", fontWeight: 700, letterSpacing: "-0.01em" },
  monospace: { fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "-0.03em" },
  fredoka:   { fontFamily: "'Fredoka One', sans-serif", fontWeight: 400, letterSpacing: "0.02em" },
  serif:     { fontFamily: "'IBM Plex Serif', serif", fontWeight: 700, letterSpacing: "0.01em" },
  dmsans:    { fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
  courier:   { fontFamily: "'Courier Prime', monospace", fontWeight: 700, letterSpacing: "0.05em" },
  bodoni:    { fontFamily: "'Bodoni Moda', serif", fontWeight: 700, letterSpacing: "0.03em" },
  syne:      { fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
  pacifico:  { fontFamily: "'Pacifico', cursive", fontWeight: 400, letterSpacing: "0.01em" },
  bebas:     { fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, letterSpacing: "0.08em" },
  inter:     { fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
};

const SHAPES = {
  circle:   (size) => ({ borderRadius: "50%", width: size, height: size }),
  hexagon:  (size) => ({ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)", width: size, height: size }),
  octagon:  (size) => ({ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)", width: size, height: size }),
  shield:   (size) => ({ clipPath: "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)", width: size, height: size }),
  diamond:  (size) => ({ clipPath: "polygon(50% 0%, 95% 50%, 50% 100%, 5% 50%)", width: size, height: size }),
  star:     (size) => ({ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)", width: size, height: size }),
  cross:    (size) => ({ clipPath: "polygon(33% 0%, 67% 0%, 67% 33%, 100% 33%, 100% 67%, 67% 67%, 67% 100%, 33% 100%, 33% 67%, 0% 67%, 0% 33%, 33% 33%)", width: size, height: size }),
  badge:    (size) => ({ clipPath: "polygon(50% 0%, 65% 10%, 82% 5%, 90% 20%, 100% 30%, 95% 50%, 100% 70%, 90% 80%, 82% 95%, 65% 90%, 50% 100%, 35% 90%, 18% 95%, 10% 80%, 0% 70%, 5% 50%, 0% 30%, 10% 20%, 18% 5%, 35% 10%)", width: size, height: size }),
  arrow:    (size) => ({ clipPath: "polygon(0% 35%, 55% 35%, 55% 10%, 100% 50%, 55% 90%, 55% 65%, 0% 65%)", width: size, height: size }),
};

// Resolve color: named key → palette, hex → dynamic palette
function resolveColors(color) {
  if (COIN_COLORS[color]) return COIN_COLORS[color];
  // Hex or any CSS color
  if (color && color.startsWith("#")) {
    // Determine if color is dark to set contrasting text
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Force black text for bright colors (>0.6 luminance) for guaranteed visibility
    const textColor = luminance > 0.6 ? "#000000" : (luminance > 0.5 ? "#0a0a0a" : "#ffffff");
    return { bg: color, border: textColor, text: textColor, accent: textColor };
  }
  return COIN_COLORS.gold;
}

function getShapeBounds(shape) {
  const bounds = { minX: 1, maxX: 0, minY: 1, maxY: 0, width: 1, height: 1 };
  const shapes = {
    circle: { minX: 0.04, maxX: 0.96, minY: 0.04, maxY: 0.96 },
    hexagon: { minX: 0.03, maxX: 0.97, minY: 0.02, maxY: 0.98 },
    octagon: { minX: 0.02, maxX: 0.98, minY: 0.02, maxY: 0.98 },
    shield: { minX: 0.03, maxX: 0.97, minY: 0.02, maxY: 0.98 },
    diamond: { minX: 0.04, maxX: 0.96, minY: 0.03, maxY: 0.97 },
    star: { minX: 0.02, maxX: 0.98, minY: 0.02, maxY: 0.98 },
    cross: { minX: 0.0, maxX: 1.0, minY: 0.0, maxY: 1.0 },
    badge: { minX: 0.02, maxX: 0.98, minY: 0.02, maxY: 0.98 },
    arrow: { minX: 0.0, maxX: 1.0, minY: 0.35, maxY: 0.65 },
  };
  const b = shapes[shape] || shapes.circle;
  return { ...b, width: b.maxX - b.minX, height: b.maxY - b.minY };
}



function BorderSVG({ shape, size, color, showBorder }) {
  if (!showBorder) return null;

  if (shape === "circle") {
    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ overflow: "visible" }}
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="3" />
      </svg>
    );
  }

  const borderPaths = {
    hexagon: "M 25 2 L 75 2 L 100 50 L 75 98 L 25 98 L 0 50 Z",
    octagon: "M 30 2 L 70 2 L 98 30 L 98 70 L 70 98 L 30 98 L 2 70 L 2 30 Z",
    shield: "M 50 2 L 100 17 L 100 65 L 50 100 L 0 65 L 0 17 Z",
    diamond: "M 50 2 L 95 50 L 50 100 L 5 50 Z",
    star: "M 50 2 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z",
    cross: "M 33 0 L 67 0 L 67 33 L 100 33 L 100 67 L 67 67 L 67 100 L 33 100 L 33 67 L 0 67 L 0 33 L 33 33 Z",
    badge: "M 50 0 L 65 10 L 82 5 L 90 20 L 100 30 L 95 50 L 100 70 L 90 80 L 82 95 L 65 90 L 50 100 L 35 90 L 18 95 L 10 80 L 0 70 L 5 50 L 0 30 L 10 20 L 18 5 L 35 10 Z",
    arrow: "M 0 35 L 55 35 L 55 10 L 100 50 L 55 90 L 55 65 L 0 65 Z",
  };

  const path = borderPaths[shape] || borderPaths.hexagon;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
    >
      <path d={path} fill="none" stroke={color} strokeWidth="3" />
    </svg>
  );
}

export default function CoinFront({ days, shape = "circle", color = "gold", numberStyle = "classic", size = 260, displayName, customShapePath, showBorder = true, coinPhoto, borderColor, numberColor, imageOnlyMode = false }) {
  const colors = resolveColors(color);
  const numStyle = NUMBER_STYLES[numberStyle] || NUMBER_STYLES.classic;
  const resolvedBorderColor = borderColor || colors.border;
  const resolvedNumberColor = numberColor || colors.text;
  const shapeStyle = shape === "drawn" && customShapePath
    ? { clipPath: `polygon(${customShapePath})`, width: size, height: size }
    : SHAPES[shape] ? SHAPES[shape](size) : SHAPES.circle(size);

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);

  let mainNumber = days;
  let label = "DAYS";
  if (years >= 1) {
    mainNumber = years;
    label = years === 1 ? "YEAR" : "YEARS";
  } else if (months >= 1) {
    mainNumber = months;
    label = months === 1 ? "MONTH" : "MONTHS";
  }

  const bounds = getShapeBounds(shape);
  // Strict safe-zone padding: narrow shapes (star, cross, arrow) get 60% to prevent clipping in valleys
  const isNarrowShape = ["star", "cross", "arrow"].includes(shape);
  const maxWidth = size * bounds.width * (isNarrowShape ? 0.6 : 0.8);
  const numberFontSize = size * (isNarrowShape ? 0.25 : 0.32);
  const verticalOffset = ["arrow", "badge"].includes(shape) ? size * 0.05 : 0;

  return (
    <div className="relative" style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        className="flex items-center justify-center select-none"
        style={{
          ...shapeStyle,
          background: colors.bg,
          position: "relative",
          flexShrink: 0,
        }}
      >
      {/* Coin photo — full cover in image-only mode, subtle overlay otherwise */}
      {coinPhoto && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${coinPhoto})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: imageOnlyMode ? 1 : 0.35,
          zIndex: 0,
        }} />
      )}

      {/* Content — hidden in image-only mode */}
      {!imageOnlyMode && (
        <div className="flex flex-col items-center justify-center z-10" style={{ marginTop: verticalOffset }}>
          {/* Big number */}
          <span
            style={{
              ...numStyle,
              fontSize: numberFontSize,
              color: resolvedNumberColor,
              lineHeight: 0.9,
              maxWidth: maxWidth,
              textAlign: "center",
            }}
          >
            {mainNumber}
          </span>

          {/* Unit label */}
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: size * 0.09,
              color: resolvedNumberColor,
              letterSpacing: "0.25em",
              marginTop: 2,
              opacity: 0.7,
              textAlign: "center",
            }}
          >
            {label}
          </span>

          {/* Display name */}
          {displayName && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: size * 0.04,
                fontWeight: 500,
                color: resolvedNumberColor,
                opacity: 0.4,
                marginTop: 8,
                maxWidth: maxWidth,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {displayName}
            </span>
          )}
        </div>
      )}
      </div>
      <BorderSVG shape={shape} size={size} color={resolvedBorderColor} showBorder={showBorder} />
    </div>
  );
}

export { COIN_COLORS, NUMBER_STYLES, SHAPES };