import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Coin } from "../../components/Coin";
import { SobrietyCounter } from "../../components/home/SobrietyCounter";
import { RotatingLabel } from "../../components/home/RotatingLabel";
import { MilestoneTimeline } from "../../components/home/MilestoneTimeline";
import { SubstanceChecklist } from "../../components/home/SubstanceChecklist";

type Profile = {
  display_name: string | null;
  sobriety_date: string | null;
  substances: string[] | null;
  coin_motto: string | null;
  coin_color: string | null;
  coin_shape: string | null;
  coin_photo: string | null;
};

function daysSince(start: string | null) {
  if (!start) return 0;
  const startMs = new Date(start + "T00:00:00").getTime();
  return Math.max(0, Math.floor((Date.now() - startMs) / 86400000));
}

function displayDate(start: string | null) {
  if (!start) return "—";
  const [y, m, d] = start.split("-");
  return m + "/" + d + "/" + y;
}

function Starburst({ dark }: { dark: boolean }) {
  return <View pointerEvents="none" style={styles.starburst}>{Array.from({ length: 12 }).map((_, i) =>
    <View key={i} style={[styles.starRay,{backgroundColor:dark?"#FAFAFA":"#0A0A0A",transform:[{rotate:(i*15)+"deg"}]}]}/>)}</View>;
}

export default function HomeTab() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  const [profile,setProfile]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(true);
  const [selectedDocs,setSelectedDocs]=useState<string[]>([]);

  useEffect(()=>{
    if(!user?.email){setLoading(false);return;}
    supabase.from("SobrietyProfile")
      .select("display_name, sobriety_date, substances, coin_motto, coin_color, coin_shape, coin_photo")
      .eq("email",user.email).maybeSingle()
      .then(({data})=>{setProfile(data);setSelectedDocs(data?.substances||[]);setLoading(false);});
  },[user?.email]);

  async function toggleDoc(doc:string){
    const next=selectedDocs.includes(doc)?selectedDocs.filter(x=>x!==doc):[...selectedDocs,doc];
    setSelectedDocs(next);
    if(user?.email){
      await supabase.from("SobrietyProfile").update({substances:next}).eq("email",user.email);
      setProfile(p=>p?{...p,substances:next}:p);
    }
  }

  if(loading) return <View style={[styles.center,{backgroundColor:dark?"#0A0A0A":"#F7F7F7"}]}><ActivityIndicator color="#F5A41A"/></View>;

  const bg=dark?"#0A0A0A":"#F7F7F7",fg=dark?"#FAFAFA":"#0A0A0A",muted=dark?"#A3A3A3":"#737373";

  return <ScrollView contentContainerStyle={[styles.container,{backgroundColor:bg,paddingTop:insets.top,paddingBottom:insets.bottom+100}]} showsVerticalScrollIndicator={false}>
    <View style={[styles.topBar,{borderBottomColor:fg}]}>
      <Text style={[styles.logo,{color:fg}]}>V1CE.</Text>
      <Text style={[styles.version,{color:muted}]}>V1</Text>
      <Pressable onPress={()=>router.push("/(tabs)/customize")} style={styles.topAction}><Text style={[styles.topActionText,{color:fg}]}>COIN</Text></Pressable>
    </View>
    <View style={[styles.hero,{borderBottomColor:fg}]}>
      <Starburst dark={dark}/><Text style={[styles.heroLine,{color:fg}]}>TIME</Text><Text style={[styles.heroLine,{color:fg}]}>ELAPSED</Text>
      <RotatingLabel dark={dark}/><Text style={[styles.since,{color:muted}]}>{profile?.sobriety_date?"SOBER SINCE "+displayDate(profile.sobriety_date):"SET YOUR SOBRIETY DATE"}</Text>
    </View>
    <View style={[styles.timer,{borderBottomColor:fg}]}><SobrietyCounter sobrietyDate={profile?.sobriety_date} dark={dark}/></View>
    <View style={[styles.coinSection,{borderBottomColor:fg}]}>
      <Coin color={profile?.coin_color} shape={profile?.coin_shape||"circle"} motto={profile?.coin_motto} imageUrl={profile?.coin_photo} number={daysSince(profile?.sobriety_date)}/>
      <Pressable onPress={()=>router.push("/(tabs)/customize")} style={[styles.customizeButton,{borderColor:fg}]}><Text style={[styles.customizeText,{color:fg}]}>CUSTOMIZE →</Text></Pressable>
    </View>
    <View style={[styles.section,{borderBottomColor:fg}]}>
      <Text style={[styles.sectionTitle,{color:fg}]}>WHAT’S{"\n"}YOUR DOC?</Text>
      <Text style={[styles.sectionSub,{color:muted}]}>SELECT WHAT YOU’RE STAYING FREE FROM.</Text>
      <SubstanceChecklist selected={selectedDocs} onToggle={toggleDoc} dark={dark}/>
    </View>
    <View style={[styles.section,{borderBottomColor:fg}]}>
      <View style={styles.sectionHeader}><Text style={[styles.sectionTitle,{color:fg}]}>YOUR{"\n"}MILESTONES.</Text><Text style={[styles.milestoneCount,{color:muted}]}>{daysSince(profile?.sobriety_date)} DAYS</Text></View>
      <View style={styles.milestoneList}><MilestoneTimeline days={daysSince(profile?.sobriety_date)} dark={dark}/></View>
    </View>
  </ScrollView>;
}

const styles=StyleSheet.create({
 container:{paddingHorizontal:0},center:{flex:1,alignItems:"center",justifyContent:"center"},topBar:{minHeight:58,paddingHorizontal:20,flexDirection:"row",alignItems:"center",borderBottomWidth:2},
 logo:{fontSize:22,fontWeight:"900",letterSpacing:3},version:{marginLeft:8,fontSize:9,letterSpacing:1.5},topAction:{marginLeft:"auto"},topActionText:{fontSize:10,fontWeight:"800",letterSpacing:1.5},
 hero:{minHeight:230,paddingHorizontal:20,paddingTop:26,paddingBottom:20,borderBottomWidth:2,position:"relative",overflow:"hidden"},heroLine:{fontSize:58,lineHeight:55,fontWeight:"900",letterSpacing:-2},since:{marginTop:18,fontSize:9,letterSpacing:1.8,fontWeight:"600"},
 starburst:{position:"absolute",right:22,top:24,width:86,height:86,alignItems:"center",justifyContent:"center",opacity:.12},starRay:{position:"absolute",width:2,height:86},timer:{paddingHorizontal:20,paddingVertical:22,borderBottomWidth:2},
 coinSection:{alignItems:"center",paddingVertical:28,borderBottomWidth:2},customizeButton:{marginTop:18,borderWidth:2,paddingHorizontal:18,paddingVertical:11},customizeText:{fontSize:11,fontWeight:"800",letterSpacing:1.5},
 section:{paddingHorizontal:20,paddingVertical:28,borderBottomWidth:2},sectionHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start"},sectionTitle:{fontSize:36,lineHeight:34,fontWeight:"900",letterSpacing:-1},
 sectionSub:{marginTop:8,fontSize:9,letterSpacing:1.6,fontWeight:"600"},milestoneCount:{fontSize:9,letterSpacing:1.5,fontWeight:"600",marginTop:4},milestoneList:{marginTop:18}
});