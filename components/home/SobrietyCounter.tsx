import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export function SobrietyCounter({ sobrietyDate, dark=false }: { sobrietyDate?: string | null; dark?: boolean }) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
  if(!sobrietyDate) return <Text style={[styles.prompt,{color:dark?"#A3A3A3":"#737373"}]}>Set your sobriety date to start tracking.</Text>;
  const start=new Date(`${sobrietyDate}T00:00:00`).getTime();
  const total=Math.max(0,Math.floor((now-start)/1000));
  const days=Math.floor(total/86400), hours=Math.floor(total%86400/3600), minutes=Math.floor(total%3600/60), seconds=total%60;
  const fg=dark?"#FAFAFA":"#0A0A0A", muted=dark?"#A3A3A3":"#737373";
  return <View><View style={styles.main}><Text style={[styles.days,{color:fg}]}>{days}</Text><Text style={[styles.label,{color:muted}]}>DAYS</Text></View><View style={styles.row}>{[[hours,"HRS"],[minutes,"MIN"],[seconds,"SEC"]].map(([v,l])=><View key={String(l)} style={[styles.unit,{borderColor:fg}]}><Text style={[styles.value,{color:fg}]}>{String(v).padStart(2,"0")}</Text><Text style={[styles.unitLabel,{color:muted}]}>{l}</Text></View>)}</View></View>;
}
const styles=StyleSheet.create({main:{flexDirection:"row",alignItems:"baseline",justifyContent:"space-between"},days:{fontSize:92,lineHeight:96,fontWeight:"900",letterSpacing:-3},label:{fontSize:10,letterSpacing:2,fontWeight:"800"},row:{flexDirection:"row",gap:8,marginTop:10},unit:{flex:1,borderWidth:2,paddingVertical:10,paddingHorizontal:8},value:{fontSize:24,fontWeight:"800"},unitLabel:{marginTop:2,fontSize:8,letterSpacing:1.5},prompt:{fontSize:12}});
