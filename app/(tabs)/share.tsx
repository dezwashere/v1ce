import React, { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { fonts } from "@/constants/typography";
import { useTranslation } from "@/lib/i18n";

export default function ShareScreen(){
  const {user}=useAuth(); const c=useColors(); const {t}=useTranslation();
  const [giftEmail,setGiftEmail]=useState(""); const [plan,setPlan]=useState<"monthly"|"yearly">("monthly"); const [busy,setBusy]=useState(false);
  const gift=async()=>{const email=giftEmail.trim();if(!email)return;setBusy(true);const {data,error}=await supabase.functions.invoke("create-checkout",{body:{plan,giftEmail:email,gifterEmail:user?.email||"",successUrl:"v1ce://share?gift=1",cancelUrl:"v1ce://share"}});setBusy(false);if(error||!data?.url){Alert.alert("V1CE",error?.message||"Gift checkout is not available.");return;}Linking.openURL(data.url);};
  return <ScrollView style={{backgroundColor:c.background}} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={[styles.title,{color:c.foreground}]}>{t("share.title")}</Text>
    <View style={[styles.card,{borderColor:c.foreground}]}>
      <Text style={[styles.section,{color:c.foreground}]}>{t("share.addHome")}</Text>
      <Text style={[styles.step,{color:c.mutedForeground}]}>{t("share.step1")}</Text>
      <Text style={[styles.step,{color:c.mutedForeground}]}>{t("share.step2")}</Text>
      <Text style={[styles.step,{color:c.mutedForeground}]}>{t("share.step3")}</Text>
      <Text style={[styles.step,{color:c.mutedForeground}]}>{t("share.step4")}</Text>
      <Text style={[styles.note,{color:c.mutedForeground}]}>{t("share.note")}</Text>
    </View>
    <View style={[styles.card,{borderColor:c.foreground}]}>
      <Text style={[styles.section,{color:c.foreground}]}>{t("share.payForward")}</Text>
      <Text style={[styles.sub,{color:c.mutedForeground}]}>{t("share.giftSub")}</Text>
      <Text style={[styles.label,{color:c.mutedForeground}]}>{t("share.email")}</Text>
      <TextInput value={giftEmail} onChangeText={setGiftEmail} autoCapitalize="none" keyboardType="email-address" placeholder="friend@email.com" placeholderTextColor={c.mutedForeground} style={[styles.input,{borderColor:c.foreground,color:c.foreground}]}/>
      <View style={styles.plans}>
        <TouchableOpacity onPress={()=>setPlan("monthly")} style={[styles.plan,{backgroundColor:plan==="monthly"?c.foreground:c.background,borderColor:c.foreground}]}><Text style={[styles.planText,{color:plan==="monthly"?c.background:c.foreground}]}>$2.99 / MO</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setPlan("yearly")} style={[styles.plan,{backgroundColor:plan==="yearly"?c.foreground:c.background,borderColor:c.foreground}]}><Text style={[styles.planText,{color:plan==="yearly"?c.background:c.foreground}]}>$22 / YR GIFT</Text></TouchableOpacity>
      </View>
      <TouchableOpacity disabled={busy} onPress={gift} style={[styles.primary,{backgroundColor:c.foreground,opacity:busy?.5:1}]}><Text style={[styles.primaryText,{color:c.background}]}>{busy?t("share.loading"):t("share.sendGift")}</Text></TouchableOpacity>
    </View>
  </ScrollView>;
}
const styles=StyleSheet.create({
  page:{padding:20,paddingBottom:56},
  title:{fontFamily:fonts.display,fontSize:58,lineHeight:70,paddingTop:8,marginBottom:12},
  card:{borderWidth:2,padding:16,marginBottom:16},
  section:{fontFamily:fonts.display,fontSize:24,letterSpacing:1,marginBottom:12},
  step:{fontFamily:fonts.body,fontSize:14,lineHeight:22,marginBottom:4},
  note:{fontFamily:fonts.body,fontSize:11,lineHeight:17,marginTop:8},
  sub:{fontFamily:fonts.body,fontSize:14,lineHeight:20,marginBottom:14},
  label:{fontFamily:fonts.bodyBold,fontSize:10,letterSpacing:2,marginBottom:8},
  input:{borderWidth:2,minHeight:48,paddingHorizontal:12,fontFamily:fonts.body,fontSize:15},
  plans:{flexDirection:"row",marginTop:12},
  plan:{flex:1,borderWidth:2,minHeight:52,alignItems:"center",justifyContent:"center"},
  planText:{fontFamily:fonts.black,fontSize:12},
  primary:{minHeight:52,alignItems:"center",justifyContent:"center",marginTop:12},
  primaryText:{fontFamily:fonts.black,fontSize:12,letterSpacing:1.7},
});