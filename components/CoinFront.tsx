import React from "react";
import CoinFace from "./coin/CoinFace";
import { type CoinInput } from "@/lib/coinDesign";
export { COIN_COLORS, NUMBER_STYLES } from "@/constants/coin";
export { COIN_SHAPES as SHAPES } from "@/lib/coinDesign";
export default function CoinFront(props: CoinInput) { return <CoinFace {...props} face="front"/>; }
