# V1CE source parity audit

Reference: `V1CE_Code.txt` (781 lines)  
Active project: Expo Router / React Native app in this repository

## Audit boundary and result

`V1CE_Code.txt` is not a complete file-for-file source archive. It contains:

- full code for `package.json` and ten project files;
- prose-only feature summaries for seven tab pages and `ErrorFallback.tsx`;
- a prose database schema, design guide, navigation map, and dependency list;
- workspace-only package aliases and `catalog:` versions that cannot be installed in this standalone repository.

For that reason, literal line-by-line equality is neither possible nor a safe completion criterion. The active project is a native implementation of the described behavior and includes later source artifacts preserved under `base44-source/`. The two `V1CE_Code.txt` copies are byte-for-byte identical.

## File-by-file source checklist

- [x] `package.json` — standalone npm equivalents replace the source workspace aliases and `catalog:` entries. All active runtime imports and Expo Router native peer dependencies are declared. The lockfile is synchronized.
- [x] `app.json` — valid native bundle identifiers and scheme are present. Source icon/splash paths were omitted because the referenced `assets/images/icon.png` was never supplied.
- [x] `lib/supabase.ts` — client plus profile, friend, and blocked-user entities are represented. Active schema uses `profiles`, UUID relationships, and nullable media/color fields instead of the source's legacy PascalCase/email relationships.
- [x] `constants/colors.ts` — all light/dark design tokens listed by the source are present.
- [x] `hooks/useColors.ts` — provides the source palettes and additionally respects the persisted `ThemeContext` setting.
- [x] `context/AuthContext.tsx` — session startup, anonymous authentication, profile refresh, auth-change subscription, and sign-out are implemented against the active UUID schema.
- [x] `app/_layout.tsx` — all required providers, fonts, splash handling, error boundary, auth gate, and active routes are registered. It intentionally omits the source-only keyboard provider because no active screen imports that dependency.
- [x] `app/index.tsx` — source router-gate behavior is present.
- [x] `app/onboarding.tsx` — all four source steps are present. The submitted email is now persisted to the profile; previously anonymous sessions wrote an empty profile email.
- [x] `app/(tabs)/_layout.tsx` — native/classic tab layouts are present. The active navigation exposes Home, Customize, Lounge, Friends, and Share; Stats, Profile, and Premium remain routable but hidden in the classic layout. This is a product-level difference from the seven visible tabs described by the older text.
- [x] `app/(tabs)/index.tsx` — elapsed-time counter, coin, substance toggles, custom "Other" input, date, and 1-day through 5-year milestones are implemented.
- [x] `app/(tabs)/customize.tsx` — live preview, nine supplied shapes, six named colors, custom hex, twelve number styles, border/number colors, image mode, name, and motto controls are implemented from the archived Base44 source.
- [x] `app/(tabs)/analytics.tsx` — weekly chart and four source stat cards are present. Total check-ins displays `—` because neither the supplied source nor schema defines a check-in entity.
- [x] `app/(tabs)/lounge.tsx` — real friend data, arcade routes, realtime lounge messages, and premium gating replace the source's mock data. A rendered literal `\n` artifact was removed.
- [x] `app/(tabs)/friends.tsx` — request, accept/reject, remove, block/unblock, and lounge-slot operations are implemented with UUID-backed RPCs/tables.
- [x] `app/(tabs)/profile.tsx` — avatar upload/removal, initials, gift badge, display-name update, and sign-out are implemented.
- [x] `app/(tabs)/premium.tsx` — monthly/yearly checkout invocation, premium state, and feature list are implemented. The text source only specified a static `$3.99/mo` button.
- [x] `app/+not-found.tsx` — source styling and theme colors are restored.
- [x] `components/ErrorBoundary.tsx` — fallback injection, error reporting, reset, and child rendering now match the source contract.
- [x] `components/ErrorFallback.tsx` — full fallback, retry action, and development stack-trace modal replace the previous two-line fallback.

## Active files beyond `V1CE_Code.txt`

- [x] `components/CoinFront.tsx`, `constants/coin.ts` — native port of `base44-source/Pasted code.js`.
- [x] `components/games/SnakeGame.tsx`, `components/games/SobrietyRunGame.tsx`, `app/game.tsx` — native ports of the archived game sources.
- [x] `app/widget.tsx`, `app/coin-widget.tsx`, `app/(tabs)/widget.tsx` — share, gift, giveaway, and coin-preview routes; the tab wrapper prevents the Share trigger from resolving to a missing route.
- [x] `context/ThemeContext.tsx` — persisted light/dark override used by `useColors`.
- [x] `supabase/functions/create-checkout/index.ts` — Stripe Checkout session creation.
- [x] `supabase/functions/giveaway-entry/index.ts` — monthly giveaway deduplication and insertion.
- [x] `supabase/migrations/20260922000000_initial_v1ce_schema.sql` — executable baseline for every table, RPC, policy, index, and avatar bucket used by the active app.
- [x] `supabase/migrations/20260922231759_secure_v1ce_api_and_indexes.sql` — authenticated RPC grants and relationship/query indexes.
- [x] `eas.json`, `tsconfig.json`, `.github/workflows/typecheck.yml` — build profiles, strict TypeScript aliases, and CI typecheck.

## Database entity and API checklist

- [x] `profiles` with all source profile fields plus active custom-shape/background fields.
- [x] `friend_connections` with UUID foreign keys, status constraint, lounge state, and unique unordered friend pairs.
- [x] `blocked_users` with UUID foreign keys and unique block pairs.
- [x] `lounge_messages` with sender relationship and 500-character body constraint.
- [x] `giveaway_entries` with one-entry-per-email/month uniqueness.
- [x] `find_profile_by_email(text)` authenticated RPC.
- [x] `get_my_friend_connections()` authenticated RPC with profile names/avatars.
- [x] `get_lounge_messages()` authenticated RPC with sender profile data.
- [x] Row-level security for profiles, friends, blocks, lounge messages, and giveaway entries.
- [x] Public-read/user-folder-write `avatars` storage bucket.
- [ ] Apply the new migrations to the target Supabase project; repository source alone cannot confirm remote deployment state.
- [ ] Configure and verify `STRIPE_SECRET_KEY`, Stripe price IDs, and a payment webhook before treating Premium as production-complete.

## Remaining product decisions (not broken imports)

- [ ] Decide whether Stats, Profile, and Premium should be visible tabs as in `V1CE_Code.txt`, or remain hidden routes as in the active five-tab navigation.
- [ ] Define a `check_ins` entity if “Total Check-ins” and historical weekly analytics must represent persisted data rather than unavailable/derived values.
- [ ] Supply production icon/splash artwork before restoring the icon paths from the source `app.json`.
- [ ] Decide whether Premium is recurring (the checkout function uses subscriptions) or lifetime (the active screen says “One-time purchase · Lifetime access”).
- [ ] Add Stripe webhook fulfillment; checkout creation alone does not set `profiles.is_premium`.

## Broken-import and structural result

- No missing local import targets remain.
- The Share tab now has a matching `(tabs)/widget` route.
- The package lock now contains `expo-glass-effect`, which was declared but absent before this audit.
- Expo Router's required `expo-constants` and `expo-linking` native peers are installed directly.
- Supabase Edge Functions are intentionally excluded from the app TypeScript project because they run in the Deno runtime.
- `npm audit --omit=dev` reports 21 transitive findings in the Expo 54 / Metro toolchain. npm only offers breaking remediation (Expo 57 or a Router downgrade), so those upgrades require a separate SDK migration.
