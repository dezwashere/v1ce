import React from "react";
import CoinFace from "./CoinFace";
import { type CoinInput } from "@/lib/coinDesign";
import { usePremium } from "@/context/PremiumContext";
export default function CoinBack(props: CoinInput & { substances?: string[] }) {
  const { isPremium } = usePremium();
  return <CoinFace {...props} isPremium={props.isPremium ?? isPremium} face="back"/>;
}
