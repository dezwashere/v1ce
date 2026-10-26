import React, { useEffect, useRef, useState } from "react";
import { AppState, Text, TouchableOpacity, View } from "react-native";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { loadAudioPreferences } from "@/lib/audioPreferences";

const CUES = {
  arcade: require("../../assets/audio/arcade.wav"),
  lofi: require("../../assets/audio/lofi.wav"),
  synth: require("../../assets/audio/synth.wav"),
};

/** Mounted only for an open, focused card. The hook releases audio on unmount. */
export default function BirthdayAudioPlayer({ song }: { song: string }) {
  const colors = useColors();
  const source = CUES[song as keyof typeof CUES] ?? CUES.arcade;
  const player = useAudioPlayer(source, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const generation = useRef(0), mounted = useRef(true), pending = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    mounted.current = true;
    player.volume = .5;
    const subscription = AppState.addEventListener("change", state => {
      if (state !== "active") {
        generation.current++;
        player.pause();
      }
    });
    return () => { mounted.current = false; generation.current++; subscription.remove(); };
  }, [player]);
  useEffect(() => { let active=true; void loadAudioPreferences().then(preferences => { if(active) setMusicEnabled(preferences.musicEnabled); }); return () => { active=false; }; }, []);

  const toggle = async () => {
    if (pending.current || !status.isLoaded || !musicEnabled) return;
    if (status.playing) { generation.current++; player.pause(); return; }
    pending.current = true;
    const request = ++generation.current;
    setBusy(true); setError("");
    try {
      await setAudioModeAsync({ playsInSilentMode: false, allowsRecording: false, shouldPlayInBackground: false,
        interruptionMode: "mixWithOthers", shouldRouteThroughEarpiece: false });
      if (!mounted.current || request !== generation.current) return;
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - .1)) await player.seekTo(0);
      if (mounted.current && request === generation.current && AppState.currentState !== "background" && AppState.currentState !== "inactive") player.play();
    } catch {
      if (mounted.current) setError("Music could not play. Please try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return <View style={{ gap: 5, marginTop: 12 }}>
    <TouchableOpacity accessibilityRole="button" disabled={busy || !status.isLoaded || !musicEnabled} onPress={() => void toggle()}
      style={{ borderWidth: 1, borderColor: colors.foreground, padding: 12, alignItems: "center", opacity: busy || !status.isLoaded ? .5 : 1 }}>
      <Text style={{ color: colors.foreground, fontFamily: fonts.bodyBold }}>{!musicEnabled ? "MUSIC OFF IN SETTINGS" : busy ? "STARTING…" : !status.isLoaded ? "LOADING MUSIC…" : status.playing ? "PAUSE MUSIC" : "PLAY CARD MUSIC"}</Text>
    </TouchableOpacity>
    <Text style={{ color: colors.mutedForeground, fontFamily: fonts.body, fontSize: 11 }}>Sound follows your phone’s silent setting. Music stops when you leave this card.</Text>
    {!!error && <Text accessibilityLiveRegion="polite" style={{ color: colors.foreground }}>{error}</Text>}
  </View>;
}
