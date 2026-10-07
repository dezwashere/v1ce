import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import OutlineText from "@/components/ui/OutlineText";
import { DEFAULT_ROTATING_PREFS, HOME_WORD_PREFS_KEY, loadRotatingTextPrefs, type RotatingTextPrefs } from "@/lib/rotatingTextPrefs";

export default function RotatingLabel({ prefsKey = HOME_WORD_PREFS_KEY }: { prefsKey?: string }) {
  const colors=useColors();
  const { t,tList }=useTranslation();
  const defaultWords=tList("home.rotatingWords");
  const [prefs,setPrefs]=useState<RotatingTextPrefs>(DEFAULT_ROTATING_PREFS);
  const [index,setIndex]=useState(0);
  useFocusEffect(useCallback(()=>{ loadRotatingTextPrefs(prefsKey).then(next=>{setPrefs(next);setIndex(0);}); },[prefsKey]));
  const customWords=prefs.customWords.map(word=>word.trim()).filter(Boolean);
  const words=customWords.length?customWords:defaultWords;
  const shouldRotate=prefs.rotating;
  useEffect(()=>{ setIndex(0); if(!shouldRotate||words.length<2)return; const id=setInterval(()=>setIndex(v=>(v+1)%words.length),1600); return()=>clearInterval(id); },[shouldRotate,words.length,words.join("|")]);
  const visibleWord=shouldRotate?(words[index%Math.max(words.length,1)]||""):(prefs.pausedWord.trim()||words[0]||"");
  return <View style={{flexDirection:"row",alignItems:"flex-end",gap:10,marginTop:2}}>
    <Text style={{color:colors.foreground,fontSize:28,lineHeight:30,fontFamily:fonts.italic,letterSpacing:1.5,fontStyle:"italic"}}>{t("home.daysLabel")}</Text>
    <OutlineText fill={colors.background} stroke={colors.foreground} style={{fontSize:28,lineHeight:30,fontFamily:fonts.italicBlack,letterSpacing:.5,fontStyle:"italic"}}>{visibleWord}</OutlineText>
  </View>;
}
