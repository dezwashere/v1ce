import React,{useEffect,useState} from "react";
import {Alert,Image,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {Feather} from "@expo/vector-icons";
import {useAuth} from "@/context/AuthContext";
import {supabase,TABLES} from "@/lib/supabase";
import {useColors} from "@/hooks/useColors";
import {fonts} from "@/constants/typography";
import {daysSince} from "@/constants/app";
import SobrietyCoin from "@/components/coin/SobrietyCoin";
import LofiAvatar from "@/components/lounge/LofiAvatar";
import {useTranslation} from "@/lib/i18n";

const AVATARS=["MIA","CROSS","LEAF","JORDAN","PINK","DOTS","TAYLOR","CASEY"];
const STATUS_MAX=100;
const QUOTE_MAX=90;

export default function ProfileScreen(){
  const {profile,user,setProfile}=useAuth();
  const colors=useColors();
  const {t}=useTranslation();
  const [status,setStatus]=useState(profile?.status_note||"");
  const [quote,setQuote]=useState(profile?.personal_quote||"");
  const [avatarSeed,setAvatarSeed]=useState(profile?.default_avatar_seed||"MIA");
  const [avatarUrl,setAvatarUrl]=useState(profile?.avatar_url||"");
  const [showCoin,setShowCoin]=useState(profile?.show_coin??true);
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState(false);

  useEffect(()=>{if(!profile)return;setStatus(profile.status_note||"");setQuote(profile.personal_quote||"");setAvatarSeed(profile.default_avatar_seed||"MIA");setAvatarUrl(profile.avatar_url||"");setShowCoin(profile.show_coin??true);},[profile?.id]);
  if(!profile)return <View style={{flex:1,backgroundColor:colors.background}}/>;

  const pickAvatar=async()=>{
    if(!user?.id)return;
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted)return Alert.alert("V1CE",t("profile.photoPermission"));
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsEditing:true,aspect:[1,1],quality:.85});
    if(result.canceled||!result.assets[0])return;
    setUploading(true);
    try{
      const asset=result.assets[0];
      const response=await fetch(asset.uri);
      const body=await response.arrayBuffer();
      const extension=(asset.fileName?.split(".").pop()||asset.mimeType?.split("/").pop()||"jpg").toLowerCase();
      const path=user.id+"/"+Date.now()+"."+extension;
      const {error:uploadError}=await supabase.storage.from("avatars").upload(path,body,{contentType:asset.mimeType||"image/jpeg",upsert:false});
      if(uploadError)throw uploadError;
      const {data}=supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    }catch(error:any){Alert.alert("V1CE",error?.message||t("profile.uploadError"));}
    finally{setUploading(false);}
  };

  const save=async()=>{
    if(saving||!profile.id)return;
    setSaving(true);
    const values={personal_quote:quote.trim().slice(0,QUOTE_MAX),status_note:status.trim(),default_avatar_seed:avatarSeed,show_coin:showCoin,avatar_url:avatarUrl||null};
    const {data,error}=await supabase.from(TABLES.SobrietyProfile).update(values).eq("id",profile.id).select().single();
    if(error)Alert.alert("V1CE",error.message);else if(data)setProfile(data);
    setSaving(false);
  };

  const days=daysSince(profile.sobriety_date);
  return <ScrollView style={{backgroundColor:colors.background}} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={[styles.title,{color:colors.foreground}]}>{t("profile.editTitle")}</Text>

    <View style={styles.avatarHero}>
      {avatarUrl?<Image source={{uri:avatarUrl}} style={styles.avatarImage}/>:<LofiAvatar seed={avatarSeed} size={150}/>}
      <TouchableOpacity onPress={pickAvatar} style={[styles.camera,{backgroundColor:colors.foreground,borderColor:colors.background}]}>
        <Feather name="camera" size={20} color={colors.background}/>
      </TouchableOpacity>
    </View>

    <TouchableOpacity onPress={pickAvatar} disabled={uploading} style={[styles.actionRow,{borderColor:colors.border}]}>
      <Feather name="image" size={20} color={colors.foreground}/>
      <Text style={[styles.actionText,{color:colors.foreground}]}>{uploading?t("profile.uploading"):t("profile.uploadPhoto")}</Text>
      <Feather name="chevron-right" size={20} color={colors.foreground}/>
    </TouchableOpacity>

    <Text style={[styles.sectionLabel,{color:colors.foreground}]}>{t("profile.defaultPictures")}</Text>
    <View style={styles.avatarGrid}>
      {AVATARS.map(a=><TouchableOpacity key={a} onPress={()=>{setAvatarSeed(a);setAvatarUrl("");}} style={[styles.avatarChoice,{borderColor:avatarSeed===a&&!avatarUrl?colors.foreground:"transparent"}]}>
        <LofiAvatar seed={a} size={58}/>
      </TouchableOpacity>)}
    </View>

    <Text style={[styles.sectionLabel,{color:colors.foreground,marginTop:22}]}>{t("profile.statusNote")}</Text>
    <View style={[styles.statusBox,{borderColor:colors.border}]}>
      <TextInput value={status} onChangeText={v=>setStatus(v.slice(0,STATUS_MAX))} maxLength={STATUS_MAX} multiline placeholder={t("profile.statusPlaceholder")} placeholderTextColor={colors.mutedForeground} style={[styles.statusInput,{color:colors.foreground}]}/>
      <Text style={[styles.counter,{color:colors.mutedForeground}]}>{status.length}/{STATUS_MAX}</Text>
    </View>

    <Text style={[styles.sectionLabel,{color:colors.foreground,marginTop:22}]}>Personal quote</Text>
    <View style={[styles.statusBox,{borderColor:colors.border}]}>
      <TextInput value={quote} onChangeText={v=>setQuote(v.slice(0,QUOTE_MAX))} maxLength={QUOTE_MAX} multiline placeholder="Your quote for the medium widget" placeholderTextColor={colors.mutedForeground} style={[styles.statusInput,{color:colors.foreground}]}/>
      <Text style={[styles.counter,{color:colors.mutedForeground}]}>{quote.length}/{QUOTE_MAX}</Text>
    </View>

    <View style={[styles.coinToggleCard,{borderColor:colors.border}]}>
      <View style={{flex:1,paddingRight:12}}>
        <Text style={[styles.toggleTitle,{color:colors.foreground}]}>{t("profile.showCoin")}</Text>
        <Text style={[styles.toggleBody,{color:colors.mutedForeground}]}>{t("profile.showCoinHelp")}</Text>
      </View>
      <TouchableOpacity onPress={()=>setShowCoin(v=>!v)} style={[styles.toggleTrack,{backgroundColor:showCoin?colors.foreground:colors.secondary}]}>
        <View style={[styles.toggleKnob,{backgroundColor:colors.background,transform:[{translateX:showCoin?24:2}]}]}/>
      </TouchableOpacity>
    </View>

    <View style={[styles.previewCard,{backgroundColor:colors.secondary}]}>
      {showCoin?<SobrietyCoin days={days} shape={profile.coin_shape||"circle"} color={profile.coin_color||"#F5D680"} numberStyle={profile.number_style||"classic"} size={112} displayName={profile.display_name||""} motto={(profile.coin_motto||"FREE FROM").slice(0,18)} backIcon={profile.coin_back_icon||"none"} substances={profile.substances||[]} showBorder={profile.coin_show_border??true} borderColor={profile.coin_border_color||undefined} numberColor={profile.coin_number_color||undefined}/>:<View style={styles.hiddenCoin}><Text style={[styles.hiddenText,{color:colors.mutedForeground}]}>{t("profile.coinHidden")}</Text></View>}
      <View style={styles.previewCopy}>
        <Text style={[styles.previewQuote,{color:colors.foreground}]}>{status.trim()?"“"+status.trim()+"”":`“${t("profile.statusPlaceholder")}”`}</Text>
        <Text style={[styles.previewHelp,{color:colors.mutedForeground}]}>{t("profile.previewHelp")}</Text>
      </View>
    </View>

    <TouchableOpacity onPress={save} disabled={saving} style={[styles.save,{backgroundColor:colors.foreground,opacity:saving?.55:1}]}>
      <Text style={[styles.saveText,{color:colors.background}]}>{saving?t("profile.saving"):t("profile.saveShort")}</Text>
    </TouchableOpacity>
  </ScrollView>;
}

const styles=StyleSheet.create({
  page:{paddingHorizontal:20,paddingTop:24,paddingBottom:48},
  title:{fontFamily:fonts.black,fontSize:24,lineHeight:30,textAlign:"center",letterSpacing:.4,marginBottom:24},
  avatarHero:{alignSelf:"center",position:"relative",marginBottom:20},
  avatarImage:{width:150,height:150,borderRadius:75},
  camera:{position:"absolute",right:-2,bottom:2,width:48,height:48,borderRadius:24,borderWidth:4,alignItems:"center",justifyContent:"center"},
  actionRow:{height:58,borderWidth:1,borderRadius:14,flexDirection:"row",alignItems:"center",gap:14,paddingHorizontal:16,marginBottom:10},
  actionText:{fontFamily:fonts.bodyMedium,fontSize:16,flex:1},
  sectionLabel:{fontFamily:fonts.bodySemi,fontSize:14,marginTop:10,marginBottom:10},
  avatarGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},
  avatarChoice:{width:68,height:68,borderRadius:34,borderWidth:2,alignItems:"center",justifyContent:"center"},
  statusBox:{borderWidth:1,borderRadius:14,minHeight:105,padding:14,paddingBottom:26},
  statusInput:{fontFamily:fonts.body,fontSize:15,lineHeight:21,minHeight:62,textAlignVertical:"top",padding:0},
  counter:{position:"absolute",right:12,bottom:8,fontFamily:fonts.body,fontSize:11},
  coinToggleCard:{borderWidth:1,borderRadius:14,minHeight:100,padding:14,marginTop:12,flexDirection:"row",alignItems:"center"},
  toggleTitle:{fontFamily:fonts.bodySemi,fontSize:15},
  toggleBody:{fontFamily:fonts.body,fontSize:11,lineHeight:16,marginTop:5},
  toggleTrack:{width:54,height:30,borderRadius:15,justifyContent:"center",paddingHorizontal:2},
  toggleKnob:{width:26,height:26,borderRadius:13},
  previewCard:{borderRadius:14,minHeight:146,padding:14,marginTop:12,flexDirection:"row",alignItems:"center",gap:14},
  previewCopy:{flex:1},
  previewQuote:{fontFamily:fonts.bodySemi,fontSize:19,lineHeight:24},
  previewHelp:{fontFamily:fonts.body,fontSize:11,lineHeight:16,marginTop:10},
  hiddenCoin:{width:112,height:112,borderRadius:56,alignItems:"center",justifyContent:"center"},
  hiddenText:{fontFamily:fonts.bodyBold,fontSize:9,letterSpacing:1},
  save:{height:54,borderRadius:14,alignItems:"center",justifyContent:"center",marginTop:12},
  saveText:{fontFamily:fonts.black,fontSize:15,letterSpacing:1.2},
});
