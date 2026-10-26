/** Original coin artwork, flattened once into shared app/WidgetKit geometry. */
export type ArtPoint = { x: number; y: number };
export type Art = { points: ArtPoint[]; fill: string; stroke: string; width: number; opacity: number; closed: boolean };

// Only our trusted constant paths use this small SVG subset. No user SVG is parsed.
function flatten(source: string): { points: ArtPoint[]; closed: boolean }[] {
  const tokens = source.match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/g) || [];
  const paths: { points: ArtPoint[]; closed: boolean }[] = [];
  let i = 0, cmd = "", p = { x: 0, y: 0 }, start = p, control = p, previous = "";
  let current: ArtPoint[] = [];
  const finish = (closed = false) => { if (current.length) paths.push({ points: current, closed }); current = []; };
  const number = () => { const result = Number(tokens[i++]); if (!Number.isFinite(result)) throw new Error("Invalid built-in artwork"); return result; };
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
    const kind = cmd.toUpperCase(), relative = cmd !== kind;
    const point = (): ArtPoint => ({ x: number() + (relative ? p.x : 0), y: number() + (relative ? p.y : 0) });
    if (kind === "Z") { finish(true); p = start; previous = kind; cmd = ""; continue; }
    if (kind === "M") { finish(); p = point(); start = p; current.push(p); cmd = relative ? "l" : "L"; }
    else if (kind === "L") { p = point(); current.push(p); }
    else if (kind === "H") { p = { x: number() + (relative ? p.x : 0), y: p.y }; current.push(p); }
    else if (kind === "V") { p = { x: p.x, y: number() + (relative ? p.y : 0) }; current.push(p); }
    else if (["C", "S", "Q", "T"].includes(kind)) {
      const from = p;
      const reflected = { x: 2 * p.x - control.x, y: 2 * p.y - control.y };
      const cubic = kind === "C" || kind === "S";
      const a = kind === "S" ? (["C", "S"].includes(previous) ? reflected : p) : kind === "T" ? (["Q", "T"].includes(previous) ? reflected : p) : point();
      const b = cubic ? point() : a, end = point();
      for (let step = 1; step <= 12; step++) {
        const t = step / 12, u = 1 - t;
        current.push(cubic ? { x: u*u*u*from.x + 3*u*u*t*a.x + 3*u*t*t*b.x + t*t*t*end.x, y: u*u*u*from.y + 3*u*u*t*a.y + 3*u*t*t*b.y + t*t*t*end.y }
          : { x: u*u*from.x + 2*u*t*a.x + t*t*end.x, y: u*u*from.y + 2*u*t*a.y + t*t*end.y });
      }
      control = b; p = end;
    } else throw new Error(`Unsupported built-in artwork command ${cmd}`);
    previous = kind;
  }
  finish(); return paths;
}
function path(source: string, fill: string, opacity = 1, stroke = "", width = 0): Art[] {
  return flatten(source).map(shape => ({ ...shape, fill, stroke, width, opacity }));
}
function circle(x: number, y: number, r: number, fill: string, opacity = 1, stroke = "", width = 0): Art {
  return { points: Array.from({ length: 48 }, (_, i) => ({ x: x + r * Math.cos(i * Math.PI / 24), y: y + r * Math.sin(i * Math.PI / 24) })), closed: true, fill, opacity, stroke, width };
}
const rect = (x: number, y: number, w: number, h: number, fill: string, opacity: number): Art => ({ points: [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}], closed: true, fill, opacity, stroke: "", width: 0 });
export function backgroundArtwork(kind: string, face: string): Art[] {
  switch (kind) {
    case "zebra": return [0,12,24,36,48,60,72,84].map(y => rect(0,y,100,7,"#0A0A0A",.18));
    case "leopard": return [[18,20],[40,16],[70,28],[30,48],[58,52],[78,70],[22,74],[48,80]].map(([x,y]) => circle(x,y,7,"#0A0A0A",.22));
    case "space": return [rect(0,0,100,100,"#0A0A0A",.35), ...[[12,18],[40,12],[70,22],[88,40],[20,55],[55,48],[78,72],[30,80],[60,88]].map(([x,y],i) => circle(x,y,i%2?1.2:2,"#FFFFFF"))];
    case "lightning": return path("M55 8 L32 48 L48 48 L40 92 L72 42 L54 42 Z",face.toUpperCase()==="#F5D680"?"#0A0A0A":"#FFFFFF",.2);
    case "slime": return path("M10 70 Q30 40 50 70 T90 70 L90 100 L10 100 Z","#7CFC00",.28);
    case "flames": return path("M20 100 Q30 50 40 100 Q50 40 60 100 Q70 55 80 100 Z","#FF6B00",.35);
    case "hotpink": return [rect(0,0,100,100,"#FF2D95",.28)];
    default: return [];
  }
}
const ICONS: Record<string,string> = {
  mountain: "M2 19 9 7l4 6 2.5-4L22 19Z M7.2 10.1l1.8 2 2-2",
  palm: "M12 21c1-5 1-10 0-14M12 7C9 4 5 4 3 8c4-1 7-1 9-1Zm0 0c2-4 6-5 10-2-5 0-8 1-10 2Zm0 0c-3-2-6-1-8 3 4-2 6-2 8-3Zm0 0c4-1 7 1 8 5-3-3-5-4-8-5Z",
  smiley: "M8 14c2 3 6 3 8 0",
  clover: "M12 11c-6-9-12 1-4 3-9 3-1 11 4 3 5 8 13 0 4-3 8-2 2-12-4-3ZM12 14l2 8",
  butterfly: "M12 8C8 2 2 2 3 9c0 3 3 4 7 5-8-1-9 7-3 6 3-.5 5-3 5-6m0-6c4-6 10-6 9 1 0 3-3 4-7 5 8-1 9 7 3 6-3-.5-5-3-5-6 M12 7v11",
  wave: "M2 9c3 0 3 3 6 3s3-3 6-3 3 3 6 3h2M2 15c3 0 3 3 6 3s3-3 6-3 3 3 6 3h2",
};
export function iconArtwork(icon: string, color: string): Art[] {
  if (!ICONS[icon]) return [];
  const artwork = path(ICONS[icon], "", 1, color, 1.6);
  if (icon === "smiley") artwork.unshift(circle(12,12,9,"",1,color,1.6),circle(9,10,.8,color),circle(15,10,.8,color));
  return artwork;
}
