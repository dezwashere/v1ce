export const COIN_COLORS = {
  gold: { bg: "#F5D680", border: "#0A0A0A", text: "#0A0A0A", accent: "#C4922E" },
  silver: { bg: "#E0E0E0", border: "#0A0A0A", text: "#0A0A0A", accent: "#909090" },
  bronze: { bg: "#CD7F32", border: "#0A0A0A", text: "#0A0A0A", accent: "#8B4513" },
  rose_gold: { bg: "#E8B4B8", border: "#0A0A0A", text: "#0A0A0A", accent: "#A45A68" },
  midnight: { bg: "#0A0A0A", border: "#FFFFFF", text: "#FFFFFF", accent: "#555555" },
  emerald: { bg: "#2E8B57", border: "#0A0A0A", text: "#0A0A0A", accent: "#155E30" },
} as const;

export const NUMBER_STYLES = {
  vt323: { fontFamily: "VT323", fontWeight: "400" as const, letterSpacing: 0.02 },
  im_fell_english_sc: { fontFamily: "IM Fell English SC", fontWeight: "400" as const, letterSpacing: 0.01 },
  slackey: { fontFamily: "Slackey", fontWeight: "400" as const, letterSpacing: 0 },
  josefin_sans: { fontFamily: "Josefin Sans", fontWeight: "700" as const, letterSpacing: 0.02 },
  varela_round: { fontFamily: "Varela Round", fontWeight: "400" as const, letterSpacing: 0 },
  walter_turncoat: { fontFamily: "Walter Turncoat", fontWeight: "400" as const, letterSpacing: 0.01 },
} as const;

/** Legacy choices remain readable without rewriting stored user profiles. */
const LEGACY_NUMBER_STYLE_MAP: Record<string, keyof typeof NUMBER_STYLES> = {
  classic: "im_fell_english_sc",
  poppins: "varela_round",
  monospace: "vt323",
  fredoka: "varela_round",
  serif: "im_fell_english_sc",
  dmsans: "josefin_sans",
  courier: "vt323",
  bodoni: "im_fell_english_sc",
  syne: "josefin_sans",
  pacifico: "walter_turncoat",
  bebas: "vt323",
  inter: "josefin_sans",
  big_shoulders_stencil: "vt323",
  roboto_mono: "vt323",
  oswald: "josefin_sans",
  raleway: "josefin_sans",
  fraunces: "im_fell_english_sc",
  caveat: "walter_turncoat",
  dyna_puff: "varela_round",
};

export function normalizeNumberStyle(value?: string): keyof typeof NUMBER_STYLES {
  if (value && Object.prototype.hasOwnProperty.call(NUMBER_STYLES, value)) {
    return value as keyof typeof NUMBER_STYLES;
  }
  return (value && LEGACY_NUMBER_STYLE_MAP[value]) || "walter_turncoat";
}

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
