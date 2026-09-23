import React,{createContext,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {supabase,type SobrietyProfile} from "@/lib/supabase";
type User={email:string;id:string};
type AuthContextType={user:User|null;profile:SobrietyProfile|null;isLoading:boolean;setProfile:(p:SobrietyProfile|null)=>void;signOut:()=>Promise<void>;refreshProfile:()=>Promise<void>};
const AuthContext=createContext<AuthContextType>({user:null,profile:null,isLoading:true,setProfile:()=>{},signOut:async()=>{},refreshProfile:async()=>{}});
export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[profile,setProfileState]=useState<SobrietyProfile|null>(null),[isLoading,setIsLoading]=useState(true);
 const setProfile=(next:SobrietyProfile|null)=>{setProfileState(next);if(next?.email)setUser(current=>current?{...current,email:next.email}:current)};
 const loadProfile=async(userId:string)=>{const{data}=await supabase.from("profiles").select("*").eq("id",userId).maybeSingle();setProfile(data as SobrietyProfile|null)};
 const refreshProfile=async()=>{if(user?.id)await loadProfile(user.id)};
 useEffect(()=>{let mounted=true;const syncSession=async(session:Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"])=>{if(!session?.user?.id){if(mounted){setUser(null);setProfileState(null)}return}const storedEmail=await AsyncStorage.getItem("v1ce_email");if(!mounted)return;setUser({email:storedEmail||"",id:session.user.id});await loadProfile(session.user.id)};const initialize=async()=>{let{data:{session}}=await supabase.auth.getSession();if(!session){const{data,error}=await supabase.auth.signInAnonymously();if(!error)session=data.session}if(mounted)await syncSession(session);if(mounted)setIsLoading(false)};initialize();const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{queueMicrotask(()=>{if(mounted)void syncSession(session)})});return()=>{mounted=false;subscription.unsubscribe()}},[]);
 const signOut=async()=>{await supabase.auth.signOut();await AsyncStorage.removeItem("v1ce_email");setUser(null);setProfile(null)};
 const value=useMemo(()=>({user,profile,isLoading,setProfile,signOut,refreshProfile}),[user,profile,isLoading]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}