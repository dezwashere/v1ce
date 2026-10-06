import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase, TABLES } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import GifterBadge from "@/components/GifterBadge";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";
import RotatingTextSettings from "@/components/settings/RotatingTextSettings";
import { CUSTOMIZE_WORD_PREFS_KEY, DEFAULT_ROTATING_PREFS, HOME_WORD_PREFS_KEY, loadRotatingTextPrefs, saveRotatingTextPrefs, type RotatingTextPrefs } from "@/lib/rotatingTextPrefs";

export default function Profile() {
  const { profile, user, setProfile, signOut } = useAuth();
  const colors = useColors();
  const { toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState(profile?.display_name || "");
  const [birthday, setBirthday] = useState(profile?.birthday || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [homeWordPrefs, setHomeWordPrefs] = useState<RotatingTextPrefs>(DEFAULT_ROTATING_PREFS);
  const [customizeWordPrefs, setCustomizeWordPrefs] = useState<RotatingTextPrefs>(DEFAULT_ROTATING_PREFS);

  useEffect(() => {
    Promise.all([loadRotatingTextPrefs(HOME_WORD_PREFS_KEY), loadRotatingTextPrefs(CUSTOMIZE_WORD_PREFS_KEY)]).then(([home, customize]) => {
      setHomeWordPrefs(home);
      setCustomizeWordPrefs(customize);
    });
  }, []);

  const updateHomeWords = (next: RotatingTextPrefs) => { setHomeWordPrefs(next); void saveRotatingTextPrefs(HOME_WORD_PREFS_KEY, next); };
  const updateCustomizeWords = (next: RotatingTextPrefs) => { setCustomizeWordPrefs(next); void saveRotatingTextPrefs(CUSTOMIZE_WORD_PREFS_KEY, next); };
  const initials = (name.trim() || user?.email || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((v) => v[0])
    .join("")
    .toUpperCase();

  const pickAvatar = async () => {
    if (!user?.id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("V1CE", "Photo access is required to choose a profile picture.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const body = await response.arrayBuffer();
      const extension = (asset.fileName?.split(".").pop() || asset.mimeType?.split("/").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, body, { contentType: asset.mimeType || "image/jpeg", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { data: updated, error } = await supabase.from(TABLES.SobrietyProfile).update({ avatar_url: data.publicUrl }).eq("id", user.id).select().single();
      if (error) throw error;
      setAvatarUrl(data.publicUrl);
      setProfile(updated);
    } catch (error: any) {
      Alert.alert("V1CE", error?.message || "Couldn't upload that photo.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { data, error } = await supabase
      .from(TABLES.SobrietyProfile)
      .update({ display_name: name.trim(), birthday: birthday || null })
      .eq("id", user.id)
      .select()
      .single();
    if (error) Alert.alert("V1CE", error.message);
    else {
      setProfile(data);
      Alert.alert("V1CE", "Profile saved.");
    }
    setSaving(false);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>{t("profile.title")}</Text>
      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder, { backgroundColor: colors.foreground }]}>
            <Text style={{ color: colors.background, fontSize: 28, fontFamily: fonts.black }}>{initials}</Text>
          </View>
        )}
        <View style={styles.badge}><GifterBadge giftedCount={profile?.gifted_count || 0} size="md" /></View>
        <TouchableOpacity disabled={uploading} onPress={pickAvatar}>
          <Text style={[styles.avatarAction, { color: colors.foreground }]}>{uploading ? "UPLOADING..." : avatarUrl ? "CHANGE PFP" : "ADD PFP"}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("profile.displayName")}</Text>
      <TextInput value={name} onChangeText={setName} maxLength={20} placeholder={t("profile.namePlaceholder")} placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.foreground, color: colors.foreground }]} />
      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 18 }]}>BIRTHDAY</Text>
      <TextInput value={birthday || ""} onChangeText={setBirthday} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.foreground, color: colors.foreground }]} />
      <TouchableOpacity disabled={saving} onPress={save} style={[styles.button, { backgroundColor: colors.foreground }]}>
        <Text style={{ color: colors.background, fontFamily: fonts.bodyBold }}>{saving ? t("profile.saving") : t("profile.save")}</Text>
      </TouchableOpacity>
      <RotatingTextSettings title="HOME ROTATING WORDS" prefs={homeWordPrefs} onChange={updateHomeWords} />
      <RotatingTextSettings title="CUSTOMIZE ROTATING WORDS" prefs={customizeWordPrefs} onChange={updateCustomizeWords} />
      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 28 }]}>THEME</Text>
      <TouchableOpacity onPress={toggleTheme} style={[styles.outline, { borderColor: colors.foreground }]}>
        <Text style={{ color: colors.foreground, fontFamily: fonts.bodyBold }}>{isDark ? "DARK" : "LIGHT"}</Text>
      </TouchableOpacity>
      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 28 }]}>LANGUAGE</Text>
      <LanguageSwitcher />
      <TouchableOpacity onPress={() => router.push("/widget")} style={[styles.outline, { borderColor: colors.foreground, marginTop: 24 }]}>
        <Text style={{ color: colors.foreground, fontFamily: fonts.bodyBold, letterSpacing: 2 }}>SHARE / WIDGET</Text>
      </TouchableOpacity>
      <View style={[styles.account, { borderTopColor: colors.border }]}>
        <Text style={{ color: colors.foreground, fontFamily: fonts.bodyBold }}>{user?.email || profile?.email}</Text>
        <TouchableOpacity
          style={[styles.logout, { borderColor: colors.destructive }]}
          onPress={async () => {
            await signOut();
            router.replace("/onboarding");
          }}
        >
          <Text style={{ color: colors.destructive, fontFamily: fonts.black, letterSpacing: 2 }}>{t("profile.logOut").toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 64, fontFamily: fonts.display, lineHeight: 76, paddingTop: 6, marginBottom: 40, letterSpacing: 1 },
  avatarWrap: { alignItems: "center", marginBottom: 34 },
  avatar: { width: 112, height: 112 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", right: "31%", top: -8 },
  avatarAction: { fontSize: 11, fontFamily: fonts.black, letterSpacing: 2, marginTop: 14 },
  label: { fontSize: 10, letterSpacing: 3, fontFamily: fonts.bodyBold, marginBottom: 7 },
  input: { borderWidth: 2, padding: 13, fontSize: 15, fontFamily: fonts.body },
  button: { height: 54, alignItems: "center", justifyContent: "center", marginTop: 24 },
  outline: { height: 48, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  account: { borderTopWidth: 2, marginTop: 40, paddingTop: 24 },
  logout: { height: 48, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 20 },
});
