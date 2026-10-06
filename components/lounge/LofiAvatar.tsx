import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { View } from "react-native";

const PALETTES = [
  ["#F04A3A","#F7E7C6","#151515"],
  ["#2563EB","#EAF0FF","#151515"],
  ["#2F8F57","#F5E7B8","#17351F"],
  ["#F2B632","#151515","#DDEBFF"],
  ["#A64AC9","#F7E7C6","#151515"],
  ["#16A085","#F7E7C6","#151515"],
];

export default function LofiAvatar({ seed="A", size=34, color }: { seed?:string; size?:number; color?:string }) {
  const code=[...seed].reduce((a,c)=>a+c.charCodeAt(0),0);
  const p=PALETTES[code%PALETTES.length];
  const tilt=(code%7)-3;
  return (
    <View style={{width:size,height:size}}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Circle cx="20" cy="20" r="19" fill={color || p[1]} />
        <Path d="M-2 10 C8 3 16 19 25 11 S38 8 44 3" fill="none" stroke={p[0]} strokeWidth="8" transform={`rotate(${tilt} 20 20)`} />
        <Path d="M-1 28 C9 18 18 34 27 24 S38 18 44 16" fill="none" stroke={p[2]} strokeWidth="6" transform={`rotate(${-tilt} 20 20)`} />
        {code%2===0 ? <Rect x="15" y="-2" width="5" height="44" fill={p[0]} opacity=".55" transform="rotate(28 20 20)" /> : null}
      </Svg>
    </View>
  );
}