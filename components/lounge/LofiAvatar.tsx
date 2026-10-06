import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const KEYS=["MIA","CROSS","LEAF","JORDAN","PINK","DOTS","TAYLOR","CASEY"] as const;
function keyFor(seed:string){
  const upper=seed.toUpperCase();
  const direct=KEYS.indexOf(upper as any);
  if(direct>=0)return direct;
  const code=[...seed].reduce((sum,c)=>sum+c.charCodeAt(0),0);
  return code%KEYS.length;
}
export default function LofiAvatar({seed="MIA",size=34}:{seed?:string;size?:number;color?:string}){
  const v=keyFor(seed);
  return <View style={{width:size,height:size,borderRadius:size/2,overflow:"hidden"}}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {v===0?<><Circle cx="50" cy="50" r="50" fill="#F4C94E"/><Path d="M8 5 L25 0 L38 100 L20 100 Z M45 0 L56 0 L72 100 L58 100 Z M76 0 L90 6 L98 72 L87 82 Z" fill="#111"/><Path d="M-10 47 C15 30 40 64 64 48 S95 29 112 38" fill="none" stroke="#A9D4FF" strokeWidth="17"/></>:null}
      {v===1?<><Circle cx="50" cy="50" r="50" fill="#FFF4E8"/><Rect x="39" y="-10" width="22" height="120" fill="#F34A39" transform="rotate(42 50 50)"/><Rect x="39" y="-10" width="22" height="120" fill="#F34A39" transform="rotate(-42 50 50)"/></>:null}
      {v===2?<><Circle cx="50" cy="50" r="50" fill="#285E34"/><Path d="M-10 88 L58 -5 M22 110 L88 -5 M-10 34 L100 92" stroke="#E6D59D" strokeWidth="10" fill="none"/><Path d="M2 96 L61 -4 M35 108 L101 0 M-5 25 L105 82" stroke="#F7F0D8" strokeWidth="3" fill="none"/></>:null}
      {v===3?<><Circle cx="50" cy="50" r="50" fill="#E7EEFF"/><Path d="M-8 20 L48 -5 L60 20 L10 46 Z M30 52 L105 20 L110 45 L48 72 Z M-5 72 L58 54 L70 83 L0 105 Z" fill="#2764E8"/><Path d="M52 -8 L82 8 L60 35 L40 22 Z M70 68 L98 60 L110 96 L82 106 Z" fill="#B8C9F5"/></>:null}
      {v===4?<><Circle cx="50" cy="50" r="50" fill="#F49AA2"/><Path d="M5 15 C15 2 30 3 36 16 C40 28 20 31 12 24 Z M52 8 C65 0 82 7 80 20 C76 32 58 28 51 19 Z M25 45 C42 34 57 44 52 59 C46 70 28 67 20 56 Z M65 55 C80 44 96 55 91 70 C85 82 69 78 62 67 Z M10 76 C24 67 40 74 37 89 C31 100 14 96 7 87 Z" fill="#151515"/></>:null}
      {v===5?<><Circle cx="50" cy="50" r="50" fill="#F7C435"/><Circle cx="22" cy="20" r="13" fill="#141414"/><Circle cx="65" cy="13" r="11" fill="#141414"/><Circle cx="84" cy="46" r="15" fill="#141414"/><Circle cx="42" cy="52" r="14" fill="#141414"/><Circle cx="19" cy="79" r="12" fill="#141414"/><Circle cx="69" cy="82" r="16" fill="#141414"/></>:null}
      {v===6?<><Circle cx="50" cy="50" r="50" fill="#F4F0EA"/><Path d="M-8 22 C16 0 36 31 57 14 S90 4 108 14" fill="none" stroke="#2DAA83" strokeWidth="13"/><Path d="M-8 58 C14 35 37 69 58 49 S90 37 108 47" fill="none" stroke="#111" strokeWidth="15"/><Path d="M0 90 C20 67 43 98 66 78 S92 72 108 80" fill="none" stroke="#F0A1BA" strokeWidth="11"/></>:null}
      {v===7?<><Circle cx="50" cy="50" r="50" fill="#F7EFE2"/><Path d="M0 8 H45 V42 H0 Z" fill="#F2A33A"/><Path d="M45 0 H100 V40 H45 Z" fill="#111"/><Path d="M0 42 H48 V100 H0 Z" fill="#111"/><Path d="M48 40 H100 V100 H48 Z" fill="#F6F0DE"/><Circle cx="22" cy="22" r="10" fill="#72C6F2"/><Circle cx="73" cy="67" r="13" fill="#EF5B4C"/><Path d="M42 8 L61 0 L100 35 L100 55 Z" fill="#F2C44A"/></>:null}
    </Svg>
  </View>;
}
