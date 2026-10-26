import React, { useRef } from "react";
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import CoinFront from "@/components/CoinFront";
import FriendAvatar from "@/components/lounge/FriendAvatar";
import BirthdayTag from "@/components/birthday/BirthdayTag";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export default function CoinPreview({
  visible,onClose,name,days,shape,color,motto,status,avatarSeed,avatar,birthday=false,showCoin=true,showDays=true,showCoinPlaceholder=true,onBirthday,onShare,
}: {
  visible:boolean; onClose:()=>void; name:string; days:number; shape?:string; color?:string; motto?:string;
  status?:string; avatarSeed?:string; avatar?:string; birthday?:boolean; showCoin?:boolean; showDays?:boolean; showCoinPlaceholder?:boolean; onBirthday?:()=>void; onShare?:()=>void;
}) {
  const colors=useColors();
  const cardRef = useRef<ViewShot>(null);
  const shareImage = async () => {
    try {
      if (!cardRef.current) throw new Error("Profile card is not ready to share.");
      if (!await Sharing.isAvailableAsync()) throw new Error("Image sharing is not available on this device.");
      const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share V1CE profile card" });
    } catch (error) {
      Alert.alert("V1CE", error instanceof Error ? error.message : "Could not share the profile card image.");
    }
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <ViewShot ref={cardRef} style={[styles.card,{backgroundColor:colors.background,borderColor:colors.foreground}]}>
        <FriendAvatar seed={avatarSeed||name} uri={avatar} size={78}/>
        <Text style={[styles.name,{color:colors.foreground}]}>{name}</Text>
        {showDays?<Text style={[styles.days,{color:colors.mutedForeground}]}>{days} DAYS</Text>:null}
        {birthday?<View style={styles.birthday}><BirthdayTag/></View>:null}
        {status?<Text style={[styles.status,{color:colors.foreground}]}>{status}</Text>:null}
        {showCoin?<CoinFront days={days} shape={shape||"circle"} color={color||"gold"} size={170} displayName={name} motto={(motto||"FREE FROM").slice(0,18)}/>:showCoinPlaceholder?<Text style={[styles.hidden,{color:colors.mutedForeground}]}>COIN HIDDEN</Text>:null}
        {birthday&&onBirthday?<TouchableOpacity onPress={onBirthday} style={[styles.birthdayButton,{backgroundColor:colors.foreground}]}><Text style={[styles.buttonText,{color:colors.background}]}>BIRTHDAY CARD</Text></TouchableOpacity>:null}
        {onShare?<TouchableOpacity onPress={() => void shareImage()} style={[styles.button,{borderColor:colors.foreground}]}><Text style={[styles.buttonText,{color:colors.foreground}]}>SHARE CARD</Text></TouchableOpacity>:null}
        <TouchableOpacity onPress={() => Alert.alert("V1CE Premium", "Private messaging is coming soon to V1CE Premium.")} style={[styles.button,{borderColor:colors.foreground}]}>
          <Text style={[styles.buttonText,{color:colors.foreground}]}>🔒 PRIVATE MESSAGING · PREMIUM · COMING SOON</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={[styles.button,{borderColor:colors.foreground}]}>
          <Text style={[styles.buttonText,{color:colors.foreground}]}>CLOSE</Text>
        </TouchableOpacity>
      </ViewShot>
    </View>
  </Modal>;
}
const styles=StyleSheet.create({
 overlay:{flex:1,backgroundColor:"rgba(0,0,0,.5)",justifyContent:"center",padding:24},
 card:{borderWidth:2,padding:20,alignItems:"center"},
 name:{fontSize:24,fontFamily:fonts.display,letterSpacing:1,marginTop:10},
 days:{fontFamily:fonts.bodyBold,fontSize:10,letterSpacing:1.5,marginTop:2},
 birthday:{marginTop:8},
 status:{fontFamily:fonts.body,fontSize:13,lineHeight:18,textAlign:"center",marginVertical:12,maxWidth:240},
 hidden:{fontFamily:fonts.bodyBold,fontSize:10,letterSpacing:1.5,paddingVertical:42},
 birthdayButton:{marginTop:14,minHeight:44,alignItems:"center",justifyContent:"center",alignSelf:"stretch"},
 button:{marginTop:10,borderWidth:2,height:44,alignItems:"center",justifyContent:"center",alignSelf:"stretch"},
 buttonText:{fontFamily:fonts.bodyBold,letterSpacing:1.4,fontSize:11},
});
