import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CoinFront from "@/components/CoinFront";
import LofiAvatar from "@/components/lounge/LofiAvatar";
import BirthdayTag from "@/components/birthday/BirthdayTag";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export default function CoinPreview({
  visible,onClose,name,days,shape,color,motto,status,avatarSeed,birthday=false,showCoin=true,onBirthday,
}: {
  visible:boolean; onClose:()=>void; name:string; days:number; shape?:string; color?:string; motto?:string;
  status?:string; avatarSeed?:string; birthday?:boolean; showCoin?:boolean; onBirthday?:()=>void;
}) {
  const colors=useColors();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={[styles.card,{backgroundColor:colors.background,borderColor:colors.foreground}]}>
        <LofiAvatar seed={avatarSeed||name} size={78}/>
        <Text style={[styles.name,{color:colors.foreground}]}>{name}</Text>
        <Text style={[styles.days,{color:colors.mutedForeground}]}>{days} DAYS</Text>
        {birthday?<View style={styles.birthday}><BirthdayTag/></View>:null}
        {status?<Text style={[styles.status,{color:colors.foreground}]}>{status}</Text>:null}
        {showCoin?<CoinFront days={days} shape={shape||"circle"} color={color||"gold"} size={170} displayName={name} motto={(motto||"FREE FROM").slice(0,18)}/>:<Text style={[styles.hidden,{color:colors.mutedForeground}]}>COIN HIDDEN</Text>}
        {birthday&&onBirthday?<TouchableOpacity onPress={onBirthday} style={[styles.birthdayButton,{backgroundColor:colors.foreground}]}><Text style={[styles.buttonText,{color:colors.background}]}>BIRTHDAY CARD</Text></TouchableOpacity>:null}
        <TouchableOpacity onPress={onClose} style={[styles.button,{borderColor:colors.foreground}]}>
          <Text style={[styles.buttonText,{color:colors.foreground}]}>CLOSE</Text>
        </TouchableOpacity>
      </View>
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
