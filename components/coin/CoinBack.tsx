import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Image, Path, Polygon, Defs, LinearGradient, Stop } from "react-native-svg";
import { NUMBER_STYLES, resolveCoinColor } from "@/constants/coin";
import { usePremium } from "@/context/PremiumContext";
import { CoinBackground } from "@/components/coin/CoinBackground";
import CoinBackDecoration from "@/components/coin/CoinBackDecoration";

const FONT_FAMILIES: Record<string,string> = {
  "Big Shoulders Stencil":"BigShouldersStencilDisplayRegular",
  "Roboto Mono":"RobotoMono_700Bold",
  "Oswald":"Oswald_600SemiBold",
  "Raleway":"Raleway_700Bold",
  "Fraunces":"Fraunces_700Bold",
  "Caveat":"Caveat_400Regular",
  "DynaPuff":"DynaPuff_600SemiBold",
  Cinzel:"Cinzel_700Bold",
  Poppins:"Poppins_700Bold",
  "Space Mono":"SpaceMono_700Bold",
  "Fredoka One":"Fredoka_400Regular",
  "IBM Plex Serif":"IBMPlexSerif_700Bold",
  "DM Sans":"DMSans_700Bold",
  "Courier Prime":"CourierPrime_700Bold",
  "Bodoni Moda":"BodoniModa_700Bold",
  Syne:"Syne_700Bold",
  Pacifico:"Pacifico_400Regular",
  "Bebas Neue":"BebasNeue_400Regular",
  Inter:"Inter_700Bold",
};

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
  circle:{width:.72,height:.62,y:0},
  hexagon:{width:.68,height:.62,y:0},
  octagon:{width:.70,height:.64,y:0},
  shield:{width:.62,height:.56,y:-.03},
  diamond:{width:.54,height:.46,y:0},
  star:{width:.42,height:.38,y:0},
  badge:{width:.54,height:.48,y:0},
  cross:{width:.48,height:.44,y:0},
  arrow:{width:.46,height:.20,y:0},
  drawn:{width:.62,height:.54,y:0},
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
  numberColor?: string;
  numberStyle?: string;
  coinPhoto?: string;
  imageOnlyMode?: boolean;
  background?: string;
  days?: number;
  displayName?: string;
  backIcon?: string;
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
  numberColor,
  numberStyle = "big_shoulders_stencil",
  coinPhoto,
  imageOnlyMode = false,
  background = "solid",
  days = 0,
  displayName = "",
  backIcon = "none",
}: Props) {
  const { isPremium } = usePremium();
  const colors = resolveCoinColor(color);
  const resolvedBorder = borderColor || colors.border;
  const resolvedNumberColor = numberColor || colors.text;
  const numStyle=NUMBER_STYLES[numberStyle as keyof typeof NUMBER_STYLES]||NUMBER_STYLES.big_shoulders_stencil;
  const selectedFontFamily=FONT_FAMILIES[numStyle.fontFamily]||undefined;
  const customPoints = shape === "drawn" ? parseCustomPolygon(customShapePath) : null;
  const path = PATHS[shape] || PATHS.hexagon;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  let mainNumber = days;
  let label = "DAYS";
  if (years >= 1) { mainNumber = years; label = years === 1 ? "YEAR" : "YEARS"; }
  else if (months >= 1) { mainNumber = months; label = months === 1 ? "MONTH" : "MONTHS"; }
  const safe=SAFE_BOUNDS[shape]||SAFE_BOUNDS.circle;
  const safeWidth=size*safe.width;
  const safeHeight=size*safe.height;
  const safeTop=(size-safeHeight)/2+size*safe.y;
  const safeMotto=(motto||"FREE FROM").slice(0,20);
  const safeName=(displayName||"").slice(0,20);
  const narrow=["star","cross","arrow","diamond","badge"].includes(shape);
  // Reserve room for the name and optional decoration, without clipping the year number.
  const hasBackDetails = !!safeName || (backIcon !== "none" && !!backIcon);
  const numberFontSize=size*(narrow ? (hasBackDetails ? .20 : .24) : (hasBackDetails ? .235 : .30));
  const numberLineHeight=numberFontSize*1.36;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs><LinearGradient id="coinSheenBack" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFFFFF" stopOpacity=".24"/><Stop offset=".42" stopColor="#FFFFFF" stopOpacity="0"/><Stop offset="1" stopColor="#000000" stopOpacity=".22"/></LinearGradient></Defs>
        {shape === "circle" ? (
          <>
            <Circle cx="50" cy="50" r="48" fill={colors.bg} /><Circle cx="50" cy="50" r="48" fill="url(#coinSheenBack)"/><Circle cx="50" cy="50" r="45.2" fill="none" stroke="#FFFFFF" strokeOpacity=".27" strokeWidth=".8"/>
            {coinPhoto ? <Image href={{uri:coinPhoto}} x="2" y="2" width="96" height="96" preserveAspectRatio="xMidYMid slice" opacity={imageOnlyMode?1:.35}/> : null}
            {showBorder ? <Circle cx="50" cy="50" r="48" fill="none" stroke={resolvedBorder} strokeWidth="3" /> : null}
          </>
        ) : customPoints ? (
          <>
            <Polygon points={customPoints} fill={colors.bg} /><Polygon points={customPoints} fill="url(#coinSheenBack)"/>
            {coinPhoto ? <Image href={{uri:coinPhoto}} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" opacity={imageOnlyMode?1:.35}/> : null}
            {showBorder ? <Polygon points={customPoints} fill="none" stroke={resolvedBorder} strokeWidth="3" /> : null}
          </>
        ) : (
          <>
            <Path d={path} fill={colors.bg} /><Path d={path} fill="url(#coinSheenBack)"/>
            {coinPhoto ? <Image href={{uri:coinPhoto}} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" opacity={imageOnlyMode?1:.35}/> : null}
            {showBorder ? <Path d={path} fill="none" stroke={resolvedBorder} strokeWidth="3" /> : null}
          </>
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill,{pointerEvents:"none"}]}>
        <CoinBackground kind={background} size={size} color={colors.bg} />
      </View>
      {!isPremium ? (
        <View pointerEvents="none" style={[styles.brandWrap,{top:safeTop + size*.012}]}>
          <Text style={[styles.brand,{color:resolvedNumberColor,fontSize:size*.038,fontFamily:selectedFontFamily,fontWeight:numStyle.fontWeight}]}>V1CE</Text>
        </View>
      ) : null}
      {imageOnlyMode ? null : (
        <View style={[styles.content, { width: safeWidth, minHeight:safeHeight, top:safeTop, pointerEvents: "none" }]}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.3} style={[styles.days, { color: resolvedNumberColor, textShadowColor:"rgba(0,0,0,0.24)",textShadowOffset:{width:1,height:2},textShadowRadius:1, fontSize:numberFontSize, lineHeight:numberLineHeight,includeFontPadding:true, fontFamily:selectedFontFamily, fontWeight:numStyle.fontWeight, maxWidth:safeWidth }]}>{mainNumber}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.45} style={[styles.label, { color: resolvedNumberColor, fontSize:size*.075, fontFamily:selectedFontFamily, fontWeight:numStyle.fontWeight, maxWidth:safeWidth }]}>{label}</Text>
          <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.4} style={[styles.free, { color: resolvedNumberColor, fontSize:size*.042, fontFamily:selectedFontFamily, fontWeight:numStyle.fontWeight, maxWidth:safeWidth }]}>{safeMotto}</Text>
          {backIcon !== "none" ? <View style={{ marginTop: size * 0.014 }}><CoinBackDecoration icon={backIcon} size={size * 0.07} color={resolvedNumberColor} /></View> : null}
          {safeName ? <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.45} style={[styles.name, { color: resolvedNumberColor, fontSize:size*.036, fontFamily:selectedFontFamily, fontWeight:numStyle.fontWeight, maxWidth:safeWidth }]}>{safeName}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  content: { position:"absolute",alignItems:"center",justifyContent:"center",alignSelf:"center",overflow:"visible",paddingHorizontal:2,paddingVertical:2 },
  brandWrap: { position:"absolute",left:0,right:0,alignItems:"center" },
  brand: { letterSpacing:2.6,textAlign:"center",opacity:0.42 },
  free: { letterSpacing: 1.5, textAlign: "center", textTransform: "uppercase", marginTop: 5, opacity: 0.72 },
  days: { textAlign: "center", overflow:"visible" },
  label: { letterSpacing: 3, opacity: 0.7, textAlign:"center", marginTop:0, overflow:"visible",includeFontPadding:true },
  name: { letterSpacing: 2, marginTop: 5, textAlign: "center", textTransform: "uppercase", opacity: 0.4 },
});
