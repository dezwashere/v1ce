import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { daysSince } from "@/constants/app";
import SobrietyCoin from "@/components/coin/SobrietyCoin";
import RotatingLabel from "@/components/home/RotatingLabel";
import { CUSTOMIZE_WORD_PREFS_KEY } from "@/lib/rotatingTextPrefs";
import { useTranslation } from "@/lib/i18n";

export default function CoinScreen() {
  const { profile } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  if (!profile) return <View style={{flex:1,backgroundColor:colors.background}} />;
  return (
    <ScrollView style={{backgroundColor:colors.background}} contentContainerStyle={styles.page}>
      <Text style={[styles.title,{color:colors.foreground}]}>{t("nav.coin")}</Text>
      <Text style={[styles.sub,{color:colors.mutedForeground}]}>{t("coin.subtitle")}</Text>
      <View style={styles.rotating}><RotatingLabel prefsKey={CUSTOMIZE_WORD_PREFS_KEY} /></View>
      <View style={styles.coin}>
        <SobrietyCoin
          days={daysSince(profile.sobriety_date)}
          shape={profile.coin_shape || "circle"}
          color={profile.coin_color || "#F5D680"}
          numberStyle={profile.number_style || "classic"}
          size={285}
          displayName={profile.display_name || ""}
          motto={profile.coin_motto || "FREE FROM"}
          substances={profile.substances || []}
          showBorder={profile.coin_show_border ?? true}
          borderColor={profile.coin_border_color || undefined}
          numberColor={profile.coin_number_color || undefined}
        />
      </View>
      <TouchableOpacity onPress={()=>router.push("/settings")} style={[styles.btn,{borderColor:colors.foreground}]}>
        <Text style={[styles.btnText,{color:colors.foreground}]}>{t("coin.customizeInSettings")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles=StyleSheet.create({
  page:{padding:20,paddingBottom:56},
  title:{fontFamily:fonts.display,fontSize:64,lineHeight:78,paddingTop:8},
  sub:{fontFamily:fonts.body,fontSize:14,marginTop:-6},
  rotating:{alignItems:"flex-start",marginTop:18},
  coin:{alignItems:"center",paddingVertical:36},
  btn:{borderWidth:2,minHeight:52,alignItems:"center",justifyContent:"center"},
  btnText:{fontFamily:fonts.black,fontSize:12,letterSpacing:1.7},
});