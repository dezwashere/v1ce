import { Feather } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { LANGUAGES, useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";
import Svg, { Circle, Path } from "react-native-svg";

const TABS = [
  { key: "nav.home", path: "/" },
  { key: "settings", path: "/profile" },
  { key: "nav.lounge", path: "/lounge" },
  { key: "nav.friends", path: "/friends" },
  { key: "nav.share", path: "/share" },
] as const;

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

  const go = (path: string) => {
    setLangOpen(false);
    router.push(path as any);
  };

  return (
    <View style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { borderBottomColor: colors.foreground }]}>
        <View style={[styles.logoWrap, { pointerEvents: "none" }]}>
          <Image
            source={require("../../assets/images/v1ce-logo.png")}
            style={styles.logo}
            tintColor={colors.foreground}
            resizeMode="contain"
          />
        </View>
        <View style={styles.right}>
          <TouchableOpacity onPress={toggleTheme} hitSlop={8} style={styles.iconBtn}>
            <ThemeGlyph color={colors.foreground} fill={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLangOpen(true)} hitSlop={8} style={styles.iconBtn}>
            <Feather name="globe" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={[styles.v1, { borderColor: colors.foreground }]}>
            <Text style={[styles.v1Text, { color: colors.foreground }]}>V1</Text>
          </View>
        </View>
      </View>

      {showNav ? (
        <View style={[styles.nav, { borderBottomColor: colors.foreground }]}>
          {TABS.map((tab) => {
            const active = tab.path === "/" ? pathname === "/" || pathname === "/index" : pathname === tab.path;
            return (
              <TouchableOpacity
                key={tab.path}
                onPress={() => go(tab.path)}
                style={[styles.tab, active && { backgroundColor: colors.foreground }]}
              >
                <Text style={[styles.tabLabel, { color: active ? colors.background : colors.foreground }]}>{tab.key === "settings" ? "SETTINGS" : t(tab.key)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setLangOpen(false)}>
          <View
            style={[
              styles.langMenu,
              {
                backgroundColor: isDark ? "#111" : "#FFFFFF",
                borderColor: colors.foreground,
                top: insets.top + 50,
              },
            ]}
          >
            {LANGUAGES.map((item) => (
              <TouchableOpacity
                key={item.code}
                onPress={() => {
                  setLang(item.code);
                  setLangOpen(false);
                }}
                style={styles.langItem}
              >
                <Text style={[styles.langText, { color: colors.foreground, opacity: lang === item.code ? 1 : 0.55 }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    zIndex: 2,
  },
  logoWrap: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  logo: { height: 28, width: 112 },
  right: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 8, zIndex: 3 },
  iconBtn: { padding: 6, zIndex: 3 },
  v1: { borderWidth: 1.5, paddingHorizontal: 6, paddingVertical: 2, minWidth: 28, alignItems: "center" },
  v1Text: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 0.5 },
  nav: { flexDirection: "row", borderBottomWidth: 2, paddingHorizontal: 2 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 11, marginHorizontal: 1 },
  tabLabel: { fontSize: 10, fontFamily: fonts.extraBold, letterSpacing: 0.25 },
  langMenu: {
    position: "absolute",
    right: 44,
    borderWidth: 2,
    minWidth: 56,
    elevation: 8,
  },
  langItem: { paddingVertical: 8, paddingHorizontal: 12, alignItems: "center" },
  langText: { fontSize: 13, fontFamily: fonts.bodyBold },
  menuBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
});
