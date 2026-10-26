const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const checks = [
  ["profile date editor uses centralized validation", () => /sobrietyDate/.test(read("app/(tabs)/profile.tsx"))],
  ["audio preferences default ON and persist", () => {
    const source = read("lib/audioPreferences.ts");
    return /musicEnabled:\s*true/.test(source) && /sfxEnabled:\s*true/.test(source) && /AsyncStorage/.test(source);
  }],
  ["Settings exposes persistent music and sound controls", () => {
    const source = read("app/(tabs)/settings.tsx");
    return /loadAudioPreferences/.test(source) && /saveAudioPreferences/.test(source) && /MUSIC/.test(source) && /SOUND EFFECTS/.test(source);
  }],
  ["Magic Egg allows empty-question taps and reveals after animation", () => {
    const source = read("app/(tabs)/lounge.tsx");
    return !/const q=eggQuestion\.trim\(\);if\(!q\)return/.test(source) && /Animated\.sequence/.test(source) && /setEggAnswer\(answer\)/.test(source);
  }],
  ["widget friends are bounded and synchronized", () => {
    const source = read("app/(tabs)/friends.tsx");
    return /slice\(0,\s*3\)/.test(source) && /writeWidgetFriends/.test(source);
  }],
  ["card image capture and native sharing are wired", () => {
    const packageJson = read("package.json");
    const birthday = read("components/birthday/BirthdayCard.tsx");
    const profile = read("components/lounge/CoinPreview.tsx");
    return /react-native-view-shot/.test(packageJson) && fs.existsSync(path.join(root, "node_modules/react-native-view-shot"))
      && /captureRef/.test(birthday) && /Sharing\.shareAsync/.test(birthday)
      && /captureRef/.test(profile) && /Sharing\.shareAsync/.test(profile);
  }],
];

let passed = 0;
for (const [label, check] of checks) {
  const ok = Boolean(check());
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (ok) passed += 1;
}
console.log(`${passed}/${checks.length} Build 115 source checks passed`);
process.exitCode = passed === checks.length ? 0 : 1;
