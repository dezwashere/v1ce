import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import LofiAvatar from "./LofiAvatar";

/** Reuse the original V1CE avatar set; preserve uploaded photos. */
export default function FriendAvatar({ seed, uri, size = 58 }: { seed: string; uri?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
    {uri && /^https:\/\//i.test(uri) && !failed
      ? <Image source={{ uri }} onError={() => setFailed(true)} style={{ width: size, height: size }} resizeMode="cover"/>
      : <LofiAvatar seed={seed} size={size}/>}
  </View>;
}
