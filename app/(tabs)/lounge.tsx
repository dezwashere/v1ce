import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { supabase, TABLES, type FriendConnection, type LoungeChatMessage } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import LofiAvatar from "@/components/lounge/LofiAvatar";
import CoinPreview from "@/components/lounge/CoinPreview";
import BirthdayCard from "@/components/birthday/BirthdayCard";
import BirthdayTag from "@/components/birthday/BirthdayTag";

const DEMO=[["Mia",327],["Jordan",118],["Sam",42],["Alex",276],["Taylor",19],["Casey",203]] as const;
const EGG_RESPONSES=["YES.","NO.","NOT TODAY.","GIVE IT TIME.","DO IT.","DON'T DO IT.","WAIT.","TRUST YOURSELF.","YOU ALREADY KNOW.","ASK AGAIN LATER.","SLEEP ON IT.","KEEP GOING.","LET IT GO.","LEAVE IT ALONE.","TAKE THE RISK.","NOT WORTH IT.","ONE THING AT A TIME.","TRY AGAIN TOMORROW.","CALL SOMEONE.","GO OUTSIDE.","STAY HOME.","BE PATIENT.","START SMALL.","STOP OVERTHINKING IT.","MAYBE.","ABSOLUTELY.","PROBABLY NOT.","WRONG QUESTION.","THE TIMING IS OFF.","THE TIMING IS RIGHT.","EAT TACO BELL.","EAT TACO TIME.","PLAY A VIDEO GAME.","SCREAM."];
const SERIOUS=/suicid|kill myself|hurt myself|overdose|emergency|chest pain|can't breathe|cant breathe|poison|bleeding heavily/i;

export default function Lounge(){
 const router=useRouter(); const colors=useColors(); const {user,profile}=useAuth();
 const [message,setMessage]=useState(""); const [messages,setMessages]=useState<LoungeChatMessage[]>([]); const [friends,setFriends]=useState<FriendConnection[]>([]); const [sending,setSending]=useState(false);
 const [preview,setPreview]=useState<{name:string;days:number}|null>(null); const [birthdayOpen,setBirthdayOpen]=useState(false); const [birthdayName,setBirthdayName]=useState("");
 const [eggQuestion,setEggQuestion]=useState(""); const [eggAnswer,setEggAnswer]=useState("");

 const load=useCallback(async()=>{if(!user?.id)return;const [{data:friendData,error:friendError},{data:messageData,error:messageError}]=await Promise.all([supabase.rpc("get_my_friend_connections"),supabase.rpc("get_lounge_messages")]);if(friendError)Alert.alert("V1CE",friendError.message);else setFriends(((friendData||[]) as FriendConnection[]).filter(f=>f.status==="accepted"));if(messageError)Alert.alert("V1CE",messageError.message);else setMessages((messageData||[]) as LoungeChatMessage[]);},[user?.id]);
 useEffect(()=>{load();const channel=user?.id?supabase.channel("v1ce-lounge").on("postgres_changes",{event:"INSERT",schema:"public",table:TABLES.LoungeChatMessage},()=>load()).subscribe():null;return()=>{if(channel)supabase.removeChannel(channel);};},[load,user?.id]);
 const send=async()=>{const body=message.trim();if(!body||!user?.id||sending)return;setSending(true);const {error}=await supabase.from(TABLES.LoungeChatMessage).insert({sender_id:user.id,body,sender_name:profile?.display_name||"You"});if(error)Alert.alert("V1CE",error.message);else setMessage("");setSending(false);if(!error)load();};
 const askEgg=()=>{const q=eggQuestion.trim();if(!q)return;setEggAnswer(SERIOUS.test(q)?"I DON'T KNOW.":EGG_RESPONSES[Math.floor(Math.random()*EGG_RESPONSES.length)]);};
 const isBirthday=profile?.birthday&&new Date(profile.birthday).getMonth()===new Date().getMonth()&&new Date(profile.birthday).getDate()===new Date().getDate();
 const friendName=(f:FriendConnection)=>f.requester_id===user?.id?f.recipient_name||f.recipient_email||"Friend":f.requester_name||f.requester_email||"Friend";
 const visibleFriends=useMemo(()=>__DEV__?DEMO.map(([name,days])=>({id:name,name,days})):friends.slice(0,6).map((f)=>({id:f.id,name:friendName(f),days:1})),[friends,user?.id]);

 return <KeyboardAvoidingView style={{flex:1,backgroundColor:colors.background}} behavior={Platform.OS==="ios"?"padding":"height"} keyboardVerticalOffset={96}>
  <ScrollView style={{backgroundColor:colors.background}} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
   <Text style={[styles.title,{color:colors.foreground}]}>LOUNGE</Text>
   <Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Your people, your space.</Text>
   {isBirthday?<TouchableOpacity onPress={()=>setBirthdayOpen(true)} style={[styles.bday,{borderColor:colors.foreground}]}><BirthdayTag/><Text style={[styles.bold,{color:colors.foreground}]}>It's your birthday in the lounge.</Text></TouchableOpacity>:null}

   <View style={styles.sectionHead}><Text style={[styles.section,{color:colors.foreground}]}>FRIENDS ({visibleFriends.length})</Text><TouchableOpacity onPress={()=>router.push("/friends")} style={[styles.addBtn,{backgroundColor:colors.foreground}]}><Text style={[styles.addText,{color:colors.background}]}>ADD FRIEND +</Text></TouchableOpacity></View>
   <View style={styles.grid}>{visibleFriends.map((f,index)=><TouchableOpacity key={f.id} onPress={()=>index===0&&__DEV__?(setBirthdayName(f.name),setBirthdayOpen(true)):setPreview({name:f.name,days:f.days})} style={[styles.friendCard,{borderColor:colors.border}]}>
    <LofiAvatar seed={f.name} size={66}/><Text style={[styles.friendName,{color:colors.foreground}]}>{f.name}</Text><Text style={[styles.friendDays,{color:colors.mutedForeground}]}>{f.days} days</Text>{index===0&&__DEV__?<BirthdayTag/>:null}
   </TouchableOpacity>)}</View>

   <Text style={[styles.section,{color:colors.foreground}]}>LOUNGE CHAT</Text>
   <View style={[styles.chat,{borderColor:colors.border}]}>
    {__DEV__?[["Jordan","Checking in. Hope everybody is having a good day."],["Mia","Feeling grateful today. Another day, another chance."],["Sam","One day at a time."]].map(([n,b])=><View key={n} style={styles.message}><LofiAvatar seed={n} size={30}/><Text style={[styles.messageText,{color:colors.foreground}]}><Text style={styles.bold}>{n}: </Text>{b}</Text></View>):messages.map(m=><View key={m.id} style={styles.message}><LofiAvatar seed={m.display_name||m.sender_name||"F"} size={30}/><Text style={[styles.messageText,{color:colors.foreground}]}><Text style={styles.bold}>{m.sender_id===user?.id?"You":m.display_name||m.sender_name||"Friend"}: </Text>{m.body||m.message}</Text></View>)}
   </View>
   {user?.id?<View style={styles.composer}><TextInput value={message} onChangeText={setMessage} maxLength={500} placeholder="Say something..." placeholderTextColor={colors.mutedForeground} style={[styles.input,{color:colors.foreground,borderColor:colors.border}]}/><TouchableOpacity disabled={sending} onPress={send} style={[styles.send,{backgroundColor:colors.foreground}]}><Text style={[styles.bold,{color:colors.background}]}>SEND</Text></TouchableOpacity></View>:null}

   <View style={[styles.eggCard,{borderColor:colors.foreground}]}>
    <Text style={[styles.eggTitle,{color:colors.foreground}]}>ASK THE MAGIC EGG</Text>
    <Text style={[styles.eggSub,{color:colors.mutedForeground}]}>A little perspective when you need it.</Text>
    <TextInput value={eggQuestion} onChangeText={setEggQuestion} placeholder="Ask a question..." placeholderTextColor={colors.mutedForeground} style={[styles.eggInput,{borderColor:colors.border,color:colors.foreground}]}/>
    <View style={[styles.egg,{borderColor:colors.foreground}]}>
      <View style={[styles.eggSlash,{backgroundColor:colors.foreground,transform:[{rotate:"-24deg"}]}]}/>
      <View style={[styles.eggSlash2,{backgroundColor:colors.foreground,transform:[{rotate:"27deg"}]}]}/>
      {eggAnswer?<Text style={[styles.eggAnswer,{color:colors.foreground}]}>{eggAnswer}</Text>:null}
    </View>
    <TouchableOpacity onPress={askEgg} style={[styles.eggBtn,{backgroundColor:colors.foreground}]}><Text style={[styles.eggBtnText,{color:colors.background}]}>{eggAnswer?"TAP AGAIN":"ASK THE EGG"}</Text></TouchableOpacity>
   </View>

   <CoinPreview visible={!!preview} onClose={()=>setPreview(null)} name={preview?.name||""} days={preview?.days||0}/>
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
 egg:{width:190,height:240,borderWidth:3,borderRadius:95,alignSelf:"center",marginVertical:22,overflow:"hidden",alignItems:"center",justifyContent:"center"},
 eggSlash:{position:"absolute",width:250,height:28},
 eggSlash2:{position:"absolute",width:250,height:18},
 eggAnswer:{fontFamily:fonts.black,fontSize:20,letterSpacing:2,textAlign:"center",paddingHorizontal:24,backgroundColor:"rgba(255,255,255,.86)"},
 eggBtn:{minHeight:50,alignItems:"center",justifyContent:"center"},
 eggBtnText:{fontFamily:fonts.black,fontSize:12,letterSpacing:1.8},
});