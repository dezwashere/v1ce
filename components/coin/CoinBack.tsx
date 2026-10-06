import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Polygon } from "react-native-svg";
import { resolveCoinColor } from "@/constants/coin";
import { fonts } from "@/constants/typography";

const PATHS: Record<string, string> = {
  hexagon: "M25 2 L75 2 L100 50 L75 98 L25 98 L0 50 Z",
  octagon: "M30 2 L70 2 L98 30 L98 70 L70 98 L30 98 L2 70 L2 30 Z",
  shield: "M50 2 L100 17 L100 65 L50 100 L0 65 L0 17 Z",
  diamond: "M50 2 L95 50 L50 100 L5 50 Z",
  star: "M50 2 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z",
  cross: "M33 0 L67 0 L67 33 L100 33 L100 67 L67 67 L67 100 L33 100 L33 67 L0 67 L0 33 L33 33 Z",
  badge: "M50 0 L65 10 L82 5 L90 20 L100 30 L95 50 L100 70 L90 80 L82 95 L65 90 L50 100 L35 90 L18 95 L10 80 L0 70 L5 50 L0 30 L10 20 L18 5 L35 10 Z",
  arrow: "M0 35 L55 35 L55 10 L100 50 L55 90 L55 65 L0 65 Z",
};

const SAFE_BOUNDS: Record<string,{width:number;height:number;y:number}> = {
  circle:{width:.70,height:.62,y:0},
  hexagon:{width:.66,height:.60,y:0},
  octagon:{width:.68,height:.62,y:0},
  shield:{width:.58,height:.54,y:-.03},
  diamond:{width:.50,height:.44,y:0},
  star:{width:.40,height:.36,y:0},
  badge:{width:.52,height:.46,y:0},
  cross:{width:.46,height:.42,y:0},
  arrow:{width:.44,height:.18,y:0},
  drawn:{width:.60,height:.52,y:0},
};

type Props = {
  size?: number;
  color?: string;
  shape?: string;
  motto?: string;
  substances?: string[];
  customShapePath?: string;
  showBorder?: boolean;
  borderColor?: string;
  imageOnlyMode?: boolean;
  days?: number;
  displayName?: string;
};

function parseCustomPolygon(value?: string) {
  if (!value) return null;
  const points = value
    .split(/\s+/)
    .map((p) => p.trim().replace(/%/g, "").split(","))
    .filter((p) => p.length === 2)
    .map(([x, y]) => `${parseFloat(x)},${parseFloat(y)}`)
    .filter((p) => !p.includes("NaN"))
    .join(" ");
  return points || null;
}

export default function CoinBack({
  size = 260,
  color = "gold",
  shape = "circle",
  motto = "",
  substances = [],
  customShapePath,
  showBorder = true,
  borderColor,
  imageOnlyMode = false,
  days = 0,
  displayName = "",
}: Props) {
  const colors = resolveCoinColor(color);
  const resolvedBorder = borderColor || colors.border;
  const customPoints = shape === "drawn" ? parseCustomPolygon(customShapePath) : null;
  const path = PATHS[shape] || PATHS.hexagon;
  const years = Math.floor(days / 365);
  const mainNumber = years >= 1 ? years : days;
  const safe=SAFE_BOUNDS[shape]||SAFE_BOUNDS.circle;
  const safeWidth=size*safe.width;
  const safeHeight=size*safe.height;
  const safeTop=(size-safeHeight)/2+size*safe.y;
  const safeMotto=(motto||"FREE FROM").slice(0,18);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {shape === "circle" ? (
          <>
            <Circle cx="50" cy="50" r="48" fill={colors.bg} />
            {showBorder ? <Circle cx="50" cy="50" r="48" fill="none" stroke={resolvedBorder} strokeWidth="3" /> : null}
          </>
        ) : customPoints ? (
          <>
            <Polygon points={customPoints} fill={colors.bg} />
            {showBorder ? <Polygon points={customPoints} fill="none" stroke={resolvedBorder} strokeWidth="3" /> : null}
          </>
        ) : (
          <>
            <Path d={path} fill={colors.bg} />
            {showBorder ? <Path d={path} fill="none" stroke={resolvedBorder} strokeWidth="3" /> : null}
          </>
        )}
      </Svg>
      <View style={[styles.content, { width: safeWidth, height:safeHeight, top:safeTop, pointerEvents: "none" }]}>
        <Text style={[styles.brand, { color: colors.text, fontSize: size * 0.055 }]}>V1CE</Text>
        {imageOnlyMode ? (
          <>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.48} style={[styles.days, { color: colors.text, fontSize: size * 0.18, maxWidth:safeWidth }]}>{days}</Text>
            <Text style={[styles.label, { color: colors.text }]}>DAYS</Text>
            {displayName ? <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text> : null}
          </>
        ) : (
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.48} style={[styles.days, { color: colors.text, fontSize: size * 0.20, maxWidth:safeWidth }]}>{mainNumber}</Text>
        )}
        <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.62} style={[styles.free, { color: colors.text, fontSize: size * 0.042, maxWidth:safeWidth }]}>{safeMotto}</Text>
        {substances.length > 0 ? (
          <Text style={[styles.subs, { color: colors.text, fontSize: size * 0.038 }]} numberOfLines={3}>
            {substances.join("\n").toUpperCase()}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  content: { position: "absolute", alignItems: "center", justifyContent: "center", paddingHorizontal: 4, overflow:"hidden", alignSelf:"center" },
  brand: { fontFamily: fonts.bodyBold, letterSpacing: 4, textAlign: "center", opacity: 0.7, marginBottom: 4 },
  free: { fontFamily: fonts.bodyBold, letterSpacing: 2, textAlign: "center", textTransform: "uppercase", marginTop: 6, opacity: 0.7 },
  subs: { marginTop: 8, fontFamily: fonts.bodyBold, letterSpacing: 1.5, textAlign: "center", opacity: 0.55, lineHeight: 14 },
  days: { fontFamily: fonts.display, textAlign: "center" },
  label: { fontSize: 10, letterSpacing: 3, fontFamily: fonts.bodyBold, opacity: 0.7 },
  name: { fontSize: 9, letterSpacing: 2, marginTop: 6, fontFamily: fonts.bodySemi, textTransform: "uppercase", opacity: 0.5 },
});
