const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const chrome = fs.readFileSync(path.join(root, "components/layout/AppChrome.tsx"), "utf8");
const lounge = fs.readFileSync(path.join(root, "app/(tabs)/lounge.tsx"), "utf8");
const preview = fs.readFileSync(path.join(root, "lib/loungePreviewData.ts"), "utf8");

const checks = [
  ["Profile navigation targets Lounge", chrome.includes('labelKey: "nav.lounge", path: "/lounge"')],
  ["Preview mode is explicitly gated", lounge.includes("if(LOUNGE_PREVIEW_ENABLED || !user?.id) return;")],
  ["Preview fixtures remain available", preview.includes("LOUNGE_PREVIEW_FRIENDS") && preview.includes("LOUNGE_PREVIEW_CHAT")],
  ["Live friend RPC remains production-only", lounge.includes("friendConnectionsWithAvatars(user.id)")],
  ["Live message RPC remains production-only", lounge.includes("loungeMessagesWithAvatars()")],
  ["Realtime cleanup remains present", lounge.includes("removeChannel(channel)")],
];

for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
}
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
else console.log(`${checks.length}/${checks.length} Lounge navigation checks passed`);
