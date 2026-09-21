import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCoinContext } from "@/lib/CoinContext";
import { useTheme } from "@/lib/ThemeContext";
import { usePremium } from "@/lib/PremiumContext";
import { useNavigate } from "react-router-dom";
import SobrietyCoin from "../components/coin/SobrietyCoin";
import ShapePicker from "../components/customize/ShapePicker";
import ColorPicker from "../components/customize/ColorPicker";
import NumberStylePicker from "../components/customize/NumberStylePicker";
import { DiamondGrid, Starburst, Crosshair, AsteriskStar } from "../components/ui/RetroAccents";
import { useTranslation } from "react-i18next";

const ROTATING_WORDS = ['COIN', 'TOKEN', 'CHIP', 'V1CE', 'JOURNEY', 'PROGRESS', 'BAGEL', 'SHINY CIRCLE', 'NOT A NICKEL', 'PIZZA FUND', 'PET ROCK', 'DOUBLOON', 'PAPERWEIGHT', 'SOUVENIR', 'OBJECT', 'THINGY'];

function getLocalProfile() {
  try {
    const raw = localStorage.getItem("v1ce_profile") || localStorage.getItem("v1ce_guest_profile");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocalProfile(data) {
  const existing = getLocalProfile() || {};
  localStorage.setItem("v1ce_profile", JSON.stringify({ ...existing, ...data }));
}

// Mini inline color picker for border / number color
function MiniColorInput({ value, onChange, placeholder = "#000000" }) {
  const inputRef = React.useRef();
  const displayVal = value || "";
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => inputRef.current?.click()}
        className="w-8 h-8 rounded-full border-2 border-foreground flex-shrink-0"
        style={{ background: value || "transparent" }}
        title="Pick color"
      />
      <input ref={inputRef} type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="sr-only" />
      <input
        type="text"
        value={displayVal}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9A-Fa-f]{6}$/.test(v) || v === "") onChange(v || null);
          else if (v.length <= 7) onChange(v);
        }}
        placeholder={placeholder}
        maxLength={7}
        className="flex-1 border-2 border-foreground bg-white px-2 py-1 font-body text-xs text-black placeholder:text-gray-400 focus:outline-none uppercase"
      />
      {value && (
        <button onClick={() => onChange("")} className="font-body text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
          AUTO
        </button>
      )}
    </div>
  );
}

export default function Customize() {
  const queryClient = useQueryClient();
  const { dark } = useTheme();
  const { updateCoinData } = useCoinContext();
  const { t } = useTranslation();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setWordIndex((p) => (p + 1) % ROTATING_WORDS.length), 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const local = getLocalProfile();
      if (local?.sobriety_date) { setProfile(local); setIsLoading(false); return; }
      try {
        const user = await base44.auth.me().catch(() => null);
        if (user) {
          const profiles = await base44.entities.SobrietyProfile.filter({ created_by: user.email });
          if (profiles[0]) { saveLocalProfile(profiles[0]); setProfile(profiles[0]); }
        }
      } catch {}
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const [shape, setShape] = useState("circle");
  const [color, setColor] = useState("#F5D680");
  const [numberStyle, setNumberStyle] = useState("classic");
  const [displayName, setDisplayName] = useState("");
  const [motto, setMotto] = useState("");
  const [customShapePath, setCustomShapePath] = useState("");
  const [showBorder, setShowBorder] = useState(true);
  const [borderColor, setBorderColor] = useState("");
  const [numberColor, setNumberColor] = useState("");
  const [imageOnlyMode, setImageOnlyMode] = useState(false);
  const [coinPhoto, setCoinPhoto] = useState("");

  useEffect(() => {
    if (profile) {
      setShape(profile.coin_shape || "circle");
      setColor(profile.coin_color || "#F5D680");
      setNumberStyle(profile.number_style || "classic");
      setDisplayName(profile.display_name || "");
      setMotto(profile.coin_motto || "");
      setCustomShapePath(profile.coin_shape_path || "");
      setShowBorder(profile.coin_show_border !== false);
      setBorderColor(profile.coin_border_color || "");
      setNumberColor(profile.coin_number_color || "");
      setImageOnlyMode(profile.coin_image_only || false);
      setCoinPhoto(profile.coin_photo || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      saveLocalProfile(data);
      updateCoinData({ color: data.coin_color, displayName: data.display_name });
      if (profile?.id) return base44.entities.SobrietyProfile.update(profile.id, data).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sobriety-profile"] });
      toast.success("Coin updated!");
    },
  });

  const handleSave = () => {
    if (!profile) return;
    updateMutation.mutate({
      coin_shape: shape,
      coin_color: color,
      number_style: numberStyle,
      display_name: displayName,
      coin_motto: motto,
      coin_shape_path: customShapePath,
      coin_show_border: showBorder,
      coin_border_color: borderColor || null,
      coin_number_color: numberColor || null,
      coin_image_only: imageOnlyMode,
      coin_photo: coinPhoto,
    });
  };

  const daysSober = profile?.sobriety_date
    ? Math.max(0, Math.floor((new Date() - new Date(profile.sobriety_date)) / (1000 * 60 * 60 * 24)))
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-16">

      {/* Header */}
      <div className="px-5 pt-8 pb-6 border-b-2 border-foreground relative overflow-hidden">
        <Starburst size={90} className="absolute -top-2 right-2 pointer-events-none" color={dark ? "#ffffff" : "#000000"} opacity={0.08} />
        <DiamondGrid size={50} className="absolute bottom-2 right-16 pointer-events-none" color={dark ? "#ffffff" : "#000000"} opacity={0.1} />
        <p className="font-display text-foreground leading-none relative z-10" style={{ fontSize: "clamp(3rem, 14vw, 4.5rem)" }}>
          {t("customize.your")}<br />
          <AnimatePresence mode="wait">
            <motion.span
              key={ROTATING_WORDS[wordIndex]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.001 }}
              className="font-display"
              style={{ display: 'inline-block', fontWeight: 900, WebkitTextStroke: dark ? '0.25px white' : '0.25px black', color: 'transparent' }}
            >
              {ROTATING_WORDS[wordIndex]}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>

      {/* Live Coin Preview */}
      <div className="flex justify-center py-8 border-b-2 border-foreground" style={{ width: "100%" }}>
        <SobrietyCoin
          days={daysSober}
          shape={shape}
          color={color}
          numberStyle={numberStyle}
          size={240}
          substances={profile.substances || []}
          displayName={displayName}
          motto={motto}
          customShapePath={customShapePath}
          showBorder={showBorder}
          coinPhoto={coinPhoto}
          borderColor={borderColor}
          numberColor={numberColor}
          imageOnlyMode={imageOnlyMode}
        />
      </div>

      {/* 1. Shape */}
      <div className="px-5 py-8 border-b-2 border-foreground relative overflow-hidden">
        <AsteriskStar size={36} className="absolute top-4 right-4 pointer-events-none" opacity={0.12} />
        <p className="font-display text-2xl text-foreground mb-4 tracking-wider">{t("customize.shape")}</p>
        <ShapePicker value={shape} onChange={setShape} />
      </div>

      {/* 2. Coin Photo — Coming Soon */}
      <div className="px-5 py-8 border-b-2 border-foreground relative overflow-hidden opacity-60">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-display text-2xl text-foreground tracking-wider">{t("customize.coinPhoto")}</p>
          <span className="text-[10px] font-body tracking-widest uppercase border border-foreground px-1.5 py-0.5">COMING SOON</span>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-4">{t("customize.coinPhotoSub")}</p>
        <div className="w-full h-12 border-2 border-dashed border-foreground text-foreground font-display text-lg tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
          + {t("customize.coinPhotoUpload")}
        </div>
      </div>

      {/* 3. Image-Only Mode */}
      <div className="px-5 py-8 border-b-2 border-foreground space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-display text-2xl text-foreground tracking-wider">IMAGE MODE</p>
          {!isPremium && <span className="text-[10px] font-body tracking-widest uppercase border border-foreground px-1.5 py-0.5 opacity-60">PREMIUM</span>}
        </div>
        <p className="font-body text-xs text-muted-foreground">Show only your photo on the front. Your sober time, name & motto move to the back.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => isPremium ? setImageOnlyMode(!imageOnlyMode) : navigate("/premium")}
            className={`h-10 w-16 rounded-full transition-colors flex-shrink-0 ${imageOnlyMode && isPremium ? "bg-foreground" : "bg-secondary"}`}
          >
            <div className={`h-8 w-8 rounded-full transition-transform ${dark ? "bg-background" : "bg-white"} ${imageOnlyMode && isPremium ? "translate-x-7" : "translate-x-1"} mt-1`} />
          </button>
          <span className="font-body text-sm text-muted-foreground">
            {imageOnlyMode && isPremium ? "On — photo fills front" : "Off"}
          </span>
        </div>
      </div>

      {/* 4. Personalize */}
      <div className="px-5 py-8 border-b-2 border-foreground space-y-5">
        <p className="font-display text-2xl text-foreground tracking-wider">{t("customize.personalize")}</p>
        <div className="space-y-1">
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t("customize.displayName")}</p>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("customize.displayNamePlaceholder")} maxLength={20}
            className="w-full border-2 border-foreground bg-white px-3 py-2 font-body text-sm text-black placeholder:text-gray-400 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t("customize.motto")}</p>
          <input value={motto} onChange={(e) => setMotto(e.target.value)} placeholder={t("customize.mottoPlaceholder")} maxLength={50}
            className="w-full border-2 border-foreground bg-white px-3 py-2 font-body text-sm text-black placeholder:text-gray-400 focus:outline-none" />
        </div>
      </div>

      {/* 5. Color */}
      <div className="px-5 py-8 border-b-2 border-foreground">
        <p className="font-display text-2xl text-foreground mb-4 tracking-wider">{t("customize.color")}</p>
        <ColorPicker value={color} onChange={setColor} />

        {/* Border toggle + color */}
        <div className="mt-6 pt-6 border-t-2 border-foreground/20 space-y-4">
          <p className="font-display text-lg text-foreground tracking-wider">{t("customize.border")}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBorder(!showBorder)}
              className={`h-10 w-16 rounded-full transition-colors flex-shrink-0 ${showBorder ? "bg-foreground" : "bg-secondary"}`}
            >
              <div className={`h-8 w-8 rounded-full transition-transform ${dark ? "bg-background" : "bg-white"} ${showBorder ? "translate-x-7" : "translate-x-1"} mt-1`} />
            </button>
            <span className="font-body text-sm text-muted-foreground">{showBorder ? t("customize.show") : t("customize.hide")}</span>
          </div>
          {showBorder && (
            <div>
              <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Border Color <span className="opacity-50">(leave blank for auto)</span></p>
              <MiniColorInput value={borderColor} onChange={setBorderColor} placeholder="Auto" />
            </div>
          )}
        </div>

        {/* Number / text color */}
        <div className="mt-6 pt-6 border-t-2 border-foreground/20 space-y-2">
          <p className="font-display text-lg text-foreground tracking-wider">NUMBER COLOR</p>
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Leave blank to auto-contrast with coin color</p>
          <MiniColorInput value={numberColor} onChange={setNumberColor} placeholder="Auto" />
        </div>
      </div>

      {/* 6. Number Style */}
      <div className="px-5 py-8 border-b-2 border-foreground relative overflow-hidden">
        <Crosshair size={44} className="absolute top-4 right-4 pointer-events-none" opacity={0.1} />
        <p className="font-display text-2xl text-foreground mb-4 tracking-wider">{t("customize.numberStyle")}</p>
        <NumberStylePicker value={numberStyle} onChange={setNumberStyle} />
      </div>

      {/* Save */}
      <div className="px-5 pt-6">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full h-14 bg-foreground text-background font-display text-2xl tracking-widest disabled:opacity-40 hover:bg-foreground/80 transition-colors"
        >
          {updateMutation.isPending ? t("customize.saving") : t("customize.save")}
        </button>
      </div>
    </div>
  );
}