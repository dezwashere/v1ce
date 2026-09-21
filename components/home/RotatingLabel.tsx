import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
const WORDS=["SOBER","UNBOTHERED","HYDRATED","EMPLOYABLE","ASCENDING","CRAZY","SLAYING","FEELING","EXPERIENCING","SHOWING UP","CAFFEINATED","UNHINGED","VALID","VIBING","GRATEFUL","GAY","PROUD","CLEAN","HAPPY","RICH","LOVED"];
export function RotatingLabel({dark=false}:{dark?:boolean}){const[i,setI]=useState(0);useEffect(()=>{const id=setInterval(()=>setI(v=>(v+1)%WORDS.length),1500);return()=>clearInterval(id)},[]);const bg=dark?"#0A0A0A":"#F7F7F7",fg=dark?"#FAFAFA":"#0A0A0A";return <Text style={[styles.label,{color:bg,borderColor:fg,backgroundColor:fg}]}>{WORDS[i]}</Text>}
const styles=StyleSheet.create({label:{alignSelf:"flex-start",marginTop:10,paddingHorizontal:8,paddingVertical:3,borderWidth:2,fontSize:18,lineHeight:23,fontWeight:"900",letterSpacing:1}});
