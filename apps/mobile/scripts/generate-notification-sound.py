"""Suara notifikasi Tekosue ("pop-ding"), disintesis dari nol.

    python apps/mobile/scripts/generate-notification-sound.py

Menulis apps/mobile/assets/sounds/tekosoe.wav (didaftarkan lewat plugin expo-notifications di
app.json, dipakai channel Android `tekosoe-chime` dan push dari apps/api). Butuh build native ulang.
"""
import math
import os
import struct
import wave

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds', 'tekosoe.wav')


def new(sec):
    return [0.0] * int(sec * SR)


def note(buf, start, freq, amp, length=0.45):
    # Marimba: sinus dasar + parsial 4x dan 10x yang cepat hilang.
    parts = ((1, 1, 9), (4.0, .18, 40), (10.0, .04, 80))
    s0 = int(start * SR)
    for i in range(int(length * SR)):
        t = i / SR
        atk = min(1, t / 0.0025)
        v = sum(a * math.sin(2 * math.pi * freq * r * t) * math.exp(-t * d) for r, a, d in parts)
        if s0 + i < len(buf):
            buf[s0 + i] += amp * atk * v


def pop(buf, start, f0, f1, amp, length=0.05):
    # Gelembung: sinus pendek yang nadanya naik cepat, amplitudo setengah sinus.
    s0 = int(start * SR)
    ph = 0.0
    n = int(length * SR)
    for i in range(n):
        u = i / n
        ph += (f0 + (f1 - f0) * u ** 0.5) / SR
        if s0 + i < len(buf):
            buf[s0 + i] += amp * math.sin(math.pi * u) * math.sin(2 * math.pi * ph)


def room(buf):
    # Gema ruangan kecil supaya terdengar "bulat", tidak kering.
    out = buf[:]
    for d, g in ((0.031, .22), (0.047, .16), (0.071, .10), (0.103, .06)):
        k = int(d * SR)
        for i in range(k, len(out)):
            out[i] += buf[i - k] * g
    return out


def save(buf, path):
    buf = room(buf)
    pk = max(abs(x) for x in buf)
    fade = int(0.04 * SR)
    n = len(buf)
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        fr = bytearray()
        for i, x in enumerate(buf):
            x = x / pk * 0.7
            if i > n - fade:
                x *= (n - i) / fade
            fr += struct.pack('<h', int(x * 32767))
        w.writeframes(bytes(fr))


E6, C7 = 1318.5, 2093.0

# Pop-ding: gelembung teko, lalu dua ketukan marimba naik (E6 -> C7).
a = new(0.75)
pop(a, 0.00, 500, 1300, 0.55)
note(a, 0.07, E6, 0.8)
note(a, 0.17, C7, 0.9, length=0.55)
save(a, OUT)
print('wrote', os.path.normpath(OUT))
