import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const FREE_COLORS = ["#F5D680"];
const PREMIUM_COLORS = ["#F5A41A", "#D9D9D9", "#111111", "#C9A7FF", "#9FD7FF", "#A8D5BA", "#F2A6B3"];
const SHAPES = ["circle", "hexagon", "star", "diamond", "shield", "octagon"] as const;
const FONTS = ["Classic", "Bebas", "Bodoni", "Inter", "Mono"] as const;

type Profile = {
  id?: string;
  coin_color?: string | null;
  coin_shape?: string | null;
  coin_motto?: string | null;
  coin_photo?: string | null;
  number_style?: string | null;
};

export default function Customize() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [color, setColor] = useState("#F5D680");
  const [shape, setShape] = useState<(typeof SHAPES)[number]>("circle");
  const [motto, setMotto] = useState("ONE DAY AT A TIME");
  const [font, setFont] = useState<(typeof FONTS)[number]>("Classic");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isPremium = false;

  useEffect(() => {
    if (!user?.email) return;
    supabase.from("profiles")
      .select("id, coin_color, coin_shape, coin_motto, coin_photo, number_style")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setProfile(data);
        if (data.coin_color) setColor(data.coin_color);
        if (SHAPES.includes(data.coin_shape as (typeof SHAPES)[number])) setShape(data.coin_shape as (typeof SHAPES)[number]);
        if (data.coin_motto) setMotto(data.coin_motto);
        if (data.coin_photo) setImageUrl(data.coin_photo);
        if (data.number_style) setFont(data.number_style as (typeof FONTS)[number]);
      });
  }, [user?.email]);

  const radius = shape === "circle" ? 999 : 12;
  const previewStyle = useMemo(() => ({
    width: 200, height: 200, borderRadius: radius, backgroundColor: color,
    borderWidth: 5, borderColor: "#0A0A0A",
    alignItems: "center" as const, justifyContent: "center" as const,
  }), [color, radius]);

  function requirePremium() {
    if (!isPremium) Alert.alert("V1CE Premium", "This customization is a Premium feature.");
    return isPremium;
  }

  async function pickImage() {
    if (!requirePremium() || !user?.email) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;
    const response = await fetch(result.assets[0].uri);
    if (!response.ok) return Alert.alert("Couldn't read image", "Please choose another image.");
    const arrayBuffer = await response.arrayBuffer();
    const path = `${user.id}/coin-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("coin-images").upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });
    if (uploadError) return Alert.alert("Couldn't upload image", uploadError.message);
    const { data } = supabase.storage.from("coin-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    const { error } = await supabase.from("profiles").update({ coin_photo: data.publicUrl }).eq("id", user.id);
    if (error) Alert.alert("Couldn't save image", error.message);
  }

  async function save() {
    if (!user?.email) return;
    setSaving(true);
    const patch = { coin_color: color, coin_shape: shape, coin_motto: motto.trim().slice(0, 30) || "ONE DAY AT A TIME", number_style: font };
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    setSaving(false);
    if (error) Alert.alert("Couldn't save", error.message);
    else {
      setProfile((current) => ({ ...(current || {}), ...patch }));
      Alert.alert("Saved", "Your coin was updated.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>COIN</Text>
      <Text style={styles.title}>Your coin.</Text>
      <View style={styles.previewWrap}>
        <View style={previewStyle}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" /> : null}
          <Text style={styles.previewNumber}>1</Text>
          <Text style={styles.previewMotto}>{motto || "ONE DAY AT A TIME"}</Text>
        </View>
      </View>
      <Text style={styles.label}>COLOR</Text>
      <View style={styles.row}>
        {FREE_COLORS.map((item) => <Pressable key={item} onPress={() => setColor(item)} style={[styles.swatch, { backgroundColor: item }, color === item && styles.swatchSelected]} />)}
        {PREMIUM_COLORS.map((item) => <Pressable key={item} onPress={() => requirePremium() && setColor(item)} style={[styles.swatch, { backgroundColor: item }, styles.premiumSwatch]}><Text style={styles.lock}>LOCK</Text></Pressable>)}
      </View>
      <Text style={styles.label}>SHAPE</Text>
      <View style={styles.row}>
        {SHAPES.map((item) => <Pressable key={item} onPress={() => item === "circle" ? setShape(item) : requirePremium() && setShape(item)} style={[styles.option, shape === item && styles.optionSelected, item !== "circle" && styles.premiumOption]}><Text style={[styles.optionText, shape === item && styles.optionTextSelected]}>{item.toUpperCase()}</Text></Pressable>)}
      </View>
      <Text style={styles.label}>FONT</Text>
      <View style={styles.row}>
        {FONTS.map((item) => <Pressable key={item} onPress={() => item === "Classic" ? setFont(item) : requirePremium() && setFont(item)} style={[styles.option, font === item && styles.optionSelected, item !== "Classic" && styles.premiumOption]}><Text style={[styles.optionText, font === item && styles.optionTextSelected]}>{item}{item !== "Classic" ? " · PREMIUM" : ""}</Text></Pressable>)}
      </View>
      <Text style={styles.label}>CUSTOM IMAGE</Text>
      <Pressable style={styles.upload} onPress={pickImage}><Text style={styles.uploadText}>{imageUrl ? "CHANGE IMAGE" : "UPLOAD YOUR OWN IMAGE"} · PREMIUM</Text></Pressable>
      <Text style={styles.label}>MOTTO</Text>
      <TextInput value={motto} onChangeText={setMotto} maxLength={30} style={styles.input} />
      <Pressable style={styles.save} onPress={save} disabled={saving}><Text style={styles.saveText}>{saving ? "SAVING..." : "SAVE COIN"}</Text></Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container:{padding:24,paddingBottom:110,backgroundColor:"#F7F7F7"}, kicker:{color:"#F5A41A",fontWeight:"800",letterSpacing:2,fontSize:12},
  title:{marginTop:8,fontSize:34,fontWeight:"800",color:"#0A0A0A"}, previewWrap:{alignItems:"center",paddingVertical:28},
  label:{marginTop:18,marginBottom:10,fontSize:10,fontWeight:"800",letterSpacing:2,color:"#737373"}, row:{flexDirection:"row",flexWrap:"wrap",gap:8},
  swatch:{width:42,height:42,borderWidth:2,borderColor:"#E0E0E0"}, swatchSelected:{borderColor:"#0A0A0A",borderWidth:4},
  option:{borderWidth:2,borderColor:"#0A0A0A",paddingHorizontal:12,paddingVertical:9,backgroundColor:"#FFFFFF"}, optionSelected:{backgroundColor:"#0A0A0A"},
  optionText:{fontSize:11,fontWeight:"800"},optionTextSelected:{color:"#FFFFFF"},input:{height:54,borderWidth:2,borderColor:"#0A0A0A",backgroundColor:"#FFFFFF",paddingHorizontal:14,fontSize:14,fontWeight:"600"},
  save:{height:54,marginTop:20,backgroundColor:"#0A0A0A",alignItems:"center",justifyContent:"center"},saveText:{color:"#FFFFFF",fontWeight:"800",letterSpacing:1.5},
  upload:{height:54,borderWidth:2,borderColor:"#0A0A0A",backgroundColor:"#FFFFFF",alignItems:"center",justifyContent:"center"},uploadText:{fontSize:11,fontWeight:"800",letterSpacing:1},
  premiumSwatch:{opacity:0.7},lock:{position:"absolute",bottom:2,left:0,right:0,textAlign:"center",fontSize:7,fontWeight:"900",color:"#FFFFFF"},premiumOption:{opacity:0.65},
  previewImage:{position:"absolute",width:190,height:190,borderRadius:999},previewNumber:{fontSize:64,fontWeight:"800",color:"#0A0A0A"},previewMotto:{fontSize:8,fontWeight:"800",letterSpacing:1,color:"#0A0A0A"}
});