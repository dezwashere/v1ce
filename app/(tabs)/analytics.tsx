import React from "react";
import {ScrollView,StyleSheet,Text,View} from "react-native";
import {useColors} from "@/hooks/useColors";
import {useAuth} from "@/context/AuthContext";

export default function Analytics(){
 const c=useColors();
 const {profile}=useAuth();
 const days=profile?.sobriety_date?Math.max(0,Math.floor((Date.now()-new Date(profile.sobriety_date+"T00:00:00").getTime())/86400000)):0;
 const milestones=[1,7,30,60,90,180,365,730,1095,1825].filter(value=>days>=value).length;
 return <ScrollView style={{backgroundColor:c.background}} contentContainerStyle={s.container}>
  <Text style={[s.title,{color:c.foreground}]}>YOUR{"\n"}STATS.</Text>
  <Text style={[s.subtitle,{color:c.mutedForeground}]}>A snapshot of your current sobriety journey.</Text>
  <View style={[s.preview,{borderColor:c.foreground}]}>
   <Text style={[s.previewTitle,{color:c.foreground}]}>THIS WEEK</Text>
   <View style={s.bars}>{[.2,.35,.3,.55,.45,.7,.62].map((h,i)=><View key={i} style={[s.bar,{height:30+h*70,backgroundColor:c.foreground}]}/>)}</View>
  </View>
  <View style={s.grid}>
   <Stat label="LONGEST STREAK" value={`${days} DAYS`} c={c}/>
   <Stat label="TOTAL CHECK-INS" value="—" c={c}/>
   <Stat label="THIS WEEK" value={`${Math.min(days,7)} DAYS`} c={c}/>
   <Stat label="MILESTONES" value={String(milestones)} c={c}/>
  </View>
 </ScrollView>
}
function Stat({label,value,c}:{label:string;value:string;c:any}){
 return <View style={[s.stat,{borderColor:c.foreground}]}><Text style={[s.statValue,{color:c.foreground}]}>{value}</Text><Text style={[s.statLabel,{color:c.mutedForeground}]}>{label}</Text></View>
}
const s=StyleSheet.create({container:{padding:20,paddingTop:55,paddingBottom:80},title:{fontSize:54,fontWeight:"900",lineHeight:52,letterSpacing:-1},subtitle:{fontSize:14,lineHeight:21,marginTop:18,maxWidth:330},preview:{borderWidth:2,marginTop:36,padding:18,minHeight:190},previewTitle:{fontSize:12,fontWeight:"900",letterSpacing:2},bars:{height:125,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:18},bar:{width:26},grid:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:8},stat:{width:"48.8%",minHeight:112,borderWidth:2,padding:14,justifyContent:"space-between"},statValue:{fontSize:24,fontWeight:"900"},statLabel:{fontSize:9,fontWeight:"800",letterSpacing:1.5}});