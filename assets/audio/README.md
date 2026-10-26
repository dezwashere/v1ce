# V1CE card cues

These three short instrumental cues were synthesized specifically for V1CE using
`scripts/generate-card-cues.py`. They contain no third-party recordings or samples
and make no network requests. The generator and WAV assets are part of this project.

The existing Arcade / Lofi / Synth choices select these bundled cues. Opening a
card stays silent; Play Card Music starts sound. Changing the choice stops the
previous cue. Closing, leaving, or backgrounding the card stops playback. No
microphone permission, recording, background audio entitlement, streaming account,
or ongoing media hosting is required.

These are presentation effects in the existing birthday modal. The current lounge
share is text only: it does not save or transmit a playable card or its soundtrack.
Persistent recipient cards and milestone-card delivery need a separate data model.
