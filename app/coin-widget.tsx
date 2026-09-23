import React from "react";
import {StyleSheet,View} from "react-native";
import {useAuth} from "@/context/AuthContext";
import CoinFront from "@/components/CoinFront";
import {useColors} from "@/hooks/useColors";

export default function CoinWidget(){
 const {profile}=useAuth(); const c=useColors();
 const days=profile?.sobriety_date?Math.max(0,Math.floor((Date.now()-new Date(profile.sobriety_date+"T00:00:00").getTime())/86400000)):0;
 return <View style={[s.page,{backgroundColor:c.background}]}><CoinFront days={days} shape={profile?.coin_shape||"circle"} color={profile?.coin_color||"gold"} numberStyle={profile?.number_style||"classic"} size={240} displayName={profile?.display_name||""} motto={profile?.coin_motto||""} customShapePath={profile?.coin_shape_path||undefined} showBorder={profile?.coin_show_border??true} coinPhoto={profile?.coin_photo||undefined} imageOnlyMode={profile?.coin_image_only||false} borderColor={profile?.coin_border_color||undefined} numberColor={profile?.coin_number_color||undefined}/></View>
}
const s=StyleSheet.create({page:{flex:1,alignItems:"center",justifyContent:"center"}});
