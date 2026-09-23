import React,{useState} from "react";
import {ScrollView,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {useLocalSearchParams,useRouter} from "expo-router";
import {useColors} from "@/hooks/useColors";
import SnakeGame from "@/components/games/SnakeGame";
import SobrietyRunGame from "@/components/games/SobrietyRunGame";

export default function Game(){
 const c=useColors(); const router=useRouter(); const params=useLocalSearchParams<{game?:string}>(); const [game,setGame]=useState<"run"|"snake">(params.game==="snake"?"snake":"run");
 return <ScrollView style={{backgroundColor:c.background}} contentContainerStyle={s.page}>
  <TouchableOpacity onPress={()=>router.back()}><Text style={[s.back,{color:c.foreground}]}>← BACK</Text></TouchableOpacity>
  <Text style={[s.kicker,{color:c.mutedForeground}]}>V1CE</Text>
  <Text style={[s.title,{color:c.foreground}]}>GAME.</Text>
  <View style={s.tabs}>
   <TouchableOpacity onPress={()=>setGame("run")} style={[s.tab,{borderColor:c.foreground,backgroundColor:game==="run"?c.foreground:c.background}]}><Text style={{color:game==="run"?c.background:c.foreground,fontWeight:"900"}}>SOBRIETY RUN</Text></TouchableOpacity>
   <TouchableOpacity onPress={()=>setGame("snake")} style={[s.tab,{borderColor:c.foreground,backgroundColor:game==="snake"?c.foreground:c.background}]}><Text style={{color:game==="snake"?c.background:c.foreground,fontWeight:"900"}}>JAYWALKER</Text></TouchableOpacity>
  </View>
  {game==="run"?<SobrietyRunGame/>:<SnakeGame/>}
 </ScrollView>
}
const s=StyleSheet.create({page:{padding:20,paddingTop:40,paddingBottom:80},back:{fontSize:11,fontWeight:"900",letterSpacing:2,marginBottom:30},kicker:{fontSize:11,letterSpacing:5,fontWeight:"800"},title:{fontSize:54,fontWeight:"900",marginBottom:22},tabs:{flexDirection:"row",gap:8,marginBottom:18},tab:{borderWidth:2,paddingHorizontal:12,paddingVertical:11}});
