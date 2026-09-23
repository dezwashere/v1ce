import {View,Text,StyleSheet} from "react-native";

export default function Index(){
 return <View style={styles.container}><Text style={styles.text}>V1CE STARTUP TEST</Text></View>;
}

const styles=StyleSheet.create({
 container:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:"#ffffff"},
 text:{fontSize:24,fontWeight:"700",color:"#000000"}
});
