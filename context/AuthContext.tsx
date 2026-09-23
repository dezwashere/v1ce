import React,{createContext,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {supabase,type SobrietyProfile} from "@/lib/supabase";
import { syncV1CEWidget } from "@/lib/widgetSync";
type User={email:string;id:string};
type AuthContextType={user:User|null;profile:SobrietyProfile|null;isLoading:boolean;setProfile:(p:SobrietyProfile|null)=>void;signOut:()=>Promise<void>;refreshProfile:()=>Promise<void>};
const AuthContext=createContext<AuthContextType>({user:null,profile:null,isLoading:true,setProfile:()=>{},signOut:async()=>{},refreshProfile:async()=>{}});
export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[profile,setProfile]=useState<SobrietyProfile|null>(null),[isLoading,setIsLoading]=useState(true);
 const loadProfile=async(userId:string)=>{
  try{
   const{data}=await supabase.from("profiles").select("*").eq("id",userId).maybeSingle();
   setProfile(data as SobrietyProfile|null);
   if(data) void syncV1CEWidget(data as SobrietyProfile).catch(()=>{});
  }catch{setProfile(null)}
 };
 const refreshProfile=async()=>{if(user?.id)await loadProfile(user.id)};
 useEffect(()=>{
  let mounted=true;
  const initialize=async()=>{
   try{
    let{data:{session}}=await supabase.auth.getSession();
    const storedEmail=await AsyncStorage.getItem("v1ce_email");
    if(!session){
     const{data,error}=await supabase.auth.signInAnonymously();
     if(!error)session=data.session;
    }
    if(!mounted)return;
    const email=storedEmail||"";
    if(session?.user?.id)setUser({email,id:session.user.id}),await loadProfile(session.user.id);
    else if(storedEmail)setUser({email,id:storedEmail});
   }catch{}finally{if(mounted)setIsLoading(false)}
  };
  initialize();
  const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
   if(!mounted||!session?.user?.id)return;
   void (async()=>{
    try{
     const storedEmail=await AsyncStorage.getItem("v1ce_email");
     if(!mounted)return;
     setUser({email:storedEmail||"",id:session.user.id});
     await loadProfile(session.user.id);
    }catch{}
   })();
  });
  return()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 const signOut=async()=>{await supabase.auth.signOut();await AsyncStorage.removeItem("v1ce_email");setUser(null);setProfile(null)};
 const value=useMemo(()=>({user,profile,isLoading,setProfile,signOut,refreshProfile}),[user,profile,isLoading]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}