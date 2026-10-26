import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { FONT_NAMES } from "@/lib/coinDesign";
import { NUMBER_STYLES, normalizeNumberStyle } from "@/constants/coin";
import { useRouter } from "expo-router";
import { usePremium } from "@/context/PremiumContext";
import { fonts } from "@/constants/typography";

const LABELS:Record<string,string>={vt323:"VT323",im_fell_english_sc:"IM FELL English SC",slackey:"Slackey",josefin_sans:"Josefin Sans",varela_round:"Varela Round",walter_turncoat:"Walter Turncoat"};
const ORDER=["vt323","im_fell_english_sc","slackey","josefin_sans","varela_round","walter_turncoat"] as const;
export default function NumberStylePicker({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const colors=useColors(); const {isPremium}=usePremium(); const router=useRouter();
 return <View style={styles.wrap}>
  {ORDER.map(key=>{
   const style=NUMBER_STYLES[key];
   const locked=key!=="walter_turncoat"&&!isPremium;
   const active=normalizeNumberStyle(value)===key;
   return <TouchableOpacity key={key} onPress={()=>locked?router.push("/(tabs)/premium"):onChange(key)} style={[styles.card,{borderColor:active?colors.foreground:colors.border},locked&&{opacity:.42}]}>
  {locked?<Feather name="lock" size={12} color={colors.mutedForeground} style={styles.lock}/>:null}
  <Text style={{color:colors.foreground,fontFamily:FONT_NAMES[key].app,fontSize:40,lineHeight:48}}>42</Text>
  <Text numberOfLines={1} style={[styles.name,{color:colors.foreground}]}>{LABELS[key]||key}</Text>
 </TouchableOpacity>})}</View>;
}
const styles=StyleSheet.create({wrap:{flexDirection:"row",flexWrap:"wrap",gap:8},card:{width:"31.4%",minHeight:110,borderWidth:2,alignItems:"center",justifyContent:"center",paddingVertical:12,paddingHorizontal:4},name:{fontSize:10,fontFamily:fonts.body,marginTop:4,textAlign:"center"},lock:{position:"absolute",right:8,top:8}});
