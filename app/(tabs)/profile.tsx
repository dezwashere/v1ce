import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { supabase, TABLES } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { daysSince } from "@/constants/app";
import SobrietyCoin from "@/components/coin/SobrietyCoin";
import LofiAvatar from "@/components/lounge/LofiAvatar";

const STATUS_KEY="v1ce_lounge_status_note";
const AVATAR_SEED_KEY="v1ce_default_avatar_seed";
const AVATARS=["INK","BLUE","LEAF","SUN","VIOLET","WAVE"];

export default function ProfileScreen(){
  const {profile,setProfile}=useAuth();
  const colors=useColors();
  const router=useRouter();
  const [status,setStatus]=useState("");
  const [avatarSeed,setAvatarSeed]=useState("INK");
  const [showCoin,setShowCoin]=useState(profile?.show_coin ?? true);
  const [saving,setSaving]=useState(false);
  useEffect(()=>{Promise.all([AsyncStorage.getItem(STATUS_KEY),AsyncStorage.getItem(AVATAR_SEED_KEY)]).then(([s,a])=>{if(s)setStatus(s);if(a)setAvatarSeed(a);});},[]);
  useEffect(()=>{if(profile)setShowCoin(profile.show_coin ?? true);},[profile?.id,profile?.show_coin]);
  if(!profile)return <View style={{flex:1,backgroundColor:colors.background}}/>;
  const save=async()=>{
    if(saving)return;
    setSaving(true);
    await Promise.all([AsyncStorage.setItem(STATUS_KEY,status.trim()),AsyncStorage.setItem(AVATAR_SEED_KEY,avatarSeed)]);
    if(profile?.id){
      const {data}=await supabase.from(TABLES.SobrietyProfile).update({show_coin:showCoin}).eq("id",profile.id).select().single();
      if(data)setProfile(data);
    }
    setSaving(false);
  };
  return <ScrollView style={{backgroundColor:colors.background}} contentContainerStyle={styles.page}>
    <Text style={[styles.title,{color:colors.foreground}]}>PROFILE</Text>
    <View style={styles.avatarArea}>
      {profile.avatar_url ? <Image source={{uri:profile.avatar_url}} style={styles.avatarImg}/> : <LofiAvatar seed={avatarSeed} size={112}/>}
      <Text style={[styles.name,{color:colors.foreground}]}>{profile.display_name || "YOU"}</Text>
      <Text style={[styles.days,{color:colors.mutedForeground}]}>{daysSince(profile.sobriety_date)} DAYS</Text>
    </View>
    <Text style={[styles.label,{color:colors.mutedForeground}]}>DEFAULT PROFILE PICTURES</Text>
    <View style={styles.avatarRow}>{AVATARS.map(a=><TouchableOpacity key={a} onPress={()=>setAvatarSeed(a)} style={[styles.avatarChoice,{borderColor:avatarSeed===a?colors.foreground:colors.border}]}><LofiAvatar seed={a} size={54}/></TouchableOpacity>)}</View>
    <Text style={[styles.label,{color:colors.mutedForeground,marginTop:26}]}>PROFILE COIN</Text>
    <TouchableOpacity onPress={()=>setShowCoin(v=>!v)} style={[styles.toggleRow,{borderColor:colors.foreground}]}>
      <Text style={[styles.toggleText,{color:colors.foreground}]}>SHOW COIN ON PROFILE</Text>
      <View style={[styles.toggleTrack,{backgroundColor:showCoin?colors.foreground:colors.secondary}]}>
        <View style={[styles.toggleKnob,{backgroundColor:colors.background,transform:[{translateX:showCoin?22:2}]}]}/>
      </View>
    </TouchableOpacity>
    <Text style={[styles.toggleSub,{color:colors.mutedForeground}]}>When off, friends can still see your profile but not your coin.</Text>

    <Text style={[styles.label,{color:colors.mutedForeground,marginTop:26}]}>STATUS NOTE</Text>
    <TextInput value={status} onChangeText={v=>setStatus(v.slice(0,100))} placeholder="Still here. And so proud of that." placeholderTextColor={colors.mutedForeground} multiline style={[styles.input,{borderColor:colors.foreground,color:colors.foreground}]}/>
    {showCoin?<View style={styles.preview}><SobrietyCoin days={daysSince(profile.sobriety_date)} shape={profile.coin_shape||"circle"} color={profile.coin_color||"#F5D680"} numberStyle={profile.number_style||"classic"} size={160} displayName={profile.display_name||""} motto={(profile.coin_motto||"FREE FROM").slice(0,18)} substances={profile.substances||[]} showBorder={profile.coin_show_border??true} borderColor={profile.coin_border_color||undefined} numberColor={profile.coin_number_color||undefined}/></View>:<View style={styles.hiddenCoin}><Text style={[styles.hiddenCoinText,{color:colors.mutedForeground}]}>COIN HIDDEN FROM FRIENDS</Text></View>}
    <TouchableOpacity onPress={save} style={[styles.primary,{backgroundColor:colors.foreground}]}><Text style={[styles.primaryText,{color:colors.background}]}>{saving?"SAVING...":"SAVE PROFILE"}</Text></TouchableOpacity>
    <TouchableOpacity onPress={()=>router.push("/settings")} style={[styles.outline,{borderColor:colors.foreground}]}><Text style={[styles.outlineText,{color:colors.foreground}]}>SETTINGS</Text></TouchableOpacity>
  </ScrollView>;
}
const styles=StyleSheet.create({
  page:{padding:20,paddingBottom:56},
  title:{fontFamily:fonts.display,fontSize:64,lineHeight:78,paddingTop:8},
  avatarArea:{alignItems:"center",paddingVertical:16},
  avatarImg:{width:112,height:112,borderRadius:56},
  name:{fontFamily:fonts.black,fontSize:24,marginTop:12},
  days:{fontFamily:fonts.bodyBold,fontSize:11,letterSpacing:1.5,marginTop:4},
  label:{fontFamily:fonts.bodyBold,fontSize:10,letterSpacing:2,marginBottom:10},
  avatarRow:{flexDirection:"row",flexWrap:"wrap",gap:10},
  avatarChoice:{borderWidth:2,padding:3},
  input:{borderWidth:2,minHeight:90,padding:12,fontFamily:fonts.body,fontSize:15,textAlignVertical:"top"},
  preview:{alignItems:"center",paddingVertical:24},
  hiddenCoin:{minHeight:100,alignItems:"center",justifyContent:"center"},
  hiddenCoinText:{fontFamily:fonts.bodyBold,fontSize:10,letterSpacing:1.6},
  toggleRow:{borderWidth:2,minHeight:54,paddingHorizontal:12,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  toggleText:{fontFamily:fonts.black,fontSize:11,letterSpacing:1.2},
  toggleSub:{fontFamily:fonts.body,fontSize:11,lineHeight:16,marginTop:7},
  toggleTrack:{width:48,height:28,borderRadius:14,justifyContent:"center",paddingHorizontal:2},
  toggleKnob:{width:24,height:24,borderRadius:12},
  primary:{minHeight:52,alignItems:"center",justifyContent:"center"},
  primaryText:{fontFamily:fonts.black,fontSize:12,letterSpacing:1.6},
  outline:{minHeight:52,borderWidth:2,alignItems:"center",justifyContent:"center",marginTop:10},
  outlineText:{fontFamily:fonts.black,fontSize:12,letterSpacing:1.6},
});