import React, { useMemo, useState } from "react";
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

const FAMILIES = [
  { label: "RED", hue: 2, color: "#FF3B30" },
  { label: "ORANGE", hue: 32, color: "#FF9500" },
  { label: "YELLOW", hue: 48, color: "#FFCC00" },
  { label: "GREEN", hue: 138, color: "#34C759" },
  { label: "BLUE", hue: 211, color: "#007AFF" },
  { label: "INDIGO", hue: 241, color: "#5856D6" },
  { label: "VIOLET", hue: 282, color: "#AF52DE" },
  { label: "PINK", hue: 330, color: "#FF2D8D" },
] as const;

const LIGHTNESS = [31, 42, 53, 66, 80];

function hslToHex(h: number, s: number, l: number) {
  const sat=s/100, light=l/100;
  const c=(1-Math.abs(2*light-1))*sat;
  const x=c*(1-Math.abs(((h/60)%2)-1));
  const m=light-c/2;
  let r=0,g=0,b=0;
  if(h<60)[r,g,b]=[c,x,0];
  else if(h<120)[r,g,b]=[x,c,0];
  else if(h<180)[r,g,b]=[0,c,x];
  else if(h<240)[r,g,b]=[0,x,c];
  else if(h<300)[r,g,b]=[x,0,c];
  else [r,g,b]=[c,0,x];
  const hex=(n:number)=>Math.round((n+m)*255).toString(16).padStart(2,"0").toUpperCase();
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function hexToHsl(hex:string){
  if(!/^#[0-9A-Fa-f]{6}$/.test(hex)) return {h:48,l:53};
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  const l=(max+min)/2;
  let h=0;
  if(d!==0){
    if(max===r)h=60*(((g-b)/d)%6);
    else if(max===g)h=60*((b-r)/d+2);
    else h=60*((r-g)/d+4);
  }
  return {h:(h+360)%360,l:l*100};
}

function circularDistance(a:number,b:number){const d=Math.abs(a-b)%360;return Math.min(d,360-d);}

export default function ColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors=useColors();
  const parsed=hexToHsl(value);
  const familyIndex=FAMILIES.reduce((best,item,index)=>circularDistance(item.hue,parsed.h)<circularDistance(FAMILIES[best].hue,parsed.h)?index:best,0);
  const [width,setWidth]=useState(1);
  const family=FAMILIES[familyIndex];
  const shadeIndex=LIGHTNESS.reduce((best,l,index)=>Math.abs(l-parsed.l)<Math.abs(LIGHTNESS[best]-parsed.l)?index:best,0);
  const shades=LIGHTNESS.map(l=>hslToHex(family.hue,86,l));

  const selectShade=(index:number)=>onChange(shades[Math.max(0,Math.min(LIGHTNESS.length-1,index))]);
  const updateFromX=(x:number)=>selectShade(Math.floor(Math.max(0,Math.min(width-0.01,x))/Math.max(width,1)*LIGHTNESS.length));
  const responder=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>true,
    onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:e=>updateFromX(e.nativeEvent.locationX),
    onPanResponderMove:e=>updateFromX(e.nativeEvent.locationX),
  }),[width,shades.join("|")]);

  return <View>
    <View style={styles.familyRow}>
      {FAMILIES.map((item,index)=><TouchableOpacity key={item.label} onPress={()=>onChange(hslToHex(item.hue,86,LIGHTNESS[shadeIndex]))} style={styles.familyItem}>
        <View style={[styles.familyDot,{backgroundColor:item.color,borderColor:index===familyIndex?colors.foreground:"transparent"}]}/>
        <Text style={[styles.familyLabel,{color:index===familyIndex?colors.foreground:colors.mutedForeground}]}>{item.label}</Text>
      </TouchableOpacity>)}
    </View>
    <Text style={[styles.activeLabel,{color:colors.mutedForeground}]}>{family.label}</Text>
    <View style={[styles.track,{borderColor:colors.foreground}]} onLayout={e=>setWidth(e.nativeEvent.layout.width)} {...responder.panHandlers}>
      {shades.map((shade,index)=><TouchableOpacity key={shade} activeOpacity={1} onPress={()=>selectShade(index)} style={[styles.segment,{backgroundColor:shade}]}/>)}
      <View pointerEvents="none" style={[styles.thumb,{left:`${((shadeIndex+0.5)/LIGHTNESS.length)*100}%`,borderColor:colors.foreground,backgroundColor:shades[shadeIndex]}]}/>
    </View>
  </View>;
}

const styles=StyleSheet.create({
  familyRow:{flexDirection:"row",justifyContent:"space-between",flexWrap:"wrap",gap:5,rowGap:10,marginBottom:14},
  familyItem:{width:"22%",alignItems:"center"},
  familyDot:{width:34,height:34,borderRadius:17,borderWidth:3},
  familyLabel:{fontFamily:fonts.bodyBold,fontSize:7,letterSpacing:.4,marginTop:5},
  activeLabel:{fontFamily:fonts.bodyBold,fontSize:10,letterSpacing:2,marginBottom:8},
  track:{height:42,borderWidth:2,flexDirection:"row",position:"relative",overflow:"visible"},
  segment:{flex:1},
  thumb:{position:"absolute",top:5,width:30,height:30,marginLeft:-15,borderRadius:15,borderWidth:3},
});
