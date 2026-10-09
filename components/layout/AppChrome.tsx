import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { LANGUAGES, useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";
import Svg, { Circle, Path } from "react-native-svg";

const TABS = [
  { labelKey: "nav.home", path: "/" },
  { labelKey: "nav.coin", path: "/customize" },
  { labelKey: "nav.lounge", path: "/lounge" },
  { labelKey: "nav.profile", path: "/profile" },
] as const;

const TOUR_KEY = "v1ce_take_a_look_tour_v1";
const TOUR = [
  { title: "YOUR DAYS", body: "Your counter and rotating words live on Home. The words rotate by default." },
  { title: "YOUR COIN", body: "Your coin grows with you. Open Coin any time to see it." },
  { title: "MAKE IT YOURS", body: "Open Settings to change coin shape, colors, border, font, message, and rotating words." },
  { title: "YOUR PEOPLE", body: "Lounge brings friends, birthdays, chat, profiles, and Ask the Magic Egg together." },
];

function ThemeGlyph({ color, fill }: { color: string; fill: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="9" fill="none" stroke={color} strokeWidth="1.8" />
      <Path d="M11 2 A9 9 0 0 0 11 20 Z" fill={fill} />
    </Svg>
  );
}

export default function AppChrome({ showNav = true }: { showNav?: boolean }) {
  const colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang, t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(TOUR_KEY).then((seen) => {
      if (!seen) setTourOpen(true);
    });
  }, []);

  const go = (path: string) => {
    setLangOpen(false);
    router.push(path as any);
  };

  const closeTour = async () => {
    await AsyncStorage.setItem(TOUR_KEY, "1");
    setTourOpen(false);
  };

  return (
    <View style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { borderBottomColor: colors.foreground }]}>
        <View style={[styles.logoWrap, { pointerEvents: "none" }]}>
          <Image source={require("../../assets/images/v1ce-logo.png")} style={styles.logo} tintColor={colors.foreground} resizeMode="contain" />
        </View>
        <View style={styles.left}>
          <TouchableOpacity onPress={toggleTheme} hitSlop={8} style={styles.iconBtn}>
            <ThemeGlyph color={colors.foreground} fill={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLangOpen(true)} hitSlop={8} style={styles.iconBtn}>
            <Feather name="globe" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.right}>
          <TouchableOpacity onPress={() => go("/settings")} hitSlop={8} style={styles.iconBtn}>
            <Feather name="settings" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {showNav ? (
        <View style={[styles.nav, { borderBottomColor: colors.foreground }]}>
          {TABS.map((tab) => {
            const active =
              tab.path === "/" ? pathname === "/" || pathname === "/index" :
              tab.path === "/customize" ? pathname === "/customize" :
              pathname === tab.path;
            return (
              <TouchableOpacity key={tab.path} onPress={() => go(tab.path)} style={[styles.tab, active && { backgroundColor: colors.foreground }]}>
                <Text style={[styles.tabLabel, { color: active ? colors.background : colors.foreground }]}>{t(tab.labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setLangOpen(false)}>
          <View style={[styles.langMenu,{ backgroundColor: isDark ? "#111" : "#FFFFFF", borderColor: colors.foreground, top: insets.top + 50 }]}>
            {LANGUAGES.map((item) => (
              <TouchableOpacity key={item.code} onPress={() => { setLang(item.code); setLangOpen(false); }} style={styles.langItem}>
                <Text style={[styles.langText, { color: colors.foreground, opacity: lang === item.code ? 1 : 0.55 }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={tourOpen} transparent animationType="fade" onRequestClose={closeTour}>
        <View style={styles.tourBackdrop}>
          <View style={[styles.tourCard, { backgroundColor: colors.background, borderColor: colors.foreground }]}>
            <Text style={[styles.tourKicker, { color: colors.mutedForeground }]}>TAKE A LOOK AROUND</Text>
            <Text style={[styles.tourTitle, { color: colors.foreground }]}>{TOUR[tourIndex].title}</Text>
            <Text style={[styles.tourBody, { color: colors.mutedForeground }]}>{TOUR[tourIndex].body}</Text>
            <View style={styles.tourDots}>
              {TOUR.map((_, i) => <View key={i} style={[styles.dot,{ backgroundColor: i===tourIndex ? colors.foreground : colors.border }]} />)}
            </View>
            <View style={styles.tourActions}>
              <TouchableOpacity onPress={closeTour}><Text style={[styles.tourSkip,{color:colors.mutedForeground}]}>SKIP</Text></TouchableOpacity>
              <TouchableOpacity
                onPress={() => tourIndex === TOUR.length - 1 ? closeTour() : setTourIndex((i) => i + 1)}
                style={[styles.tourNext,{backgroundColor:colors.foreground}]}
              >
                <Text style={[styles.tourNextText,{color:colors.background}]}>{tourIndex===TOUR.length-1 ? "START USING V1CE" : "NEXT"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header:{height:52,flexDirection:"row",alignItems:"center",paddingHorizontal:10,borderBottomWidth:2,zIndex:2},
  logoWrap:{position:"absolute",left:0,right:0,top:0,bottom:0,alignItems:"center",justifyContent:"center"},
  logo:{height:28,width:112},
  left:{flexDirection:"row",alignItems:"center",gap:6,zIndex:3},
  right:{marginLeft:"auto",flexDirection:"row",alignItems:"center",zIndex:3},
  iconBtn:{padding:6,zIndex:3},
  nav:{flexDirection:"row",borderBottomWidth:2,paddingHorizontal:2},
  tab:{flex:1,alignItems:"center",justifyContent:"center",paddingVertical:11,marginHorizontal:1},
  tabLabel:{fontSize:10,fontFamily:fonts.extraBold,letterSpacing:.25},
  langMenu:{position:"absolute",right:44,borderWidth:2,minWidth:56,elevation:8},
  langItem:{paddingVertical:8,paddingHorizontal:12,alignItems:"center"},
  langText:{fontSize:13,fontFamily:fonts.bodyBold},
  menuBackdrop:{flex:1,backgroundColor:"rgba(0,0,0,.35)"},
  tourBackdrop:{flex:1,backgroundColor:"rgba(0,0,0,.6)",alignItems:"center",justifyContent:"center",padding:24},
  tourCard:{width:"100%",borderWidth:2,padding:22},
  tourKicker:{fontFamily:fonts.bodyBold,fontSize:10,letterSpacing:2,marginBottom:10},
  tourTitle:{fontFamily:fonts.display,fontSize:42,lineHeight:50,letterSpacing:1},
  tourBody:{fontFamily:fonts.body,fontSize:15,lineHeight:22,marginTop:8},
  tourDots:{flexDirection:"row",gap:6,marginTop:24},
  dot:{width:28,height:3},
  tourActions:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:24},
  tourSkip:{fontFamily:fonts.bodyBold,fontSize:11,letterSpacing:1.5},
  tourNext:{minHeight:44,paddingHorizontal:18,alignItems:"center",justifyContent:"center"},
  tourNextText:{fontFamily:fonts.black,fontSize:11,letterSpacing:1.3},
});