import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { useTranslation } from "@/lib/i18n";
import { COLOR_SWATCHES, daysSince } from "@/constants/app";
import { fonts } from "@/constants/typography";
import SobrietyCoin from "@/components/coin/SobrietyCoin";
import ShapePicker from "@/components/customize/ShapePicker";
import ColorPicker from "@/components/customize/ColorPicker";
import NumberStylePicker from "@/components/customize/NumberStylePicker";
import { AsteriskStar, Crosshair, DiamondGrid, Starburst } from "@/components/ui/RetroAccents";
import OutlineText from "@/components/ui/OutlineText";
import { supabase, TABLES } from "@/lib/supabase";
import { CUSTOMIZE_WORD_PREFS_KEY, HOME_WORD_PREFS_KEY, DEFAULT_ROTATING_PREFS, loadRotatingTextPrefs, saveRotatingTextPrefs, type RotatingTextPrefs } from "@/lib/rotatingTextPrefs";

const ROTATING_WORDS = [
  "COIN",
  "TOKEN",
  "CHIP",
  "V1CE",
  "JOURNEY",
  "PROGRESS",
  "BAGEL",
  "SHINY CIRCLE",
  "NOT A NICKEL",
  "PIZZA FUND",
  "PET ROCK",
  "DOUBLOON",
  "PAPERWEIGHT",
  "SOUVENIR",
  "OBJECT",
  "THINGY",
];

function Switch({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.switchRow}>
      <TouchableOpacity
        onPress={onToggle}
        style={[styles.switchTrack, { backgroundColor: on ? colors.foreground : colors.secondary }]}
      >
        <View
          style={[
            styles.switchKnob,
            {
              backgroundColor: colors.background,
              transform: [{ translateX: on ? 28 : 4 }],
            },
          ]}
        />
      </TouchableOpacity>
      <Text style={[styles.switchLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function MiniColorInput({
  value,
  onChange,
  placeholder = "Auto",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const colors = useColors();
  const valid = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
    <View style={styles.colorInputRow}>
      <View
        style={[
          styles.colorDot,
          {
            borderColor: colors.foreground,
            backgroundColor: valid ? value : "transparent",
          },
        ]}
      />
      <TextInput
        value={value}
        onChangeText={(v) => {
          const next = v.toUpperCase();
          if (/^#[0-9A-F]{6}$/.test(next) || next === "" || next.length <= 7) onChange(next);
        }}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        maxLength={7}
        autoCapitalize="characters"
        style={[styles.colorInput, { color: "#000000", borderColor: colors.foreground }]}
      />
      {!!value && (
        <TouchableOpacity onPress={() => onChange("")}>
          <Text style={[styles.autoText, { color: colors.mutedForeground }]}>AUTO</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function WordPrefsEditor({
  title,
  prefs,
  onChange,
}: {
  title: string;
  prefs: RotatingTextPrefs;
  onChange: (next: RotatingTextPrefs) => void;
}) {
  const colors = useColors();
  const words = [...prefs.customWords, "", "", "", "", ""].slice(0, 5);

  const setWord = (index: number, value: string) => {
    const next = [...words];
    next[index] = value.slice(0, 24);
    onChange({ ...prefs, customWords: next });
  };

  return (
    <View style={[styles.wordEditor, { borderColor: colors.border }]}>
      <Text style={[styles.subhead, { color: colors.foreground }]}>{title}</Text>
      <Switch
        on={prefs.rotating}
        onToggle={() => onChange({ ...prefs, rotating: !prefs.rotating })}
        label={prefs.rotating ? "Rotating" : "Still"}
      />

      <Text style={[styles.micro, { color: colors.mutedForeground, marginTop: 18 }]}>STILL WORD</Text>
      <TextInput
        value={prefs.pausedWord}
        onChangeText={(value) => onChange({ ...prefs, pausedWord: value.slice(0, 24) })}
        placeholder="Leave blank to use the first word"
        placeholderTextColor="#999999"
        maxLength={24}
        style={[styles.input, { color: "#000000", borderColor: colors.foreground }]}
      />

      <Text style={[styles.micro, { color: colors.mutedForeground, marginTop: 18 }]}>YOUR WORDS · UP TO 5</Text>
      {words.map((word, index) => (
        <TextInput
          key={index}
          value={word}
          onChangeText={(value) => setWord(index, value)}
          placeholder={`WORD ${index + 1}`}
          placeholderTextColor="#999999"
          maxLength={24}
          style={[styles.input, styles.wordInput, { color: "#000000", borderColor: colors.foreground }]}
        />
      ))}
    </View>
  );
}

export default function Customize() {
  const { profile, setProfile } = useAuth();
  const colors = useColors();
  const { isPremium } = usePremium();
  const { t } = useTranslation();
  const router = useRouter();

  const [wordIndex, setWordIndex] = useState(0);
  const [wordPrefs, setWordPrefs] = useState<RotatingTextPrefs>(DEFAULT_ROTATING_PREFS);
  const [homeWordPrefs, setHomeWordPrefs] = useState<RotatingTextPrefs>(DEFAULT_ROTATING_PREFS);
  const [saving, setSaving] = useState(false);
  const [color, setColor] = useState(profile?.coin_color || "#F5D680");
  const [shape, setShape] = useState(profile?.coin_shape || "circle");
  const [numberStyle, setNumberStyle] = useState(profile?.number_style || "classic");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [motto, setMotto] = useState(profile?.coin_motto || "");
  const [customShapePath, setCustomShapePath] = useState(profile?.coin_shape_path || "");
  const [imageOnlyMode, setImageOnlyMode] = useState(profile?.coin_image_only || false);
  const [showBorder, setShowBorder] = useState(profile?.coin_show_border ?? true);
  const [borderColor, setBorderColor] = useState(profile?.coin_border_color || "");
  const [numberColor, setNumberColor] = useState(profile?.coin_number_color || "");
  const [coinPhoto, setCoinPhoto] = useState(profile?.coin_photo || "");

  useFocusEffect(useCallback(() => {
    Promise.all([
      loadRotatingTextPrefs(CUSTOMIZE_WORD_PREFS_KEY),
      loadRotatingTextPrefs(HOME_WORD_PREFS_KEY),
    ]).then(([customizePrefs, homePrefs]) => {
      setWordPrefs(customizePrefs);
      setHomeWordPrefs(homePrefs);
      setWordIndex(0);
    });
  }, []));

  const updateCustomizeWordPrefs = (next: RotatingTextPrefs) => {
    setWordPrefs(next);
    setWordIndex(0);
    void saveRotatingTextPrefs(CUSTOMIZE_WORD_PREFS_KEY, next);
  };

  const updateHomeWordPrefs = (next: RotatingTextPrefs) => {
    setHomeWordPrefs(next);
    void saveRotatingTextPrefs(HOME_WORD_PREFS_KEY, next);
  };

  const customHeaderWords = wordPrefs.customWords.map((word) => word.trim()).filter(Boolean);
  const headerWords = customHeaderWords.length ? customHeaderWords : ROTATING_WORDS;

  useEffect(() => {
    if (!wordPrefs.rotating || headerWords.length < 2) return;
    const interval = setInterval(() => setWordIndex((index) => (index + 1) % headerWords.length), 1500);
    return () => clearInterval(interval);
  }, [wordPrefs.rotating, headerWords.length]);

  const visibleHeaderWord = wordPrefs.rotating
    ? headerWords[wordIndex % Math.max(headerWords.length, 1)]
    : (wordPrefs.pausedWord.trim() || headerWords[0] || "COIN");

  useEffect(() => {
    if (!profile) return;
    setShape(profile.coin_shape || "circle");
    setColor(profile.coin_color || "#F5D680");
    setNumberStyle(profile.number_style || "classic");
    setDisplayName(profile.display_name || "");
    setMotto(profile.coin_motto || "");
    setCustomShapePath(profile.coin_shape_path || "");
    setShowBorder(profile.coin_show_border !== false);
    setBorderColor(profile.coin_border_color || "");
    setNumberColor(profile.coin_number_color || "");
    setImageOnlyMode(profile.coin_image_only || false);
    setCoinPhoto(profile.coin_photo || "");
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id || saving) return;
    setSaving(true);

    const values = {
      coin_shape: shape,
      coin_color: color,
      number_style: numberStyle,
      display_name: displayName,
      coin_motto: motto,
      coin_shape_path: customShapePath,
      coin_show_border: showBorder,
      coin_border_color: borderColor || null,
      coin_number_color: numberColor || null,
      coin_image_only: imageOnlyMode,
      coin_photo: coinPhoto,
    };

    const { data, error } = await supabase
      .from(TABLES.SobrietyProfile)
      .update(values)
      .eq("id", profile.id)
      .select()
      .single();

    if (!error) {
      setProfile(data || { ...profile, ...values });
    }

    setSaving(false);
  };

  if (!profile) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  const daysSober = daysSince(profile.sobriety_date);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={[styles.header, { borderBottomColor: colors.foreground }]}>
        <View style={styles.headerBurst}>
          <Starburst size={90} color={colors.foreground} opacity={0.08} />
        </View>
        <View style={styles.headerDiamond}>
          <DiamondGrid size={50} color={colors.foreground} opacity={0.1} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("customize.your")}</Text>
        <OutlineText
          fill={colors.background}
          stroke={colors.foreground}
          style={styles.headerWord}
        >
          {visibleHeaderWord}
        </OutlineText>
      </View>
      <View style={[styles.preview, { borderBottomColor: colors.foreground }]}>
        <SobrietyCoin
          days={daysSober}
          shape={shape}
          color={color}
          numberStyle={numberStyle}
          size={240}
          substances={profile.substances || []}
          displayName={displayName}
          motto={motto}
          customShapePath={customShapePath}
          showBorder={showBorder}
          coinPhoto={coinPhoto}
          borderColor={borderColor}
          numberColor={numberColor}
          imageOnlyMode={imageOnlyMode}
        />
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>WORDS</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Rotate the built-in words, keep one word still, or replace them with up to five of your own.
        </Text>
        <WordPrefsEditor title="HOME — DAYS WORD" prefs={homeWordPrefs} onChange={updateHomeWordPrefs} />
        <WordPrefsEditor title="YOUR CHIP" prefs={wordPrefs} onChange={updateCustomizeWordPrefs} />
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <View style={styles.shapeAccent}>
          <AsteriskStar size={36} color={colors.foreground} opacity={0.12} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>{t("customize.shape")}</Text>
        <ShapePicker value={shape} onChange={setShape} />
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <View style={styles.inlineTitle}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
            IMAGE MODE
          </Text>
          {!isPremium && (
            <View style={[styles.badge, { borderColor: colors.foreground, opacity: 0.6 }]}>
              <Text style={[styles.badgeText, { color: colors.foreground }]}>PREMIUM</Text>
            </View>
          )}
        </View>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Show only your photo on the front. Your sober time, name & motto move to the back.
        </Text>
        <Switch
          on={imageOnlyMode && isPremium}
          onToggle={() =>
            isPremium
              ? setImageOnlyMode((previous) => !previous)
              : router.push("/(tabs)/premium")
          }
          label={imageOnlyMode && isPremium ? "On — photo fills front" : "Off"}
        />
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t("customize.personalize")}
        </Text>

        <Text style={[styles.micro, { color: colors.mutedForeground }]}>
          {t("customize.displayName").toUpperCase()}
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t("customize.displayNamePlaceholder")}
          placeholderTextColor="#999999"
          maxLength={20}
          style={[styles.input, { color: "#000000", borderColor: colors.foreground }]}
        />

        <Text style={[styles.micro, { color: colors.mutedForeground, marginTop: 20 }]}>
          {t("customize.motto").toUpperCase()}
        </Text>
        <TextInput
          value={motto}
          onChangeText={setMotto}
          placeholder={t("customize.mottoPlaceholder")}
          placeholderTextColor="#999999"
          maxLength={50}
          style={[styles.input, { color: "#000000", borderColor: colors.foreground }]}
        />
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("customize.color")}</Text>
        <ColorPicker value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#F5D680"} onChange={setColor} />

        <View style={[styles.inner, { borderTopColor: colors.border }]}>
          <Text style={[styles.subhead, { color: colors.foreground }]}>
            {t("customize.border")}
          </Text>
          <Switch
            on={showBorder}
            onToggle={() => setShowBorder((previous) => !previous)}
            label={showBorder ? t("customize.show") : t("customize.hide")}
          />

          {showBorder && (
            <View style={{ marginTop: 18 }}>
              <Text style={[styles.micro, { color: colors.mutedForeground }]}>
                BORDER COLOR{" "}
                <Text style={{ opacity: 0.5 }}>(LEAVE BLANK FOR AUTO)</Text>
              </Text>
              <View style={styles.miniSwatches}><TouchableOpacity onPress={() => setBorderColor("")} style={[styles.autoSwatch, { borderColor: !borderColor ? colors.foreground : colors.border }]}><Text style={[styles.autoText, { color: colors.foreground }]}>AUTO</Text></TouchableOpacity>{COLOR_SWATCHES.slice(0, 12).map((hex) => <TouchableOpacity key={hex} onPress={() => setBorderColor(hex)} style={[styles.miniSwatch, { backgroundColor: hex, borderColor: borderColor === hex ? colors.foreground : colors.border }]} />)}</View><MiniColorInput value={borderColor} onChange={setBorderColor} />
            </View>
          )}
        </View>

        <View style={[styles.inner, { borderTopColor: colors.border }]}>
          <Text style={[styles.subhead, { color: colors.foreground }]}>NUMBER COLOR</Text>
          <Text style={[styles.micro, { color: colors.mutedForeground }]}>
            LEAVE BLANK TO AUTO-CONTRAST WITH COIN COLOR
          </Text>
          <View style={styles.miniSwatches}><TouchableOpacity onPress={() => setNumberColor("")} style={[styles.autoSwatch, { borderColor: !numberColor ? colors.foreground : colors.border }]}><Text style={[styles.autoText, { color: colors.foreground }]}>AUTO</Text></TouchableOpacity>{COLOR_SWATCHES.slice(0, 12).map((hex) => <TouchableOpacity key={hex} onPress={() => setNumberColor(hex)} style={[styles.miniSwatch, { backgroundColor: hex, borderColor: numberColor === hex ? colors.foreground : colors.border }]} />)}</View><MiniColorInput value={numberColor} onChange={setNumberColor} />
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <View style={styles.decorTopRight}>
          <Crosshair size={44} color={colors.foreground} opacity={0.1} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t("customize.numberStyle")}
        </Text>
        <NumberStylePicker value={numberStyle} onChange={setNumberStyle} />
      </View>

      <View style={styles.saveWrap}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.save,
            {
              backgroundColor: colors.foreground,
              opacity: saving ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[styles.saveText, { color: colors.background }]}>
            {saving ? t("customize.saving") : t("customize.save")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 64 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24, borderBottomWidth: 2, position: "relative", overflow: "hidden" },
  headerBurst: { position: "absolute", right: 2, top: -8 },
  headerDiamond: { position: "absolute", right: 64, bottom: 2 },
  headerTitle: { fontSize: 64, lineHeight: 78, paddingTop: 6, fontFamily: fonts.display },
  headerWord: { fontSize: 64, lineHeight: 78, paddingTop: 4, fontFamily: fonts.display, letterSpacing: 1 },
  preview: { alignItems: "center", paddingVertical: 32, borderBottomWidth: 2 },
  section: { paddingHorizontal: 20, paddingVertical: 32, borderBottomWidth: 2, position: "relative", overflow: "hidden" },
  shapeAccent: { position: "absolute", right: 16, top: 16 },
  decorTopRight: { position: "absolute", right: 16, top: 16 },
  sectionTitle: { fontSize: 26, lineHeight: 34, paddingTop: 2, fontFamily: fonts.display, letterSpacing: 1, marginBottom: 16 },
  inlineTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  badge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { fontSize: 8, fontFamily: fonts.bodyBold, letterSpacing: 1.4 },
  sub: { fontSize: 12, lineHeight: 18, fontFamily: fonts.body, marginBottom: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchTrack: { width: 64, height: 40, borderRadius: 20, justifyContent: "center" },
  switchKnob: { width: 32, height: 32, borderRadius: 16 },
  switchLabel: { fontSize: 14, fontFamily: fonts.body },
  micro: { fontSize: 10, letterSpacing: 2, fontFamily: fonts.bodyBold, marginBottom: 8 },
  input: { width: "100%", borderWidth: 2, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: fonts.body, backgroundColor: "#FFFFFF" },
  inner: { marginTop: 24, paddingTop: 24, borderTopWidth: 2 },
  wordEditor: { borderWidth: 1, padding: 14, marginTop: 14 },
  wordInput: { marginTop: 8 },
  subhead: { fontSize: 19, fontFamily: fonts.display, letterSpacing: 1, marginBottom: 12 },
  colorInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  colorInput: { flex: 1, height: 36, borderWidth: 2, backgroundColor: "#FFFFFF", paddingHorizontal: 8, fontFamily: fonts.body, fontSize: 12 },
  autoText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 2 },
  saveWrap: { paddingHorizontal: 20, paddingTop: 24 },
  save: { height: 56, alignItems: "center", justifyContent: "center" },
  saveText: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 2 },
  miniSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10, marginBottom: 10 },
  miniSwatch: { width: 32, height: 32, borderWidth: 2 },
  autoSwatch: { minWidth: 54, height: 32, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
