import React,{useCallback,useEffect,useState} from "react";
import {Alert,Image,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {useRouter} from "expo-router";
import {useAuth} from "@/context/AuthContext";
import {supabase} from "@/lib/supabase";
import {useColors} from "@/hooks/useColors";

type Friend={id:string;requester_id:string;recipient_id:string;status:string;requester_name:string|null;requester_avatar:string|null;recipient_name:string|null;recipient_avatar:string|null};
type Message={id:string;sender_id:string;body:string;created_at:string;display_name:string|null;avatar_url:string|null};

export default function Lounge(){
 const router=useRouter();
 const c=useColors();const{user,profile}=useAuth();const[message,setMessage]=useState("");const[messages,setMessages]=useState<Message[]>([]);const[friends,setFriends]=useState<Friend[]>([]);const[sending,setSending]=useState(false);

 const load=useCallback(async()=>{
  if(!user?.id)return;
  const[{data:friendData,error:friendError},{data:messageData,error:messageError}]=await Promise.all([supabase.rpc("get_my_friend_connections"),supabase.rpc("get_lounge_messages")]);
  if(friendError)Alert.alert("V1CE",friendError.message);else setFriends(((friendData||[]) as Friend[]).filter(f=>f.status==="accepted"));
  if(messageError)Alert.alert("V1CE",messageError.message);else setMessages((messageData||[]) as Message[]);
 },[user?.id]);

 useEffect(()=>{load();const channel=user?.id?supabase.channel("v1ce-lounge").on("postgres_changes",{event:"INSERT",schema:"public",table:"lounge_messages"},()=>load()).subscribe():null;return()=>{if(channel)supabase.removeChannel(channel)}},[load,user?.id]);

 const send=async()=>{
  const body=message.trim();if(!body||!user?.id||sending)return;
  setSending(true);const{error}=await supabase.from("lounge_messages").insert({sender_id:user.id,body});
  if(error)Alert.alert("V1CE",error.message);else setMessage("");
  setSending(false);if(!error)load();
 };

 const friendName=(f:Friend)=>f.requester_id===user?.id?(f.recipient_name||"Friend"):(f.requester_name||"Friend");
 const friendAvatar=(f:Friend)=>f.requester_id===user?.id?f.recipient_avatar:f.requester_avatar;

 return <ScrollView style={{backgroundColor:c.background}} contentContainerStyle={s.container}>
  <Text style={[s.kicker,{color:c.mutedForeground}]}>THE</Text><Text style={[s.title,{color:c.foreground}]}>LOUNGE.</Text>
  <Text style={{color:c.mutedForeground}}>Connect with friends on their sobriety journey.</Text>
  <Text style={[s.section,{color:c.foreground}]}>FRIENDS</Text>
  {friends.length===0?<Text style={{color:c.mutedForeground}}>No friends yet.</Text>:friends.map(f=><View key={f.id} style={[s.friend,{borderColor:c.border}]}><View style={[s.avatar,{backgroundColor:c.foreground,overflow:"hidden"}]}>{friendAvatar(f)?<Image source={{uri:friendAvatar(f)!}} style={s.avatarImage}/>:<Text style={{color:c.background,fontWeight:"900"}}>{friendName(f)[0].toUpperCase()}</Text>}</View><Text style={{color:c.foreground,fontWeight:"700"}}>{friendName(f)}</Text>{!profile?.is_premium&&friends.indexOf(f)>0&&<Text style={{marginLeft:"auto",color:c.mutedForeground}}>LOCKED</Text>}</View>)}
  <Text style={[s.section,{color:c.foreground}]}>ARCADE</Text><View style={s.arcadeRow}><TouchableOpacity onPress={()=>router.push("/game")} style={[s.gameCard,{borderColor:c.foreground}]}><Text style={[s.gameTitle,{color:c.foreground}]}>SOBRIETY RUN</Text><Text style={{color:c.mutedForeground,fontSize:10,marginTop:4}}>12 LEVELS · BOSS FIGHT</Text><Text style={{color:c.foreground,fontWeight:"900",marginTop:10}}>PLAY →</Text></TouchableOpacity><TouchableOpacity onPress={()=>router.push("/game")} style={[s.gameCard,{borderColor:c.foreground}]}><Text style={[s.gameTitle,{color:c.foreground}]}>JAYWALKER</Text><Text style={{color:c.mutedForeground,fontSize:10,marginTop:4}}>SNAKE · POWER-UPS</Text><Text style={{color:c.foreground,fontWeight:"900",marginTop:10}}>PLAY →</Text></TouchableOpacity></View>
  <Text style={[s.section,{color:c.foreground}]}>LOUNGE CHAT</Text>
  <View style={[s.chat,{borderColor:c.border}]}>{profile?.is_premium?messages.map(m=><View key={m.id} style={s.message}><View style={[s.messageAvatar,{backgroundColor:c.foreground,overflow:"hidden"}]}>{m.avatar_url?<Image source={{uri:m.avatar_url}} style={s.messageAvatarImage}/>:<Text style={{color:c.background,fontWeight:"900"}}>{(m.display_name||"F")[0].toUpperCase()}</Text>}</View><Text style={{color:c.foreground,flex:1}}><Text style={{fontWeight:"900"}}>{m.sender_id===user?.id?"You":m.display_name||"Friend"}: </Text>{m.body}</Text></View>):<View style={s.locked}><Text style={{color:c.mutedForeground}}>Lounge Chat is a Premium feature.</Text><TouchableOpacity onPress={()=>router.push("/(tabs)/premium")}><Text style={{color:c.foreground,fontWeight:"900",letterSpacing:1}}>UNLOCK PREMIUM →</Text></TouchableOpacity></View>}</View>{profile?.is_premium&&<View style={s.composer}><TextInput value={message} onChangeText={setMessage} maxLength={500} placeholder="Say something..." placeholderTextColor={c.mutedForeground} style={[s.input,{color:c.foreground,borderColor:c.border}]}/><TouchableOpacity disabled={sending} onPress={send} style={[s.send,{backgroundColor:c.foreground}]}><Text style={{color:c.background,fontWeight:"800"}}>SEND</Text></TouchableOpacity></View>}
 </ScrollView>
}

const s=StyleSheet.create({container:{padding:20,paddingTop:55,paddingBottom:90},kicker:{fontSize:12,letterSpacing:5,fontWeight:"700"},title:{fontSize:52,fontWeight:"900",lineHeight:54},section:{fontSize:18,fontWeight:"900",letterSpacing:2,marginTop:28,marginBottom:12},friend:{height:52,borderWidth:1,flexDirection:"row",alignItems:"center",padding:8,marginBottom:6,gap:10},avatar:{width:34,height:34,alignItems:"center",justifyContent:"center"},avatarImage:{width:34,height:34},locked:{padding:18,alignItems:"center",gap:12},switch:{flexDirection:"row",gap:8},tab:{flex:1,borderWidth:2,padding:12,alignItems:"center"},chat:{borderWidth:1,padding:14,minHeight:100},arcadeRow:{flexDirection:"row",gap:8},gameCard:{flex:1,borderWidth:2,padding:12,minHeight:120},gameTitle:{fontSize:14,fontWeight:"900",letterSpacing:1},message:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:8},messageAvatar:{width:28,height:28,alignItems:"center",justifyContent:"center"},messageAvatarImage:{width:28,height:28},composer:{flexDirection:"row",gap:8,marginTop:8},input:{flex:1,borderWidth:1,padding:12},send:{paddingHorizontal:16,justifyContent:"center"}});
