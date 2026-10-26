import { NUMBER_STYLES, normalizeNumberStyle, resolveCoinColor } from "../constants/coin";
import { backgroundArtwork, iconArtwork, type Art } from "./coinArtwork";

export type Point = { x: number; y: number };
export type Face = "front" | "back";
export type TextId = "brand" | "value" | "unit" | "motto" | "name";
export type TextPosition = { x: number; y: number; scale: number };
export type CoinTextLayout = { version: 1; front: Partial<Record<TextId, TextPosition>>; back: Partial<Record<TextId, TextPosition>> };
export const emptyLayout = (): CoinTextLayout => ({ version: 1, front: {}, back: {} });
export type CoinInput = {
  days?: number; shape?: string; color?: string; numberStyle?: string; size?: number;
  displayName?: string; motto?: string; customShapePath?: string; showBorder?: boolean;
  coinPhoto?: string; borderColor?: string; numberColor?: string; imageOnlyMode?: boolean;
  background?: string; backIcon?: string; isPremium?: boolean; textLayout?: CoinTextLayout;
  onPress?: () => void;
};
export const COIN_SHAPES = ["circle", "hexagon", "octagon", "shield", "diamond", "star", "badge", "arrow", "drawn"] as const;
export function normalizeShape(value?: string) { return COIN_SHAPES.includes(value as any) ? value! : "circle"; }
const shapes: Record<string, string> = {
  hexagon: "25,2 75,2 98,50 75,98 25,98 2,50",
  octagon: "30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30",
  shield: "50,2 98,17 98,65 50,98 2,65 2,17",
  diamond: "50,2 95,50 50,98 5,50",
  star: "50,2 69.98,22.49 95.65,35.17 82.34,60.51 78.21,88.83 50,84 21.79,88.83 17.66,60.51 4.35,35.17 30.02,22.49",
  badge: "50,2 65,10 82,5 90,20 98,30 95,50 98,70 90,80 82,95 65,90 50,98 35,90 18,95 10,80 2,70 5,50 2,30 10,20 18,5 35,10",
  arrow: "2,35 55,35 55,10 98,50 55,90 55,65 2,65",
};
const parsePoints = (value: string): Point[] => value.trim().split(/\s+/).map(pair => {
  const [x, y] = pair.replace(/%/g, "").split(",").map(Number); return { x, y };
});
export function shapePolygon(shape?: string, custom?: string): Point[] {
  const name = normalizeShape(shape);
  if (name === "drawn" && custom && custom.length < 8000) {
    const points = parsePoints(custom);
    const area = points.reduce((a, p, i) => { const q = points[(i + 1) % points.length]; return a + p.x * q.y - q.x * p.y; }, 0);
    if (points.length >= 3 && points.length <= 128 && Math.abs(area) > 100 && points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100)) return points;
  }
  if (shapes[name]) return parsePoints(shapes[name]);
  return Array.from({ length: 96 }, (_, i) => ({ x: 50 + 48 * Math.cos(i * Math.PI / 48), y: 50 + 48 * Math.sin(i * Math.PI / 48) }));
}
export const pointsString = (points: Point[]) => points.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
const inset = (p: Point, scale: number): Point => ({ x: 50 + (p.x - 50) * scale, y: 50 + (p.y - 50) * scale });
export function mixColor(a: string, b: string, amount: number) {
  return "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - amount) + parseInt(b.slice(i, i + 2), 16) * amount).toString(16).padStart(2, "0")).join("");
}
const hex = (value: string | undefined, fallback: string) => value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
export function inside(point: Point, polygon: Point[]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}
export function normalizeLayout(value: unknown): CoinTextLayout {
  const result = emptyLayout();
  if (!value || typeof value !== "object" || (value as any).version !== 1) return result;
  for (const face of ["front", "back"] as const) for (const id of ["brand", "value", "unit", "motto", "name"] as const) {
    const box = (value as any)[face]?.[id];
    if (box && [box.x, box.y, box.scale].every(Number.isFinite)) result[face][id] = {
      x: Math.max(10, Math.min(90, box.x)), y: Math.max(10, Math.min(90, box.y)), scale: Math.max(.7, Math.min(1.3, box.scale)),
    };
  }
  return result;
}
export const FONT_NAMES: Record<string, { app: string; native: string }> = {
  vt323: { app: "VT323_400Regular", native: "VT323-Regular" }, im_fell_english_sc: { app: "IMFellEnglishSC_400Regular", native: "IMFellEnglishSC-Regular" },
  slackey: { app: "Slackey_400Regular", native: "Slackey-Regular" }, josefin_sans: { app: "JosefinSans_700Bold", native: "JosefinSans-Bold" },
  varela_round: { app: "VarelaRound_400Regular", native: "VarelaRound-Regular" }, walter_turncoat: { app: "WalterTurncoat_400Regular", native: "WalterTurncoat-Regular" },
};
export type TextBox = { id: TextId; text: string; x: number; y: number; width: number; height: number; fontSize: number; lines?: number };
export type CoinDesign = {
  version: 2; polygon: Point[]; rim: Point[][]; face: string; rimPrimary: string; rimSecondary: string;
  shadow: string; highlight: string; text: string; showBorder: boolean; fontKey: string; appFont: string; nativeFont: string;
  tracking: number; front: TextBox[]; back: TextBox[]; photo: string | null; imageOnly: boolean; background: string; backIcon: string;
  backgroundArt: Art[]; backArt: Art[];
  photoFile?: string;
};
function fitBox(polygon: Point[], desired: TextBox): TextBox {
  // Sample the complete rectangle, not only its corners (stars can be concave).
  const safe = polygon.map(p => inset(p, .76));
  const fits = (box: TextBox) => {
    for (let ix = 0; ix <= 8; ix++) for (let iy = 0; iy <= 6; iy++) {
      if (!inside({ x: box.x + (ix / 8 - .5) * box.width, y: box.y + (iy / 6 - .5) * box.height }, safe)) return false;
    }
    return true;
  };
  // Fit display only: never overwrite the user's saved position when switching shape/font.
  for (let step = 0; step <= 30; step++) {
    const scale = 1 - step / 45;
    const box = { ...desired, x: desired.x + (50 - desired.x) * step / 30, y: desired.y + (50 - desired.y) * step / 30, width: desired.width * scale, height: desired.height * scale, fontSize: desired.fontSize * scale };
    if (fits(box)) return box;
  }
  return { ...desired, x: 50, y: 50, width: 0, height: 0, fontSize: 0 }; // malformed/narrow custom shape: don't draw outside it
}
const safeRectCache = new Map<string, { x: number; y: number; width: number; height: number }>();
function safeRectangle(polygon: Point[]) {
  const key = pointsString(polygon), cached = safeRectCache.get(key);
  if (cached) return cached;
  const safe = polygon.map(p => inset(p, .76));
  let best = { x: 50, y: 50, width: 0, height: 0 };
  for (const cy of [50, 45, 55]) for (const cx of [50, 45, 55]) {
    for (let width = 20; width <= 72; width += 2) for (let height = 12; height <= 72; height += 2) {
      if (width < height * .9 || width > height * 1.65) continue;
      if (width * height <= best.width * best.height) continue;
      const left = cx - width / 2, right = cx + width / 2, top = cy - height / 2, bottom = cy + height / 2;
      // Corners must be inside; no polygon edge may enter the rectangle interior.
      if (![ {x:left,y:top}, {x:right,y:top}, {x:right,y:bottom}, {x:left,y:bottom} ].every(p => inside(p,safe))) continue;
      let intersects = false;
      for (let i=0; i<safe.length; i++) {
        const a=safe[i], b=safe[(i+1)%safe.length];
        let low=0, high=1;
        for (const [start,delta,min,max] of [[a.x,b.x-a.x,left,right],[a.y,b.y-a.y,top,bottom]]) {
          if (Math.abs(delta)<1e-9) { if(start<=min || start>=max) { high=-1; break; } }
          else { const t1=(min-start)/delta,t2=(max-start)/delta; low=Math.max(low,Math.min(t1,t2)); high=Math.min(high,Math.max(t1,t2)); }
        }
        if (high-low>1e-6) {intersects=true;break;}
      }
      if (!intersects) best={x:cx,y:cy,width,height};
    }
  }
  if (safeRectCache.size >= 128) safeRectCache.clear();
  safeRectCache.set(key,best); return best;
}
export function buildCoinDesign(input: CoinInput): CoinDesign {
  const palette = resolveCoinColor(input.color), polygon = shapePolygon(input.shape, input.customShapePath);
  const border = hex(input.borderColor, palette.border), fontKey = normalizeNumberStyle(input.numberStyle);
  const rim: Point[][] = [];
  // Sample the perimeter uniformly, then form alternating radial inset panels.
  const lengths = polygon.map((p, i) => Math.hypot(p.x - polygon[(i + 1) % polygon.length].x, p.y - polygon[(i + 1) % polygon.length].y));
  const total = lengths.reduce((a, b) => a + b, 0);
  const at = (t: number): Point => {
    let d = t * total;
    for (let i = 0; i < lengths.length; i++) {
      if (d <= lengths[i] || i === lengths.length - 1) { const a = polygon[i], b = polygon[(i + 1) % polygon.length], f = lengths[i] ? d / lengths[i] : 0; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
      d -= lengths[i];
    }
    return polygon[0];
  };
  for (let i = 0; i < 24; i += 2) {
    const edge = Array.from({ length: 7 }, (_, j) => at((i + .12 + j / 6 * .76) / 24));
    rim.push([...edge, ...edge.slice().reverse().map(p => inset(p, .82))]);
  }
  const layout = normalizeLayout(input.textLayout);
  const safe = safeRectangle(polygon);
  const faceBoxes = (face: Face): TextBox[] => {
    const defaults: Array<[TextId, string, number, number, number, number]> = [
      ["brand", "V1CE", .06, .8, .08, .065], ["value", "$value", face === "back" ? .29 : .35, .96, face === "back" ? .30 : .36, .30],
      ["unit", "$unit", face === "back" ? .49 : .60, .96, .08, .065], ["motto", (input.motto || "FREE FROM").slice(0, 20).toUpperCase(), face === "back" ? .69 : .81, .98, .28, .11],
    ];
    if (face === "back" && input.displayName) defaults.push(["name", input.displayName.slice(0, 20).toUpperCase(), .88, .96, .06, .05]);
    return defaults.filter(([id]) => !(id === "brand" && input.isPremium)).map(([id, text, y, width, height, fontSize]) => {
      const saved = layout[face][id];
      const box: TextBox = { id, text, x: saved?.x ?? safe.x, y: saved?.y ?? safe.y + (y-.5)*safe.height,
        width: width*safe.width, height: height*safe.height*(saved?.scale ?? 1), fontSize: fontSize*safe.height*(saved?.scale ?? 1), lines: id === "motto" ? 2 : 1 };
      return saved ? fitBox(polygon, box) : box;
    });
  };
  const text = hex(input.numberColor, palette.text);
  const iconBox = {x:safe.x,y:safe.y+.46*safe.height,width:safe.height*.06,height:safe.height*.06};
  const compactArt = (art: Art[]): Art[] => art.map(a => ({ ...a, points: a.points.map(p => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) })) }));
  const backArt = iconArtwork(input.backIcon || "none", text).map(a => ({ ...a, width: a.width * iconBox.width / 24, points: a.points.map(p => ({ x: iconBox.x + (p.x / 24 - .5) * iconBox.width, y: iconBox.y + (p.y / 24 - .5) * iconBox.height })) }));
  return { version: 2, polygon, rim, face: palette.bg, rimPrimary: border, rimSecondary: mixColor(palette.bg, "#ffffff", .32),
    shadow: mixColor(palette.bg, "#000000", .42), highlight: mixColor(palette.bg, "#ffffff", .55), text: hex(input.numberColor, palette.text),
    showBorder: input.showBorder ?? true, fontKey, appFont: FONT_NAMES[fontKey].app, nativeFont: FONT_NAMES[fontKey].native,
    tracking: NUMBER_STYLES[fontKey].letterSpacing, front: faceBoxes("front"), back: faceBoxes("back"),
    photo: input.coinPhoto || null, imageOnly: !!input.imageOnlyMode, background: input.background || "solid", backIcon: input.backIcon || "none",
    backgroundArt: compactArt(backgroundArtwork(input.background || "solid", palette.bg)), backArt: compactArt(backArt) };
}
export function coinTime(days: number) {
  const safe = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
  const years = Math.floor(safe / 365), months = Math.floor((safe % 365) / 30);
  return years ? { value: String(years), unit: years === 1 ? "YEAR" : "YEARS" } : months ? { value: String(months), unit: months === 1 ? "MONTH" : "MONTHS" } : { value: String(safe), unit: "DAYS" };
}
export function coinInputFromProfile(p: any): CoinInput {
  return { shape: p?.coin_shape, color: p?.coin_color, numberStyle: p?.number_style, displayName: p?.display_name, motto: p?.coin_motto,
    customShapePath: p?.coin_shape_path, showBorder: p?.coin_show_border, coinPhoto: p?.coin_photo, borderColor: p?.coin_border_color,
    numberColor: p?.coin_number_color, imageOnlyMode: p?.coin_image_only, background: p?.coin_background, backIcon: p?.coin_back_icon,
    isPremium: p?.is_premium, textLayout: p?.coin_text_layout };
}
