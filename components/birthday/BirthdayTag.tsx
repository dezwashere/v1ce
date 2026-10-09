import React from "react";
import { Text, View } from "react-native";
import { fonts } from "@/constants/typography";
import { useTranslation } from "@/lib/i18n";

export default function BirthdayTag() {
  const { t } = useTranslation();
  return (
    <View style={{ backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#0A0A0A", paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ fontSize: 10, fontFamily: fonts.black, letterSpacing: 1.5 }}>{t("birthday.badge")}</Text>
    </View>
  );
}
