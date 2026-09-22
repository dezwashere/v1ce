import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import CoinFront, { SHAPES } from "@/components/CoinFront";
import { COIN_COLORS, NUMBER_STYLES, resolveCoinColor } from "@/constants/coin";
import { syncV1CEWidget } from "@/lib/widgetSync";

const PRESET_COLORS = Object.keys(COIN_COLORS);
const ACCENT_OPTIONS = ["", "#0A0A0A", "#FFFFFF", "#F5A41A"];

export default function Customize() {
  const { profile, setProfile } = useAuth();
  const c = useColors();
  const [color, setColor] = useState(profile?.coin_color || "gold");
  const [shape, setShape] = useState(profile?.coin_shape || "circle");
  const [style, setStyle] = useState(profile?.number_style || "classic");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [motto, setMotto] = useState(profile?.coin_motto || "");
  const [imageOnlyMode, setImageOnlyMode] = useState(profile?.coin_image_only || false);
  const [border, setBorder] = useState(profile?.coin_show_border ?? true);
  const [borderColor, setBorderColor] = useState(profile?.coin_border_color || "");
  const [numberColor, setNumberColor] = useState(profile?.coin_number_color || "");
  const [customHex, setCustomHex] = useState(/^#[0-9A-Fa-f]{6}$/.test(profile?.coin_color || "") ? profile?.coin_color : "");
  const [saving, setSaving] = useState(false);

  const days = profile
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.sobriety_date + "T00:00:00").getTime()) / 86400000))
    : 0;

  const activeColors = resolveCoinColor(color);

  const save = async () => {
    if (!profile?.email || saving) return;
    setSaving(true);
    const values = {
      coin_color: color,
      coin_shape: shape,
      number_style: style,
      display_name: displayName,
      coin_motto: motto,
      coin_image_only: imageOnlyMode,
      coin_show_border: border,
      coin_border_color: borderColor || null,
      coin_number_color: numberColor || null,
    };
    const { data, error } = await supabase.from("profiles").update(values).eq("email", profile.email).select().single();
    if (!error) {
      const nextProfile = data || { ...profile, ...values };
      setProfile(nextProfile);
      await syncV1CEWidget(nextProfile);
    }
    setSaving(false);
  };

  const setHex = (value: string) => {
    const normalized = value.startsWith("#") ? value : value ? "#" + value : "";
    setCustomHex(normalized.slice(0, 7));
    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) setColor(normalized.toUpperCase());
  };

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={[s.title, { color: c.foreground }]}>CUSTOMIZE</Text>

      <View style={s.preview}>
        <CoinFront
          days={days}
          color={color}
          shape={shape}
          numberStyle={style}
          size={220}
          displayName={displayName}
          motto={motto}
          imageOnlyMode={imageOnlyMode}
          showBorder={border}
          borderColor={borderColor || undefined}
          numberColor={numberColor || undefined}
        />
      </View>

      <Section title="COLOR" c={c} />
      <View style={s.wrap}>
        {PRESET_COLORS.map((name) => {
          const coin = COIN_COLORS[name as keyof typeof COIN_COLORS];
          return (
            <TouchableOpacity key={name} onPress={() => { setColor(name); setCustomHex(""); }} style={[s.chip, { borderColor: color === name ? c.gold : c.foreground, backgroundColor: coin.bg }]}>
              <Text style={{ color: coin.text, fontWeight: "700", fontSize: 11 }}>{name.replace("_", " ").toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[s.hint, { color: c.mutedForeground }]}>CUSTOM HEX</Text>
      <TextInput
        value={customHex}
        onChangeText={setHex}
        placeholder="#F5D680"
        placeholderTextColor={c.mutedForeground}
        autoCapitalize="characters"
        maxLength={7}
        style={[s.input, { color: c.foreground, borderColor: c.border }]}
      />

      <Section title="SHAPE" c={c} />
      <View style={s.wrap}>
        {SHAPES.map((x) => (
          <TouchableOpacity key={x} onPress={() => setShape(x)} style={[s.option, { borderColor: shape === x ? c.gold : c.border }]}>
            <Text style={{ color: c.foreground }}>{x.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Section title="NUMBER STYLE" c={c} />
      <View style={s.wrap}>
        {Object.keys(NUMBER_STYLES).map((x) => (
          <TouchableOpacity key={x} onPress={() => setStyle(x)} style={[s.option, { borderColor: style === x ? c.gold : c.border }]}>
            <Text style={{ color: c.foreground }}>{x.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Section title="PERSONALIZE" c={c} />
      <TextInput
        value={displayName}
        onChangeText={(x) => setDisplayName(x.slice(0, 20))}
        placeholder="Display name"
        placeholderTextColor={c.mutedForeground}
        maxLength={20}
        style={[s.input, { color: c.foreground, borderColor: c.border }]}
      />
      <Section title="MOTTO" c={c} />
      <TextInput value={motto} onChangeText={(x) => setMotto(x.slice(0, 30))} placeholder="30 characters max" placeholderTextColor={c.mutedForeground} style={[s.input, { color: c.foreground, borderColor: c.border }]} />

      <TouchableOpacity onPress={() => setBorder(!border)} style={[s.toggle, { borderColor: c.border }]}>
        <Text style={{ color: c.foreground }}>BORDER: {border ? "ON" : "OFF"}</Text>
      </TouchableOpacity>

      <Text style={[s.hint, { color: c.mutedForeground }]}>IMAGE MODE</Text>
      <TouchableOpacity
        onPress={() => profile?.is_premium ? setImageOnlyMode(!imageOnlyMode) : router.push("/premium")}
        style={[s.toggle, { borderColor: c.border }]}
      >
        <Text style={{ color: c.foreground }}>IMAGE ONLY: {imageOnlyMode && profile?.is_premium ? "ON" : "OFF"}{!profile?.is_premium ? " • PREMIUM" : ""}</Text>
      </TouchableOpacity>

      <Text style={[s.hint, { color: c.mutedForeground }]}>BORDER COLOR</Text>
      <View style={s.colorRow}>
        {ACCENT_OPTIONS.map((x) => <TouchableOpacity key={x || "auto"} onPress={() => setBorderColor(x)} style={[s.colorDot, { backgroundColor: x || activeColors.border, borderColor: c.foreground, opacity: borderColor === x ? 1 : 0.5 }]} />)}
      </View>

      <Text style={[s.hint, { color: c.mutedForeground }]}>NUMBER COLOR</Text>
      <View style={s.colorRow}>
        {ACCENT_OPTIONS.map((x) => <TouchableOpacity key={x || "auto"} onPress={() => setNumberColor(x)} style={[s.colorDot, { backgroundColor: x || activeColors.text, borderColor: c.foreground, opacity: numberColor === x ? 1 : 0.5 }]} />)}
      </View>

      <TouchableOpacity onPress={save} disabled={saving} style={[s.save, { backgroundColor: c.foreground, opacity: saving ? 0.6 : 1 }]}>
        <Text style={{ color: c.background, fontWeight: "700", fontSize: 18 }}>{saving ? "SAVING…" : "SAVE"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({ title, c }: { title: string; c: any }) {
  return <Text style={[s.section, { color: c.foreground }]}>{title}</Text>;
}

const s = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, paddingBottom: 50 },
  title: { fontSize: 42, fontWeight: "700" },
  preview: { alignItems: "center", marginVertical: 28 },
  section: { fontSize: 20, fontWeight: "700", marginTop: 22, marginBottom: 12, letterSpacing: 1 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 2 },
  option: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 2 },
  input: { borderWidth: 2, padding: 14, fontSize: 16 },
  hint: { fontSize: 10, letterSpacing: 2, marginTop: 16, marginBottom: 8 },
  colorRow: { flexDirection: "row", gap: 10 },
  colorDot: { width: 38, height: 38, borderWidth: 2 },
  toggle: { borderWidth: 2, padding: 14, marginTop: 16 },
  save: { height: 56, alignItems: "center", justifyContent: "center", marginTop: 24 },
});

