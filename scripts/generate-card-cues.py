"""Generate V1CE's short instrumental cues offline; no samples or network access."""
import math
import pathlib
import struct
import wave

OUT = pathlib.Path(__file__).resolve().parents[1] / 'assets' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
RATE = 22050
SCORES = {
    'arcade': ([60, 67, 64, 72, 69, 67, 74, 72, 64, 67, 69, 72], .32),
    'lofi': ([57, 64, 60, 67, 62, 65, 69, 64, 60, 62, 64, 57], .48),
    'synth': ([60, 64, 71, 67, 74, 69, 76, 72, 67, 71, 64, 60], .4),
}
for name, (notes, beat) in SCORES.items():
    duration = len(notes) * beat + .5
    samples = []
    for i in range(round(duration * RATE)):
        t = i / RATE
        value = 0.
        for index, note in enumerate(notes):
            age = t - index * beat
            length = beat * 1.3
            if not 0 <= age < length:
                continue
            frequency = 440 * 2 ** ((note - 69) / 12)
            attack = min(1, age / .025)
            release = min(1, (length - age) / .12)
            envelope = attack * release * math.exp(-age * (4 if name == 'arcade' else 2))
            phase = 2 * math.pi * frequency * age
            tone = math.sin(phase)
            if name == 'arcade': tone += .22 * math.sin(3 * phase) + .08 * math.sin(5 * phase)
            if name == 'synth': tone += .2 * math.sin(phase * 1.003) + .12 * math.sin(2 * phase)
            if name == 'lofi': tone += .18 * math.sin(phase / 2)
            value += .24 * envelope * tone
        samples.append(round(max(-.8, min(.8, value)) * 32767))
    target = OUT / f'{name}.wav'
    with wave.open(str(target), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
    print(f'{name}: {duration:.2f}s, {target.stat().st_size} bytes, peak {max(abs(s) for s in samples)/32767:.3f}')
