import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { supabase, TABLES, type FriendConnection, type LoungeChatMessage } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { useTranslation } from "@/lib/i18n";
import LofiAvatar from "@/components/lounge/LofiAvatar";
import CoinPreview from "@/components/lounge/CoinPreview";
import BirthdayCard from "@/components/birthday/BirthdayCard";
import BirthdayTag from "@/components/birthday/BirthdayTag";
import { LOUNGE_PREVIEW_CHAT, LOUNGE_PREVIEW_ENABLED, LOUNGE_PREVIEW_FRIENDS } from "@/lib/loungePreviewData";

const EGG_RESPONSES=["YES","NO","NOT TODAY","GIVE IT TIME","DO IT","DON'T DO IT","WAIT","TRUST YOURSELF","YOU ALREADY KNOW","ASK AGAIN LATER","SLEEP ON IT","KEEP GOING","LET IT GO","LEAVE IT ALONE","TAKE THE RISK","NOT WORTH IT","ONE THING AT A TIME","TRY AGAIN TOMORROW","CALL SOMEONE","GO OUTSIDE","STAY HOME","BE PATIENT","START SMALL","STOP OVERTHINKING IT","MAYBE","ABSOLUTELY","PROBABLY NOT","WRONG QUESTION","THE TIMING IS OFF","THE TIMING IS RIGHT","EAT TACO BELL","EAT TACO TIME","PLAY A VIDEO GAME","SCREAM"];
const SERIOUS=/suicid|kill myself|hurt myself|overdose|emergency|chest pain|can't breathe|cant breathe|poison|bleeding heavily/i;

export default function Lounge(){
 const router=useRouter(); const colors=useColors(); const {user,profile}=useAuth(); const {t}=useTranslation();
 const [message,setMessage]=useState(""); const [messages,setMessages]=useState<LoungeChatMessage[]>([]); const [friends,setFriends]=useState<FriendConnection[]>([]); const [previewMessages,setPreviewMessages]=useState(LOUNGE_PREVIEW_CHAT); const [sending,setSending]=useState(false);
 const [preview,setPreview]=useState<{name:string;days:number;status?:string;avatarSeed?:string;shape?:string;color?:string;motto?:string;birthday?:boolean;showCoin?:boolean}|null>(null); const [birthdayOpen,setBirthdayOpen]=useState(false); const [birthdayName,setBirthdayName]=useState("");
 const [eggQuestion,setEggQuestion]=useState(""); const [eggAnswer,setEggAnswer]=useState("");
 const eggShake=useRef(new Animated.Value(0)).current;

 const load=useCallback(async()=>{if(!user?.id)return;const [{data:friendData,error:friendError},{data:messageData,error:messageError}]=await Promise.all([supabase.rpc("get_my_friend_connections"),supabase.rpc("get_lounge_messages")]);if(friendError)Alert.alert("V1CE",friendError.message);else setFriends(((friendData||[]) as FriendConnection[]).filter(f=>f.status==="accepted"));if(messageError)Alert.alert("V1CE",messageError.message);else setMessages((messageData||[]) as LoungeChatMessage[]);},[user?.id]);
 useEffect(()=>{load();const channel=user?.id?supabase.channel("v1ce-lounge").on("postgres_changes",{event:"INSERT",schema:"public",table:TABLES.LoungeChatMessage},()=>load()).subscribe():null;return()=>{if(channel)supabase.removeChannel(channel);};},[load,user?.id]);
 const send=async()=>{const body=message.trim();if(!body||sending)return;if(LOUNGE_PREVIEW_ENABLED){setPreviewMessages(current=>[...current,{id:`preview-${Date.now()}`,name:"You",body,avatarSeed:"MIA"}]);setMessage("");return;}if(!user?.id)return;setSending(true);const {error}=await supabase.from(TABLES.LoungeChatMessage).insert({sender_id:user.id,body});if(error)Alert.alert("V1CE",error.message);else setMessage("");setSending(false);if(!error)load();};
 const askEgg=()=>{const q=eggQuestion.trim();if(!q)return;const answer=SERIOUS.test(q)?"I DON'T KNOW":EGG_RESPONSES[Math.floor(Math.random()*EGG_RESPONSES.length)];setEggAnswer("");Animated.sequence([Animated.timing(eggShake,{toValue:-1,duration:70,useNativeDriver:true}),Animated.timing(eggShake,{toValue:1,duration:90,useNativeDriver:true}),Animated.timing(eggShake,{toValue:-1,duration:90,useNativeDriver:true}),Animated.timing(eggShake,{toValue:1,duration:90,useNativeDriver:true}),Animated.timing(eggShake,{toValue:0,duration:70,useNativeDriver:true})]).start(()=>setEggAnswer(answer));};
 const isBirthday=profile?.birthday&&new Date(profile.birthday).getMonth()===new Date().getMonth()&&new Date(profile.birthday).getDate()===new Date().getDate();
 const friendName=(f:FriendConnection)=>f.requester_id===user?.id?f.recipient_name||f.recipient_email||"Friend":f.requester_name||f.requester_email||"Friend";
 const visibleFriends=useMemo(()=>LOUNGE_PREVIEW_ENABLED?LOUNGE_PREVIEW_FRIENDS:friends.slice(0,6).map((f)=>({id:f.id,name:friendName(f),days:1,birthday:false,status:"",avatarSeed:friendName(f),shape:"circle",color:"#F5D680",motto:"FREE FROM",showCoin:true})),[friends,user?.id]);

 return <KeyboardAvoidingView style={{flex:1,backgroundColor:colors.background}} behavior={Platform.OS==="ios"?"padding":"height"} keyboardVerticalOffset={96}>
  <ScrollView style={{backgroundColor:colors.background}} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
   <Text style={[styles.title,{color:colors.foreground}]}>{t("lounge.screenTitle")}</Text>
   <Text style={[styles.subtitle,{color:colors.mutedForeground}]}>{t("lounge.screenSubtitle")}</Text>
   {isBirthday?<TouchableOpacity onPress={()=>setBirthdayOpen(true)} style={[styles.bday,{borderColor:colors.foreground}]}><BirthdayTag/><Text style={[styles.bold,{color:colors.foreground}]}>{t("birthday.selfBanner")}</Text></TouchableOpacity>:null}

   <View style={styles.sectionHead}><Text style={[styles.section,{color:colors.foreground}]}>{t("lounge.friends")} ({visibleFriends.length})</Text><TouchableOpacity onPress={()=>router.push("/friends")} style={[styles.addBtn,{backgroundColor:colors.foreground}]}><Text style={[styles.addText,{color:colors.background}]}>{t("lounge.addFriend")} +</Text></TouchableOpacity></View>
   <View style={styles.grid}>{visibleFriends.map((f)=><TouchableOpacity key={f.id} onPress={()=>setPreview({name:f.name,days:f.days,status:f.status,avatarSeed:f.avatarSeed,shape:f.shape,color:f.color,motto:f.motto,birthday:f.birthday,showCoin:f.showCoin})} style={[styles.friendCard,{borderColor:colors.border}]}>
    <LofiAvatar seed={f.avatarSeed||f.name} size={66}/><Text style={[styles.friendName,{color:colors.foreground}]}>{f.name}</Text><Text style={[styles.friendDays,{color:colors.mutedForeground}]}>{f.days} days</Text>{f.birthday?<BirthdayTag/>:null}
   </TouchableOpacity>)}</View>

   <Text style={[styles.section,{color:colors.foreground}]}>{t("lounge.loungeChat")}</Text>
   <View style={[styles.chat,{borderColor:colors.border}]}>
    {LOUNGE_PREVIEW_ENABLED?previewMessages.map(m=><View key={m.id} style={styles.message}><LofiAvatar seed={m.avatarSeed||m.name} size={30}/><Text style={[styles.messageText,{color:colors.foreground}]}><Text style={styles.bold}>{m.name}: </Text>{m.body}</Text></View>):messages.map(m=><View key={m.id} style={styles.message}><LofiAvatar seed={m.display_name||m.sender_name||"F"} size={30}/><Text style={[styles.messageText,{color:colors.foreground}]}><Text style={styles.bold}>{m.sender_id===user?.id?"You":m.display_name||m.sender_name||"Friend"}: </Text>{m.body||m.message}</Text></View>)}
   </View>
   {user?.id?<View style={styles.composer}><TextInput value={message} onChangeText={setMessage} maxLength={500} placeholder={t("lounge.chatPlaceholder")} placeholderTextColor={colors.mutedForeground} style={[styles.input,{color:colors.foreground,borderColor:colors.border}]}/><TouchableOpacity disabled={sending} onPress={send} style={[styles.send,{backgroundColor:colors.foreground}]}><Text style={[styles.bold,{color:colors.background}]}>{t("friends.send")}</Text></TouchableOpacity></View>:null}

   <View style={[styles.eggCard,{borderColor:colors.foreground}]}>
    <Text style={[styles.eggTitle,{color:colors.foreground}]}>{t("lounge.magicEggTitle")}</Text>
    <Text style={[styles.eggSub,{color:colors.mutedForeground}]}>{t("lounge.magicEggSub")}</Text>
    <TextInput value={eggQuestion} onChangeText={setEggQuestion} placeholder={t("lounge.eggPlaceholder")} placeholderTextColor={colors.mutedForeground} style={[styles.eggInput,{borderColor:colors.border,color:colors.foreground}]}/>
    <TouchableOpacity activeOpacity={.85} onPress={askEgg} accessibilityRole="button" accessibilityLabel="Ask the magic egg">
      <Animated.View style={[styles.eggWrap,{transform:[{translateX:eggShake.interpolate({inputRange:[-1,1],outputRange:[-12,12]})},{rotate:eggShake.interpolate({inputRange:[-1,1],outputRange:["-4deg","4deg"]})}]}]}>
        <Svg width={210} height={270} viewBox="0 0 210 270">
          <Path d="M105 8 C67 8 31 65 22 128 C10 211 48 260 105 260 C162 260 200 211 188 128 C179 65 143 8 105 8 Z" fill={colors.background} stroke={colors.foreground} strokeWidth={4}/>
        </Svg>
        <View style={[styles.eggWindow,{backgroundColor:colors.foreground}]}>
          <Text numberOfLines={3} adjustsFontSizeToFit minimumFontScale={.62} allowFontScaling={false} style={[styles.eggAnswer,{color:colors.background}]}>{eggAnswer||"TAP THE EGG"}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
   </View>

   <CoinPreview
     visible={!!preview}
     onClose={()=>setPreview(null)}
     name={preview?.name||""}
     days={preview?.days||0}
     status={preview?.status}
     avatarSeed={preview?.avatarSeed}
     shape={preview?.shape}
     color={preview?.color}
     motto={preview?.motto}
     birthday={preview?.birthday}
     showCoin={preview?.showCoin}
     onBirthday={()=>{if(preview){setBirthdayName(preview.name);setPreview(null);setBirthdayOpen(true);}}}
   />
   <BirthdayCard name={birthdayName||profile?.display_name||"friend"} visible={birthdayOpen} onClose={()=>setBirthdayOpen(false)} onShare={(text)=>{setMessage(text);}}/>
  </ScrollView>
 </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({
 container:{paddingHorizontal:20,paddingTop:28,paddingBottom:56},
 title:{fontSize:64,lineHeight:78,paddingTop:5,fontFamily:fonts.display,letterSpacing:.5},
 subtitle:{fontFamily:fonts.body,fontSize:14},
 bday:{borderWidth:2,padding:12,marginTop:18,flexDirection:"row",gap:10,alignItems:"center"},
 sectionHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:28,marginBottom:12},
 section:{fontSize:18,fontFamily:fonts.black,letterSpacing:2,marginTop:28,marginBottom:12},
 addBtn:{paddingHorizontal:12,paddingVertical:8},
 addText:{fontFamily:fonts.black,fontSize:10,letterSpacing:1},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:10},
 friendCard:{width:"48.5%",borderWidth:1,padding:12,minHeight:145,alignItems:"flex-start"},
 friendName:{fontFamily:fonts.black,fontSize:15,marginTop:8},
 friendDays:{fontFamily:fonts.body,fontSize:11,marginTop:2},
 chat:{borderWidth:1,padding:14,minHeight:100},
 message:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:10},
 messageText:{flex:1,fontFamily:fonts.body,fontSize:13,lineHeight:18},
 bold:{fontFamily:fonts.black},
 composer:{flexDirection:"row",gap:8,marginTop:8},
 input:{flex:1,borderWidth:1,padding:12,fontFamily:fonts.body},
 send:{paddingHorizontal:16,justifyContent:"center"},
 eggCard:{borderWidth:2,padding:16,marginTop:30},
 eggTitle:{fontFamily:fonts.display,fontSize:27,letterSpacing:1},
 eggSub:{fontFamily:fonts.body,fontSize:13,marginTop:4,marginBottom:12},
 eggInput:{borderWidth:1,minHeight:48,paddingHorizontal:12,fontFamily:fonts.body},
 eggWrap:{width:210,height:270,alignSelf:"center",marginVertical:22,alignItems:"center",justifyContent:"center"},
 eggWindow:{position:"absolute",left:34,right:34,height:76,paddingHorizontal:10,paddingVertical:8,alignItems:"center",justifyContent:"center",overflow:"hidden"},
 eggAnswer:{fontFamily:fonts.black,fontSize:18,lineHeight:22,letterSpacing:1.2,textAlign:"center"},
});