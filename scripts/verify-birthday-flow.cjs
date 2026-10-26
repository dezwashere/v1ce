const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const card = fs.readFileSync(path.join(root, "components/birthday/BirthdayCard.tsx"), "utf8");
const prompts = fs.readFileSync(path.join(root, "components/birthday/BirthdayPrompts.tsx"), "utf8");
const audio = fs.readFileSync(path.join(root, "components/birthday/BirthdayAudioPlayer.tsx"), "utf8");
const checks = [
  ["Approved celebration prompt exists", prompts.includes("Here's to more laughter")],
  ["Approved encouragement prompt exists", prompts.includes("Look how far you've come")],
  ["Approved connection prompt exists", prompts.includes("The world is better with you in it")],
  ["Custom message is capped at 200", card.includes("slice(0, 200)") && card.includes("maxLength={200}")],
  ["Custom message has a counter", card.includes("{message.length}/200")],
  ["Blank messages cannot be shared", card.includes('disabled={!message.trim()}')],
  ["Native audio remains wired", card.includes("BirthdayAudioPlayer") && audio.includes("useAudioPlayer")],
  ["Image share remains wired", card.includes("Sharing.shareAsync")],
];
for (const [label, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
else console.log(`${checks.length}/${checks.length} Birthday flow checks passed`);
