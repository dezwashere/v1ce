import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

type PremiumContextValue = { isPremium:boolean; unlockPremium:()=>void };
const PremiumContext=createContext<PremiumContextValue|null>(null);

// Preview mode is intentionally unlocked so every V1CE feature can be tested without a paywall.
// Turn this off before store release.
const PREVIEW_UNLOCK_ALL = true;

export function PremiumProvider({children}:{children:ReactNode}){
  const {profile,setProfile}=useAuth();
  const isPremium=PREVIEW_UNLOCK_ALL || !!profile?.is_premium;
  const value=useMemo(()=>({isPremium,unlockPremium:()=>{if(profile)setProfile({...profile,is_premium:true});}}),[isPremium,profile,setProfile]);
  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}
export function usePremium(){const ctx=useContext(PremiumContext);if(!ctx)throw new Error("usePremium must be used within PremiumProvider");return ctx;}
