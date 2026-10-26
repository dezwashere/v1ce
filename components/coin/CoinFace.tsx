import React, { useId } from "react";
import { Text, View } from "react-native";
import Svg, { ClipPath, Defs, G, Image, LinearGradient, Polygon, Polyline, Stop } from "react-native-svg";
import { buildCoinDesign, coinTime, pointsString, type CoinInput, type Face } from "@/lib/coinDesign";
import type { Art } from "@/lib/coinArtwork";

function Artwork({ items }: { items: Art[] }) {
  return <>{items.map((item,i) => {
    const Shape = item.closed ? Polygon : Polyline;
    return <Shape key={i} points={pointsString(item.points)} fill={item.fill || "none"} stroke={item.stroke || "none"} strokeWidth={item.width} opacity={item.opacity} strokeLinecap="round" strokeLinejoin="round"/>;
  })}</>;
}

export default function CoinFace({ face = "front", ...input }: CoinInput & { face?: Face }) {
  const size = input.size || 260, design = buildCoinDesign(input), time = coinTime(input.days || 0);
  const id = useId().replace(/[^a-zA-Z0-9]/g, ""), shape = pointsString(design.polygon);
  const insetShape = pointsString(design.polygon.map(point => ({ x: 50 + (point.x - 50) * .86, y: 50 + (point.y - 50) * .86 })));
  return <View style={{ width: size, height: size }}>
    <Svg width={size} height={size} viewBox="-3 -3 106 111">
      <Defs>
        <LinearGradient id={`${id}light`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#ffffff" stopOpacity={.38}/><Stop offset=".45" stopColor="#ffffff" stopOpacity={0}/><Stop offset="1" stopColor="#000000" stopOpacity={.18}/></LinearGradient>
        <ClipPath id={`${id}clip`}><Polygon points={shape}/></ClipPath>
      </Defs>
      {[5,4,3,2,1].map(y => <G key={y} transform={`translate(0 ${y})`}>
        <Polygon points={shape} fill={design.shadow}/>
        {design.showBorder && design.rim.map((p,i) => <Polygon key={i} points={pointsString(p)} fill={design.rimPrimary}/>)}
      </G>)}
      <Polygon points={shape} fill={design.face}/>
      <Polygon points={insetShape} fill="none" stroke={design.shadow} strokeOpacity={.34} strokeWidth={1.8}/>
      <Polygon points={insetShape} fill="none" stroke={design.highlight} strokeOpacity={.32} strokeWidth={.65}/>
      <G clipPath={`url(#${id}clip)`}>
        {design.photo && <Image href={{ uri: design.photo }} x={0} y={0} width={100} height={100} opacity={design.imageOnly ? 1 : .35} preserveAspectRatio="xMidYMid slice"/>}
        <Artwork items={design.backgroundArt}/>
        <Polygon points={shape} fill={`url(#${id}light)`}/>
      </G>
      {design.showBorder && <G>
        <Polygon points={shape} fill="none" stroke={design.rimSecondary} strokeWidth={2}/>
        {design.rim.map((p,i) => <Polygon key={i} points={pointsString(p)} fill={design.rimPrimary} stroke={design.highlight} strokeOpacity={.45} strokeWidth={.35}/>)}
      </G>}
      <Polygon points={shape} fill="none" stroke={design.highlight} strokeWidth={.6}/>
      {face === "back" && !design.imageOnly && <G clipPath={`url(#${id}clip)`}><Artwork items={design.backArt}/></G>}
    </Svg>
    {!design.imageOnly && design[face].filter(box => box.width > 0).map(box => {
      // Same viewBox transform as the SVG. Native Text fitting measures the selected font.
      const unit = size / 111, ox = (size - 106 * unit) / 2 + 3 * unit, oy = 3 * unit;
      return <View key={box.id} pointerEvents="none" style={{ position: "absolute", left: ox + (box.x - box.width / 2) * unit, top: oy + (box.y - box.height / 2) * unit, width: box.width * unit, height: box.height * unit, justifyContent: "center" }}>
        <Text numberOfLines={box.lines || 1} adjustsFontSizeToFit minimumFontScale={.25} allowFontScaling={false} style={{ fontFamily: design.appFont, maxHeight: box.height * unit,
          color: design.text, textAlign: "center", fontSize: box.fontSize * unit, letterSpacing: box.fontSize * unit * design.tracking,
          textShadowColor: design.highlight, textShadowOffset: { width: 0, height: .6 }, textShadowRadius: 0,
        }}>{box.text === "$value" ? time.value : box.text === "$unit" ? time.unit : box.text}</Text>
      </View>;
    })}
  </View>;
}
