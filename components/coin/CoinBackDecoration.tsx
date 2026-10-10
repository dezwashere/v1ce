import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export const COIN_BACK_ICONS = ["none", "mountain", "palm", "smiley", "clover", "butterfly", "wave"] as const;
export type CoinBackIconName = (typeof COIN_BACK_ICONS)[number];

export default function CoinBackDecoration({
  icon,
  size = 22,
  color = "#000000",
}: {
  icon: CoinBackIconName | string;
  size?: number;
  color?: string;
}) {
  if (!icon || icon === "none") return null;
  const stroke = { stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {icon === "mountain" ? (
        <><Path d="M2 19 9 7l4 6 2.5-4L22 19Z" {...stroke} /><Path d="m7.2 10.1 1.8 2 2-2" {...stroke} /></>
      ) : icon === "palm" ? (
        <><Path d="M12 21c1-5 1-10 0-14M12 7C9 4 5 4 3 8c4-1 7-1 9-1Zm0 0c2-4 6-5 10-2-5 0-8 1-10 2Zm0 0c-3-2-6-1-8 3 4-2 6-2 8-3Zm0 0c4-1 7 1 8 5-3-3-5-4-8-5Z" {...stroke} /></>
      ) : icon === "smiley" ? (
        <><Circle cx="12" cy="12" r="9" {...stroke}/><Circle cx="9" cy="10" r=".8" fill={color}/><Circle cx="15" cy="10" r=".8" fill={color}/><Path d="M8 14c2 3 6 3 8 0" {...stroke}/></>
      ) : icon === "clover" ? (
        <><Path d="M12 11c-6-9-12 1-4 3-9 3-1 11 4 3 5 8 13 0 4-3 8-2 2-12-4-3ZM12 14l2 8" {...stroke}/></>
      ) : icon === "butterfly" ? (
        <><Path d="M12 8C8 2 2 2 3 9c0 3 3 4 7 5-8-1-9 7-3 6 3-.5 5-3 5-6m0-6c4-6 10-6 9 1 0 3-3 4-7 5 8-1 9 7 3 6-3-.5-5-3-5-6" {...stroke}/><Path d="M12 7v11" {...stroke}/></>
      ) : icon === "wave" ? (
        <><Path d="M2 9c3 0 3 3 6 3s3-3 6-3 3 3 6 3h2M2 15c3 0 3 3 6 3s3-3 6-3 3 3 6 3h2" {...stroke}/></>
      ) : null}
    </Svg>
  );
}
