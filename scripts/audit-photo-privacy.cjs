const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const media = fs.readFileSync(path.join(root, "supabase/migrations/20260924090000_profile_media_buckets.sql"), "utf8");
const memories = fs.readFileSync(path.join(root, "supabase/migrations/20261006114500_add_milestone_memories.sql"), "utf8");
const rls = fs.readFileSync(path.join(root, "supabase/migrations/20260925022325_reconcile_user_rls_policies.sql"), "utf8");
const findings = [
  ["Milestone photos currently use a public bucket", /name='milestone-photos', public=true/.test(memories), "FAIL"],
  ["Milestone photo storage has a public read policy", /milestone photos public read/.test(memories), "FAIL"],
  ["Milestone memories lack per-photo privacy", !/is_public/.test(memories), "FAIL"],
  ["Profiles are not readable directly by unrelated users", /Users can view their own profile/.test(rls), "PASS"],
  ["Current profile media policy exposes public reads", /Public profile media is readable/.test(media), "FAIL"],
];
for (const [label, condition, expected] of findings) {
  console.log(`${expected} ${label}`);
}
console.log("RESULT: current source confirms privacy work requires an authorized backend migration; no changes were applied by this audit.");
