import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name) setName(data.display_name); });
  }, [user?.email]);

  async function save() {
    if (!user?.email || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) Alert.alert("Couldn't save", error.message);
    else Alert.alert("Saved", "Your profile was updated.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/sign-in");
  }

  return <View style={styles.container}>
    <Text style={styles.kicker}>PROFILE</Text><Text style={styles.title}>Your account.</Text>
    <Text style={styles.label}>DISPLAY NAME</Text>
    <TextInput value={name} onChangeText={setName} placeholder="your name" placeholderTextColor="#737373" style={styles.input} />
    <Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>{saving ? "SAVING..." : "SAVE"}</Text></Pressable>
    <Text style={styles.email}>{user?.email}</Text>
    <Pressable style={styles.signOut} onPress={signOut}><Text style={styles.signOutText}>SIGN OUT</Text></Pressable>
  </View>;
}
const styles=StyleSheet.create({container:{flex:1,padding:28,backgroundColor:"#F7F7F7"},kicker:{color:"#F5A41A",fontWeight:"800",letterSpacing:2},title:{marginTop:12,marginBottom:30,fontSize:34,fontWeight:"800"},label:{fontSize:10,fontWeight:"800",letterSpacing:2,color:"#737373",marginBottom:8},input:{height:54,borderWidth:2,borderColor:"#0A0A0A",backgroundColor:"#FFFFFF",paddingHorizontal:14,fontSize:16},button:{height:54,marginTop:12,backgroundColor:"#0A0A0A",alignItems:"center",justifyContent:"center"},buttonText:{color:"#FFFFFF",fontWeight:"800"},email:{marginTop:20,color:"#737373"},signOut:{marginTop:"auto",height:54,borderWidth:2,borderColor:"#ef4444",alignItems:"center",justifyContent:"center"},signOutText:{color:"#ef4444",fontWeight:"800"}});