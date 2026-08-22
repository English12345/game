#!/usr/bin/env python3
"""
generate_sfx.py — (OPSIONAL) generator efek suara ke file .wav.

Game ini SUDAH menghasilkan semua efek suara secara langsung di
browser lewat Web Audio API (lihat js/audio.js) — jadi script ini
TIDAK WAJIB dijalankan. Semua suara sudah 100% aman untuk
monetisasi karena murni disintesis, bukan sample/rekaman orang lain.

Script ini disediakan sebagai BONUS kalau kamu mau punya file .wav
fisik (misal untuk dipakai di software lain / OBS / editor video),
dengan metode sintesis yang sama (sine wave, envelope, noise sintesis)
— tanpa dependency eksternal (numpy dsb.), hanya modul bawaan Python.

Cara pakai:
    python3 scripts/generate_sfx.py
    -> file akan muncul di assets/sfx/
"""
import math
import os
import struct
import wave
import random

SAMPLE_RATE = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sfx')


def envelope(i, n, attack, decay):
    a = int(n * attack)
    d = int(n * decay)
    if i < a:
        return i / max(a, 1)
    if i > n - d:
        return max(0.0, (n - i) / max(d, 1))
    return 1.0


def write_wav(filename, samples):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, filename)
    with wave.open(path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        frames = b''.join(struct.pack('<h', int(max(-1, min(1, s)) * 32767)) for s in samples)
        f.writeframes(frames)
    print(f'  -> {path}')


def tone_drop(pitch=1.0, duration=0.2):
    n = int(SAMPLE_RATE * duration)
    out = []
    for i in range(n):
        t = i / SAMPLE_RATE
        freq = 260 * pitch * (1 - t / duration) + 120 * pitch * (t / duration)
        s = math.sin(2 * math.pi * freq * t)
        out.append(s * envelope(i, n, 0.02, 0.6) * 0.5)
    return out


def tone_merge(tier=0, duration=0.4):
    n = int(SAMPLE_RATE * duration)
    base = 320 + tier * 46
    out = [0.0] * n
    for mult, amp in [(1, 0.35), (1.5, 0.22), (2, 0.15)]:
        for i in range(n):
            t = i / SAMPLE_RATE
            freq = base * mult * (1 + 0.6 * (t / duration))
            s = math.sin(2 * math.pi * freq * t)
            out[i] += s * envelope(i, n, 0.02, 0.7) * amp
    return out


def noise_thud(duration=0.08):
    n = int(SAMPLE_RATE * duration)
    out = []
    for i in range(n):
        s = (random.random() * 2 - 1) * ((1 - i / n) ** 3)
        out.append(s * 0.3)
    return out


def tone_reset(duration=0.6):
    n = int(SAMPLE_RATE * duration)
    out = []
    for i in range(n):
        t = i / SAMPLE_RATE
        freq = 800 * math.exp(-3.2 * t / duration) + 60
        s = 2 * (freq * t - math.floor(freq * t + 0.5))  # sawtooth-ish
        out.append(s * envelope(i, n, 0.02, 0.7) * 0.35)
    return out


def main():
    print('Membuat efek suara sintesis (copyright-free)...')
    write_wav('drop.wav', tone_drop())
    for tier in range(5):
        write_wav(f'merge_tier{tier}.wav', tone_merge(tier))
    write_wav('thud.wav', noise_thud())
    write_wav('reset.wav', tone_reset())
    print('Selesai. Semua file ada di assets/sfx/')


if __name__ == '__main__':
    main()
