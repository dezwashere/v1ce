import {useState} from "react";
import {View,Text,TextInput,TouchableOpacity,StyleSheet,Alert} from "react-native";
import {useRouter} from "expo-router";
import {useAuth} from "@/context/AuthContext";
import {supabase} from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useColors} from "@/hooks/useColors";
import {syncV1CEWidget} from "@/lib/widgetSync";
const SUBSTANCES=["Alcohol","Cannabis","Cocaine","Opioids","Meth","Benzodiazepines","Nicotine","Sugar","Gambling","Other"];
function formatUSDate(value:string){const digits=value.replace(/\D/g,"").slice(0,8);if(digits.length<=2)return digits;if(digits.length<=4)return `${digits.slice(0,2)}/${digits.slice(2)}`;return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`}
function toDatabaseDate(value:string){const match=value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return match?`${match[3]}-${match[1]}-${match[2]}`:""}
export default function Onboarding(){
 const[step,setStep]=useState(0),[name,setName]=useState(""),[email,setEmail]=useState(""),[date,setDate]=useState(""),[subs,setSubs]=useState<string[]>([]);
 const router=useRouter(),{user,setProfile}=useAuth(),colors=useColors();
 const save=async()=>{const sobrietyDate=toDatabaseDate(date);if(!sobrietyDate){Alert.alert("Invalid date","Please enter your V1CE date as MM/DD/YYYY.");return}if(!user?.id){Alert.alert("V1CE","Your session is still initializing. Please try again.");return}
  const profile={id:user.id,email,display_name:name,sobriety_date:sobrietyDate,substances:subs,coin_color:"#F5D680",coin_shape:"circle",number_style:"classic",coin_show_border:true,coin_border_color:"",coin_number_color:"",coin_photo:"",coin_image_only:false,coin_motto:"",avatar_url:"",gifted_count:0,is_premium:false,coin_balance:0};
  const{data,error}=await supabase.from("profiles").insert(profile).select().single();if(error){Alert.alert("Error",error.message);return}await AsyncStorage.setItem("v1ce_email",email);setProfile(data);router.replace("/(tabs)")};
 const toggle=(s:string)=>setSubs(x=>x.includes(s)?x.filter(v=>v!==s):[...x,s]);
 return <View style={[styles.container,{backgroundColor:colors.background}]}><Text style={[styles.step,{color:colors.gold}]}>STEP {step+1} / 4</Text>
 {step===0&&<><Text style={[styles.title,{color:colors.foreground}]}>WELCOME{"\n"}TO V1CE</Text><TextInput style={[styles.input,{color:colors.foreground,borderColor:colors.foreground}]} placeholder="your name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName}/><Button label="NEXT" disabled={!name.trim()} onPress={()=>setStep(1)} colors={colors}/></>}
 {step===1&&<><Text style={[styles.title,{color:colors.foreground}]}>YOUR{"\n"}EMAIL</Text><TextInput style={[styles.input,{color:colors.foreground,borderColor:colors.foreground}]} placeholder="your@email.com" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail}/><Button label="NEXT" disabled={!email.includes("@")} onPress={()=>setStep(2)} colors={colors}/></>}
 {step===2&&<><Text style={[styles.title,{color:colors.foreground}]}>WHEN DID{"\n"}YOU START?</Text><TextInput style={[styles.input,{color:colors.foreground,borderColor:colors.foreground}]} placeholder="MM/DD/YYYY" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad" value={date} onChangeText={value=>setDate(formatUSDate(value))} maxLength={10}/><Button label="NEXT" disabled={!/^\d{2}\/\d{2}\/\d{4}$/.test(date)} onPress={()=>setStep(3)} colors={colors}/></>}
 {step===3&&<><Text style={[styles.title,{color:colors.foreground}]}>WHAT ARE{"\n"}YOU QUITTING?</Text><View style={styles.wrap}>{SUBSTANCES.map(s=><TouchableOpacity key={s} onPress={()=>toggle(s)} style={[styles.chip,{borderColor:colors.foreground,backgroundColor:subs.includes(s)?colors.foreground:"transparent"}]}><Text style={{color:subs.includes(s)?colors.background:colors.foreground}}>{s}</Text></TouchableOpacity>)}</View><Button label="DONE" onPress={save} colors={colors}/></>}
 </View>}
function Button({label,onPress,disabled,colors}:{label:string;onPress:()=>void;disabled?:boolean;colors:any}){return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button,{backgroundColor:colors.foreground,opacity:disabled?.3:1}]}><Text style={{color:colors.background,fontWeight:"700",fontSize:18}}>{label}</Text></TouchableOpacity>}
const styles=StyleSheet.create({container:{flex:1,padding:24,paddingTop:80},step:{fontWeight:"700",letterSpacing:2,marginBottom:24},title:{fontSize:44,fontWeight:"700",lineHeight:48,marginBottom:32},input:{borderWidth:2,padding:14,fontSize:18,marginBottom:20},button:{height:56,alignItems:"center",justifyContent:"center",marginTop:"auto"},wrap:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{paddingHorizontal:14,paddingVertical:10,borderWidth:2}});
