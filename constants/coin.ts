export const COIN_COLORS = {
  gold: { bg: "#F5D680", border: "#0A0A0A", text: "#0A0A0A", accent: "#C4922E" },
  silver: { bg: "#E0E0E0", border: "#0A0A0A", text: "#0A0A0A", accent: "#909090" },
  bronze: { bg: "#CD7F32", border: "#0A0A0A", text: "#0A0A0A", accent: "#8B4513" },
  rose_gold: { bg: "#E8B4B8", border: "#0A0A0A", text: "#0A0A0A", accent: "#A45A68" },
  midnight: { bg: "#0A0A0A", border: "#FFFFFF", text: "#FFFFFF", accent: "#555555" },
  emerald: { bg: "#2E8B57", border: "#0A0A0A", text: "#0A0A0A", accent: "#155E30" },
} as const;

export const NUMBER_STYLES = {
  classic: { fontFamily: "Cinzel", fontWeight: "700" as const, letterSpacing: 0.02 },
  poppins: { fontFamily: "Poppins", fontWeight: "700" as const, letterSpacing: -0.01 },
  monospace: { fontFamily: "Space Mono", fontWeight: "700" as const, letterSpacing: -0.03 },
  fredoka: { fontFamily: "Fredoka One", fontWeight: "400" as const, letterSpacing: 0.02 },
  serif: { fontFamily: "IBM Plex Serif", fontWeight: "700" as const, letterSpacing: 0.01 },
  dmsans: { fontFamily: "DM Sans", fontWeight: "700" as const, letterSpacing: -0.02 },
  courier: { fontFamily: "Courier Prime", fontWeight: "700" as const, letterSpacing: 0.05 },
  bodoni: { fontFamily: "Bodoni Moda", fontWeight: "700" as const, letterSpacing: 0.03 },
  syne: { fontFamily: "Syne", fontWeight: "700" as const, letterSpacing: -0.02 },
  pacifico: { fontFamily: "Pacifico", fontWeight: "400" as const, letterSpacing: 0.01 },
  bebas: { fontFamily: "Bebas Neue", fontWeight: "400" as const, letterSpacing: 0.08 },
  inter: { fontFamily: "Inter", fontWeight: "700" as const, letterSpacing: -0.02 },
  big_shoulders_stencil: { fontFamily: "Big Shoulders Stencil", fontWeight: "400" as const, letterSpacing: 0.02 },
  roboto_mono: { fontFamily: "Roboto Mono", fontWeight: "700" as const, letterSpacing: -0.03 },
  oswald: { fontFamily: "Oswald", fontWeight: "600" as const, letterSpacing: 0.02 },
  raleway: { fontFamily: "Raleway", fontWeight: "700" as const, letterSpacing: 0.01 },
  fraunces: { fontFamily: "Fraunces", fontWeight: "700" as const, letterSpacing: 0.01 },
  caveat: { fontFamily: "Caveat", fontWeight: "400" as const, letterSpacing: 0.01 },
  dyna_puff: { fontFamily: "DynaPuff", fontWeight: "600" as const, letterSpacing: 0.01 },
} as const;

export function resolveCoinColor(value?: string) {
  if (value && value in COIN_COLORS) return COIN_COLORS[value as keyof typeof COIN_COLORS];
  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    const hex = value.toUpperCase();
    // WCAG relative luminance: choose the text with the stronger contrast.
    const channels = [1, 3, 5].map((index) => {
      const value = parseInt(hex.slice(index, index + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    const contrastWithDark = (luminance + 0.05) / 0.05;
    const contrastWithLight = 1.05 / (luminance + 0.05);
    const text = contrastWithDark >= contrastWithLight ? "#000000" : "#FFFFFF";
    return { bg: hex, border: text, text, accent: text === "#FFFFFF" ? "#888888" : "#777777" };
  }
  return COIN_COLORS.gold;
}
