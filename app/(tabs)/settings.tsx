import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usePremium } from "@/context/PremiumContext";
import { supabase, TABLES } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/lib/i18n";
import GifterBadge from "@/components/GifterBadge";
import { fonts } from "@/constants/typography";
import { daysSince } from "@/constants/app";
import { verifyWidgetSharedSnapshot, writeWidgetProfileSnapshot } from "@/lib/widgetCache";
import SobrietyCoin from "@/components/coin/SobrietyCoin";
import CoinBackDecoration, { COIN_BACK_ICONS, type CoinBackIconName } from "@/components/coin/CoinBackDecoration";
import ShapePicker from "@/components/customize/ShapePicker";
import ColorPicker from "@/components/customize/ColorPicker";
import NumberStylePicker from "@/components/customize/NumberStylePicker";
import RotatingTextSettings from "@/components/settings/RotatingTextSettings";
import {
  CUSTOMIZE_WORD_PREFS_KEY,
  DEFAULT_ROTATING_PREFS,
  HOME_WORD_PREFS_KEY,
  loadRotatingTextPrefs,
  saveRotatingTextPrefs,
  type RotatingTextPrefs,
} from "@/lib/rotatingTextPrefs";

const ALL_SHAPES = ["star", "cross", "badge", "circle", "hexagon", "octagon", "shield", "diamond"] as const;
const FREE_SHAPES = ["circle"] as const;
const ALL_FONTS = [
  "big_shoulders_stencil", "bebas", "bodoni", "courier", "classic", "poppins",
  "monospace", "fredoka", "serif", "dmsans", "syne", "pacifico", "inter",
  "roboto_mono", "oswald", "raleway", "fraunces", "caveat", "dyna_puff",
] as const;
const FREE_FONTS = ["classic", "bebas", "bodoni", "big_shoulders_stencil"] as const;
const COIN_MESSAGE_MAX = 20;
function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Match the actual families and shades offered by ColorPicker.
const PICKER_HUES = [2, 32, 48, 138, 211, 241, 282, 330] as const;
const PICKER_LIGHTNESS = [31, 42, 53, 66, 80] as const;
function randomColor() {
  const hue = randomItem(PICKER_HUES);
  const saturation = 86;
  const lightness = randomItem(PICKER_LIGHTNESS);
  const c = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100);
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const hex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function Toggle({
  value,
  onPress,
  label,
}: {
  value: boolean;
  onPress: () => void;
  label: string;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <TouchableOpacity onPress={onPress} style={styles.toggleRow}>
      <View style={[styles.toggleTrack, { backgroundColor: value ? colors.foreground : colors.secondary }]}>
        <View
          style={[
            styles.toggleKnob,
            {
              backgroundColor: colors.background,
              transform: [{ translateX: value ? 24 : 3 }],
            },
          ]}
        />
      </View>
      <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ColorControl({
  label,
  value,
  onChange,
  allowAuto = false,
  auto,
  onAuto,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowAuto?: boolean;
  auto?: boolean;
  onAuto?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.colorControl}>
      <View style={styles.colorHead}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        {allowAuto ? (
          <TouchableOpacity onPress={onAuto}>
            <Text style={[styles.autoText, { color: colors.foreground }]}>{auto ? "AUTO ✓" : "AUTO"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ColorPicker value={value} onChange={onChange} />
      <View style={styles.hexRow}>
        <View style={[styles.colorDot, { backgroundColor: value, borderColor: colors.foreground }]} />
        <Text style={[styles.hexText, { color: colors.mutedForeground }]}>{auto ? "AUTO" : value.toUpperCase()}</Text>
      </View>
    </View>
  );
}


function DropdownSection({
  label,
  summary,
  open,
  onToggle,
  children,
}: {
  label: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.dropdown, { borderColor: colors.foreground }]}>
      <TouchableOpacity onPress={onToggle} style={styles.dropdownHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dropdownLabel, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.dropdownSummary, { color: colors.mutedForeground }]} numberOfLines={1}>{summary}</Text>
        </View>
        <Text style={[styles.dropdownChevron, { color: colors.foreground }]}>{open ? "−" : "+"}</Text>
      </TouchableOpacity>
      {open ? <View style={[styles.dropdownBody, { borderTopColor: colors.border }]}>{children}</View> : null}
    </View>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { profile, user, setProfile, signOut } = useAuth();
  const colors = useColors();
  const { toggleTheme, isDark } = useTheme();
  const { isPremium } = usePremium();
  const router = useRouter();

  const [name, setName] = useState(profile?.display_name || "");
  const [birthday, setBirthday] = useState(profile?.birthday || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCoin, setSavingCoin] = useState(false);
  const [widgetDiagnostic, setWidgetDiagnostic] = useState("");

  const [shape, setShape] = useState(profile?.coin_shape || "circle");
  const [coinColor, setCoinColor] = useState(profile?.coin_color || "#F5D680");
  const [showBorder, setShowBorder] = useState(profile?.coin_show_border ?? true);
  const [borderColor, setBorderColor] = useState(profile?.coin_border_color || "");
  const [numberColor, setNumberColor] = useState(profile?.coin_number_color || "");
  const [numberStyle, setNumberStyle] = useState(profile?.number_style || "classic");
  const [message, setMessage] = useState(profile?.coin_motto || "FREE FROM");
  const [backIcon, setBackIcon] = useState<CoinBackIconName>((profile?.coin_back_icon || "none") as CoinBackIconName);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [homeWordsOpen, setHomeWordsOpen] = useState(false);
  const [coinWordsOpen, setCoinWordsOpen] = useState(false);

  const [homeWordPrefs, setHomeWordPrefs] = useState<RotatingTextPrefs>(DEFAULT_ROTATING_PREFS);
  const [chipWordPrefs, setChipWordPrefs] = useState<RotatingTextPrefs>(DEFAULT_ROTATING_PREFS);

  useEffect(() => {
    Promise.all([
      loadRotatingTextPrefs(HOME_WORD_PREFS_KEY),
      loadRotatingTextPrefs(CUSTOMIZE_WORD_PREFS_KEY),
    ]).then(([home, chip]) => {
      setHomeWordPrefs(home);
      setChipWordPrefs(chip);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name || "");
    setBirthday(profile.birthday || "");
    setAvatarUrl(profile.avatar_url || "");
    setShape(ALL_SHAPES.includes(profile.coin_shape as any) ? profile.coin_shape : "circle");
    setCoinColor(profile.coin_color || "#F5D680");
    setShowBorder(profile.coin_show_border ?? true);
    setBorderColor(profile.coin_border_color || "");
    setNumberColor(profile.coin_number_color || "");
    setNumberStyle(profile.number_style || "classic");
    setMessage(profile.coin_motto || "FREE FROM");
    setBackIcon(COIN_BACK_ICONS.includes(profile.coin_back_icon as CoinBackIconName) ? profile.coin_back_icon as CoinBackIconName : "none");
  }, [profile]);

  const updateHomeWords = (next: RotatingTextPrefs) => {
    setHomeWordPrefs(next);
    void saveRotatingTextPrefs(HOME_WORD_PREFS_KEY, next);
  };

  const updateChipWords = (next: RotatingTextPrefs) => {
    setChipWordPrefs(next);
    void saveRotatingTextPrefs(CUSTOMIZE_WORD_PREFS_KEY, next);
  };

  const initials = (name.trim() || user?.email || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((value) => value[0])
    .join("")
    .toUpperCase();

  const randomizeCoin = () => {
    // Personal quotes and custom coin messages are user-authored content.
    // Randomization must never replace either one.
    const personalText = (profile?.personal_quote || message || "").trim();
    // Tight silhouettes cannot safely display long personal text.
    const roomyShapes = ["circle", "hexagon", "octagon", "shield"] as const;
    const shapes = isPremium
      ? (personalText.length > 20 ? roomyShapes : ALL_SHAPES)
      : FREE_SHAPES;
    setShape(randomItem(shapes));
    setCoinColor(randomColor());
    setShowBorder(Math.random() > 0.25);
    setBorderColor(randomColor());
    setNumberColor(randomColor());
    setNumberStyle(randomItem(isPremium ? ALL_FONTS : FREE_FONTS));
  };

  const saveCoin = async () => {
    if (!profile?.id || savingCoin) return;
    setSavingCoin(true);
    const values = {
      coin_shape: shape,
      coin_color: coinColor,
      coin_show_border: showBorder,
      coin_border_color: borderColor || "",
      coin_number_color: numberColor || "",
      number_style: numberStyle,
      coin_motto: message.trim().slice(0, COIN_MESSAGE_MAX),
      coin_back_icon: backIcon,
      coin_shape_path: null,
    };
    const { data, error } = await supabase
      .from(TABLES.SobrietyProfile)
      .update(values)
      .eq("id", profile.id)
      .select()
      .single();
    if (error) Alert.alert("V1CE", error.message);
    else {
      const updated = (data || { ...profile, ...values }) as typeof profile;
      await writeWidgetProfileSnapshot(updated);
      setProfile(updated);
    }
    setSavingCoin(false);
  };

  const pickAvatar = async () => {
    if (!user?.id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("V1CE", "Photo access is required to choose a profile picture.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const body = await response.arrayBuffer();
      const extension = (asset.fileName?.split(".").pop() || asset.mimeType?.split("/").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, body, {
        contentType: asset.mimeType || "image/jpeg",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { data: updated, error } = await supabase
        .from(TABLES.SobrietyProfile)
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      setAvatarUrl(data.publicUrl);
      setProfile(updated);
    } catch (error: any) {
      Alert.alert("V1CE", error?.message || "Couldn't upload that photo.");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.id || savingProfile) return;
    setSavingProfile(true);
    const { data, error } = await supabase
      .from(TABLES.SobrietyProfile)
      .update({ display_name: name.trim(), birthday: birthday || null })
      .eq("id", user.id)
      .select()
      .single();
    if (error) Alert.alert("V1CE", error.message);
    else setProfile(data);
    setSavingProfile(false);
  };

  if (!profile) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]} />;
  }

  const days = daysSince(profile.sobriety_date);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>{t("settings.title")}</Text>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <View style={styles.preview}>
          <SobrietyCoin
            days={days}
            shape={shape}
            color={coinColor}
            numberStyle={numberStyle}
            size={230}
            displayName={name}
            motto={message}
            backIcon={backIcon}
            substances={profile.substances || []}
            showBorder={showBorder}
            borderColor={borderColor || undefined}
            numberColor={numberColor || undefined}
          />
        </View>

        <TouchableOpacity
          onPress={randomizeCoin}
          style={[styles.randomize, { borderColor: colors.foreground }]}
        >
          <Text style={[styles.randomizeText, { color: colors.foreground }]}>{t("settings.randomize")}</Text>
        </TouchableOpacity>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>
          Don’t like it? Tap randomize again. Save only when you want to keep it.
        </Text>

        <DropdownSection
          label={t("settings.shape")}
          summary={shape.toUpperCase()}
          open={shapeOpen}
          onToggle={() => setShapeOpen((value) => !value)}
        >
          <ShapePicker value={shape} onChange={setShape} />
        </DropdownSection>

        <DropdownSection
          label={t("settings.colors")}
          summary={`COIN ${coinColor.toUpperCase()} · BORDER ${borderColor ? borderColor.toUpperCase() : "AUTO"} · NUMBER ${numberColor ? numberColor.toUpperCase() : "AUTO"}`}
          open={colorsOpen}
          onToggle={() => setColorsOpen((value) => !value)}
        >
          <ColorControl label={t("settings.coinColor")} value={coinColor} onChange={setCoinColor} />

          <View style={[styles.subSection, { borderTopColor: colors.border }]}>
            <Toggle
              value={showBorder}
              onPress={() => setShowBorder((previous) => !previous)}
              label={showBorder ? t("settings.borderOn") : t("settings.borderOff")}
            />
            {showBorder ? (
              <ColorControl
                label={t("settings.borderColor")}
                value={borderColor || coinColor}
                onChange={setBorderColor}
                allowAuto
                auto={!borderColor}
                onAuto={() => setBorderColor("")}
              />
            ) : null}
          </View>

          <View style={[styles.subSection, { borderTopColor: colors.border }]}>
            <ColorControl
              label={t("settings.numberColor")}
              value={numberColor || coinColor}
              onChange={setNumberColor}
              allowAuto
              auto={!numberColor}
              onAuto={() => setNumberColor("")}
            />
          </View>
        </DropdownSection>

        <DropdownSection
          label={t("settings.numberFont")}
          summary={numberStyle.replace(/_/g, " ").toUpperCase()}
          open={fontOpen}
          onToggle={() => setFontOpen((value) => !value)}
        >
          <NumberStylePicker value={numberStyle} onChange={setNumberStyle} />
        </DropdownSection>

        <Text style={[styles.controlTitle, { color: colors.foreground }]}>{t("settings.coinMessage")}</Text>
        <TextInput
          value={message}
          onChangeText={(value) => setMessage(value.slice(0, COIN_MESSAGE_MAX))}
          maxLength={COIN_MESSAGE_MAX}
          placeholder={t("settings.freeFrom")}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { borderColor: colors.foreground, color: colors.foreground }]}
        />
        <Text style={[styles.helper, { color: colors.mutedForeground, textAlign: "right" }]}>{message.length}/{COIN_MESSAGE_MAX}</Text>
        <Text style={[styles.controlTitle, { color: colors.foreground }]}>COIN BACK DECORATION</Text>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>Optional. Tap the coin to preview its back.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {COIN_BACK_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              accessibilityRole="button"
              accessibilityLabel={`Coin back: ${icon}`}
              onPress={() => setBackIcon(icon)}
              style={{ width: 90, minHeight: 68, borderWidth: 2, borderColor: colors.foreground, backgroundColor: backIcon === icon ? colors.foreground : colors.background, alignItems: "center", justifyContent: "center", gap: 5 }}
            >
              {icon === "none" ? null : <CoinBackDecoration icon={icon} size={25} color={backIcon === icon ? colors.background : colors.foreground}/>}
              <Text style={{ color: backIcon === icon ? colors.background : colors.foreground, fontFamily: fonts.bodyBold, fontSize: 10 }}>{icon.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={async()=>{const result=await verifyWidgetSharedSnapshot();setWidgetDiagnostic(result.ok?"WIDGET DATA VERIFIED":result.reason||"WIDGET DATA NOT VERIFIED");}} style={[styles.outline,{borderColor:colors.foreground,marginTop:12}]}><Text style={[styles.outlineText,{color:colors.foreground}]}>{t("settings.checkWidget")}</Text></TouchableOpacity>
        {widgetDiagnostic?<Text style={[styles.helper,{color:colors.mutedForeground,textAlign:"center"}]}>{widgetDiagnostic}</Text>:null}

        <TouchableOpacity
          onPress={saveCoin}
          disabled={savingCoin}
          style={[styles.primary, { backgroundColor: colors.foreground, opacity: savingCoin ? 0.45 : 1 }]}
        >
          <Text style={[styles.primaryText, { color: colors.background }]}>
            {savingCoin ? t("profile.saving") : t("settings.saveCoin")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("settings.words")}</Text>
        <DropdownSection
          label={t("settings.homeWords")}
          summary={homeWordPrefs.rotating ? t("settings.rotating") : `${t("settings.paused")} · ${homeWordPrefs.pausedWord || "SOBER"}`}
          open={homeWordsOpen}
          onToggle={() => setHomeWordsOpen((value) => !value)}
        >
          <RotatingTextSettings title={t("settings.homeWords")} prefs={homeWordPrefs} onChange={updateHomeWords} />
        </DropdownSection>
        <DropdownSection
          label={t("settings.coinWords")}
          summary={chipWordPrefs.rotating ? t("settings.rotating") : `${t("settings.paused")} · ${chipWordPrefs.pausedWord || "SOBER"}`}
          open={coinWordsOpen}
          onToggle={() => setCoinWordsOpen((value) => !value)}
        >
          <RotatingTextSettings title={t("settings.coinWords")} prefs={chipWordPrefs} onChange={updateChipWords} />
        </DropdownSection>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("settings.profile")}</Text>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholder, { backgroundColor: colors.foreground }]}>
              <Text style={{ color: colors.background, fontSize: 28, fontFamily: fonts.black }}>{initials}</Text>
            </View>
          )}
          <View style={styles.badge}>
            <GifterBadge giftedCount={profile?.gifted_count || 0} size="md" />
          </View>
          <TouchableOpacity disabled={uploading} onPress={pickAvatar}>
            <Text style={[styles.avatarAction, { color: colors.foreground }]}>
              {uploading ? t("profile.uploading") : avatarUrl ? t("settings.changePfp") : t("settings.addPfp")}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("settings.displayName")}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={20}
          placeholder={t("settings.yourName")}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { borderColor: colors.foreground, color: colors.foreground }]}
        />
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 18 }]}>{t("settings.birthday")}</Text>
        <TextInput
          value={birthday || ""}
          onChangeText={setBirthday}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { borderColor: colors.foreground, color: colors.foreground }]}
        />
        <TouchableOpacity onPress={saveProfile} disabled={savingProfile} style={[styles.outline, { borderColor: colors.foreground }]}>
          <Text style={[styles.outlineText, { color: colors.foreground }]}>
            {savingProfile ? t("profile.saving") : t("settings.saveProfile")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("settings.app")}</Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("settings.theme")}</Text>
        <TouchableOpacity onPress={toggleTheme} style={[styles.outline, { borderColor: colors.foreground }]}>
          <Text style={[styles.outlineText, { color: colors.foreground }]}>{isDark ? t("settings.dark") : t("settings.light")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/widget")}
          style={[styles.outline, { borderColor: colors.foreground, marginTop: 24 }]}
        >
          <Text style={[styles.outlineText, { color: colors.foreground }]}>{t("settings.shareWidget")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.account}>
        <Text style={[styles.accountEmail, { color: colors.foreground }]}>
          {user?.email || profile?.email || t("settings.guest")}
        </Text>
        <TouchableOpacity
          style={[styles.logout, { borderColor: colors.destructive }]}
          onPress={async () => {
            await signOut();
            router.replace("/onboarding");
          }}
        >
          <Text style={{ color: colors.destructive, fontFamily: fonts.black, letterSpacing: 2 }}>{t("settings.logout")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 56 },
  loading: { flex: 1 },
  title: {
    fontSize: 64,
    lineHeight: 78,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 18,
    fontFamily: fonts.display,
    letterSpacing: 1,
  },
  section: { paddingHorizontal: 20, paddingVertical: 30, borderBottomWidth: 2 },
  sectionTitle: { fontSize: 30, lineHeight: 38, fontFamily: fonts.display, letterSpacing: 1.5, marginBottom: 18 },
  preview: { alignItems: "center", paddingVertical: 8 },
  randomize: { minHeight: 52, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 18 },
  randomizeText: { fontFamily: fonts.black, fontSize: 13, letterSpacing: 1.7 },
  helper: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17, marginTop: 8 },
  controlTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: 1.2, marginTop: 30, marginBottom: 14 },
  dropdown: { borderWidth: 2, marginTop: 18 },
  dropdownHeader: { minHeight: 62, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  dropdownLabel: { fontFamily: fonts.black, fontSize: 13, letterSpacing: 1.8 },
  dropdownSummary: { fontFamily: fonts.body, fontSize: 10, marginTop: 3, letterSpacing: 0.7 },
  dropdownChevron: { fontFamily: fonts.black, fontSize: 24, lineHeight: 26 },
  dropdownBody: { borderTopWidth: 1, padding: 12 },
  colorControl: { marginTop: 14 },
  colorHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
  hexRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  hexText: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2 },
  autoText: { fontFamily: fonts.black, fontSize: 10, letterSpacing: 1.5 },
  subSection: { marginTop: 24, paddingTop: 20, borderTopWidth: 1 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleTrack: { width: 52, height: 31, borderRadius: 16, justifyContent: "center" },
  toggleKnob: { width: 25, height: 25, borderRadius: 13 },
  toggleLabel: { fontFamily: fonts.body, fontSize: 13 },
  input: { borderWidth: 2, minHeight: 48, paddingHorizontal: 12, fontSize: 15, fontFamily: fonts.body },
  primary: { minHeight: 54, alignItems: "center", justifyContent: "center", marginTop: 26 },
  primaryText: { fontFamily: fonts.black, fontSize: 13, letterSpacing: 2 },
  avatarWrap: { alignItems: "center", marginBottom: 28 },
  avatar: { width: 104, height: 104 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", right: "31%", top: -8 },
  avatarAction: { fontSize: 11, fontFamily: fonts.black, letterSpacing: 2, marginTop: 12 },
  label: { fontSize: 10, letterSpacing: 2.4, fontFamily: fonts.bodyBold, marginBottom: 8 },
  outline: { minHeight: 48, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 18 },
  outlineText: { fontFamily: fonts.bodyBold, letterSpacing: 1.8 },
  account: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 16 },
  accountEmail: { fontFamily: fonts.bodyBold },
  logout: { height: 48, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 20 },
});
