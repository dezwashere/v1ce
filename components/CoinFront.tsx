import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Image, Path, Polygon } from "react-native-svg";
import { COIN_COLORS, NUMBER_STYLES, resolveCoinColor } from "@/constants/coin";
import { CoinBackground } from "@/components/coin/CoinBackground";
import { fonts } from "@/constants/typography";

export { COIN_COLORS, NUMBER_STYLES };

export const SHAPES = ["circle","hexagon","octagon","shield","diamond","star","badge","arrow","drawn"] as const;

const PATHS: Record<string,string> = {
  hexagon:"M25 2 L75 2 L100 50 L75 98 L25 98 L0 50 Z",
  octagon:"M30 2 L70 2 L98 30 L98 70 L70 98 L30 98 L2 70 L2 30 Z",
  shield:"M50 2 L100 17 L100 65 L50 100 L0 65 L0 17 Z",
  diamond:"M50 2 L95 50 L50 100 L5 50 Z",
  star:"M50 2 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z",
  badge:"M50 0 L65 10 L82 5 L90 20 L100 30 L95 50 L100 70 L90 80 L82 95 L65 90 L50 100 L35 90 L18 95 L10 80 L0 70 L5 50 L0 30 L10 20 L18 5 L35 10 Z",
  cross:"M33 0 L67 0 L67 33 L100 33 L100 67 L67 67 L67 100 L33 100 L33 67 L0 67 L0 33 L33 33 Z",
  arrow:"M0 35 L55 35 L55 10 L100 50 L55 90 L55 65 L0 65 Z",
};

const BOUNDS: Record<string,{width:number;height:number;y:number}> = {
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

function parseCustomPolygon(value?:string){
  if(!value) return null;
  const points=value.split(/\s+/)
    .map((p)=>p.trim().replace(/%/g,"").split(","))
    .filter((p)=>p.length===2)
    .map(([x,y])=>`${parseFloat(x)},${parseFloat(y)}`)
    .filter((p)=>!p.includes("NaN"))
    .join(" ");
  return points || null;
}

type Props={
  days?:number;
  shape?:string;
  color?:string;
  numberStyle?:string;
  size?:number;
  displayName?:string;
  motto?:string;
  customShapePath?:string;
  showBorder?:boolean;
  coinPhoto?:string;
  borderColor?:string;
  numberColor?:string;
  imageOnlyMode?:boolean;
  background?:string;
  onPress?:()=>void;
};

export default function CoinFront({
  days=0,
  shape="circle",
  color="gold",
  numberStyle="big_shoulders_stencil",
  size=260,
  displayName,
  customShapePath,
  showBorder=true,
  coinPhoto,
  borderColor,
  numberColor,
  imageOnlyMode=false,
  background="solid",
  onPress,
}:Props){
  const colors=resolveCoinColor(color);
  const numStyle=NUMBER_STYLES[numberStyle as keyof typeof NUMBER_STYLES]||NUMBER_STYLES.big_shoulders_stencil;
  const resolvedBorderColor=borderColor||colors.border;
  const resolvedNumberColor=numberColor||colors.text;
  const years=Math.floor(days/365);
  const months=Math.floor((days%365)/30);
  let mainNumber=days;
  let label="DAYS";
  if(years>=1){mainNumber=years;label=years===1?"YEAR":"YEARS";}
  else if(months>=1){mainNumber=months;label=months===1?"MONTH":"MONTHS";}

  const customPoints=shape==="drawn"?parseCustomPolygon(customShapePath):null;
  const bounds=BOUNDS[shape]||BOUNDS.circle;
  const maxWidth=size*bounds.width;
  const safeHeight=size*bounds.height;
  const narrow=["star","cross","arrow","diamond","badge"].includes(shape);
  const numberFontSize=size*(narrow?.24:.30);
  const numberLineHeight=numberFontSize*1.06;
  const verticalOffset=size*bounds.y;
  const path=PATHS[shape]||PATHS.hexagon;

  const content=(
    <View style={[styles.wrap,{width:size,height:size}]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {shape==="circle" ? (
          <>
            <Circle cx="50" cy="50" r="48" fill={colors.bg}/>
            {coinPhoto ? <Image href={{uri:coinPhoto}} x="2" y="2" width="96" height="96" preserveAspectRatio="xMidYMid slice" opacity={imageOnlyMode?1:.35}/> : null}
            {showBorder ? <Circle cx="50" cy="50" r="48" fill="none" stroke={resolvedBorderColor} strokeWidth="3"/> : null}
          </>
        ) : (
          <>
            {customPoints ? <Polygon points={customPoints} fill={colors.bg}/> : <Path d={path} fill={colors.bg}/>}
            {coinPhoto ? <Image href={{uri:coinPhoto}} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" opacity={imageOnlyMode?1:.35}/> : null}
            {showBorder ? (customPoints
              ? <Polygon points={customPoints} fill="none" stroke={resolvedBorderColor} strokeWidth="3"/>
              : <Path d={path} fill="none" stroke={resolvedBorderColor} strokeWidth="3"/>
            ) : null}
          </>
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill,{pointerEvents:"none"}]}>
        <CoinBackground kind={background} size={size} color={colors.bg} />
      </View>
      {imageOnlyMode ? null : (
        <View style={[styles.content,{pointerEvents:"none",width:maxWidth,height:safeHeight,top:(size-safeHeight)/2+verticalOffset}]}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.48} style={[styles.number,{
            color:resolvedNumberColor,
            fontSize:numberFontSize,
            lineHeight:numberLineHeight,
            letterSpacing:numberFontSize*(numStyle.letterSpacing??0),
            fontWeight:numStyle.fontWeight,
            fontFamily:FONT_FAMILIES[numStyle.fontFamily]||undefined,
            maxWidth,
          }]}>{mainNumber}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[styles.label,{color:resolvedNumberColor,fontSize:size*.075,fontFamily:"BebasNeue_400Regular",maxWidth}]}>{label}</Text>
          {displayName ? (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[styles.name,{color:resolvedNumberColor,fontSize:size*.036,maxWidth}]}>{displayName}</Text>
          ) : null}
        </View>
      )}
    </View>
  );

  return onPress ? <View onTouchEnd={onPress}>{content}</View> : content;
}

const styles=StyleSheet.create({
  wrap:{alignItems:"center",justifyContent:"center",aspectRatio:1},
  content:{position:"absolute",alignItems:"center",justifyContent:"center",alignSelf:"center",overflow:"hidden",paddingHorizontal:2},
  number:{includeFontPadding:false,textAlign:"center"},
  label:{letterSpacing:3,opacity:.7,textAlign:"center",marginTop:2},
  name:{fontFamily:fonts.bodyMedium,letterSpacing:2,opacity:.4,marginTop:8,textAlign:"center",textTransform:"uppercase"},
});
