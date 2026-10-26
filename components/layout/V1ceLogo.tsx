import React from "react";
import { Image } from "react-native";

export default function V1ceLogo({ height = 28 }: { height?: number }) {
  return (
    <Image
      source={require("../../assets/images/v1ce-wordmark-approved.png")}
      style={{ height, width: height * 1.5 }}
      resizeMode="contain"
    />
  );
}
