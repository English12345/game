# Orbit Merge — Game Satisfying untuk Live YouTube

Game "merge orb" bergaya premium/kosmik yang **bermain otomatis (AI autoplay)**,
dibuat khusus untuk jadi konten live streaming YouTube yang bikin penonton
betah nonton lama karena visual & suara yang satisfying tanpa henti.

## Fitur

- **Autoplay penuh** — tidak perlu ada yang mengontrol, game jalan sendiri 24/7, cocok untuk live non-stop.
- **Visual premium** — tema luar angkasa (nebula, starfield, planet 3D kaca berkilau), bukan tampilan "template murahan".
- **Planet asli, bukan bulatan polos** — urut dari kecil ke besar: Bulan → Merkurius → Mars → Venus → Bumi → Uranus → Saturnus (bercincin) → Jupiter (bercorak pita) → **Matahari** (menyala-nyala, glow berdenyut). Tiap planet punya gradient 3D + highlight kaca + rim light.
- **Merge planet yang satisfying** — dua planet setara bertabrakan → menyatu jadi planet berikutnya yang lebih besar, dengan partikel & efek combo.
- **Efek suara 100% aman hak cipta** — semua SFX (drop, merge, combo, thud, reset) di-generate langsung lewat Web Audio API, bukan sample dari orang lain. Aman untuk monetisasi YouTube.
- **Voice over otomatis** — tinggal upload file `1.mp3`, `2.mp3`, `3.mp3`, dst ke folder `assets/voiceover/`. Game otomatis mendeteksi, mengacak urutan, dan memutar berulang selamanya (loop) dengan jeda natural di antaranya.
- **Video "orang main" otomatis** — sama seperti voiceover, tinggal upload `1.mp4`, `2.mp4`, dst ke `assets/facecam/`. Ditampilkan sebagai lingkaran kecil di HUD atas, otomatis mute, diacak & loop terus.
- **Auto game-over & lanjut lagi** — kalau papan penuh, otomatis meledak lalu mulai ronde baru. Game tidak pernah benar-benar berhenti — pas untuk live.
- Full responsif untuk layar HP (portrait), pas untuk direkam sebagai browser source di OBS/aplikasi live streaming di HP.

## Struktur Folder

```
orbit-merge/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js        <- semua pengaturan gampang diubah di sini
│   ├── audio.js         <- sfx sintesis (aman hak cipta)
│   ├── media-loop.js    <- deteksi & loop voiceover + facecam otomatis
│   ├── physics.js        <- simulasi fisika bola
│   ├── autoplay.js       <- AI yang "main" game-nya
│   ├── background.js     <- starfield ambient
│   ├── game.js           <- render loop, skor, particle
│   └── main.js           <- inisialisasi semua
├── assets/
│   ├── voiceover/         <- UPLOAD 1.mp3, 2.mp3, ... di sini
│   ├── facecam/            <- UPLOAD 1.mp4, 2.mp4, ... di sini
│   └── sfx/                 <- (opsional) hasil generate_sfx.py
└── scripts/
    ├── serve.py            <- server lokal untuk testing
    └── generate_sfx.py     <- (opsional) bikin file .wav sintesis
```

## Cara Pakai (Local Testing)

1. Install Python 3 (biasanya sudah ada di macOS/Linux; di Windows download dari python.org).
2. Buka terminal di folder `orbit-merge`, jalankan:
   ```
   python3 scripts/serve.py
   ```
3. Buka `http://localhost:8000` di browser.

> Kenapa tidak buka `index.html` langsung dengan double-click? Karena fitur
> auto-deteksi file voiceover/facecam butuh server (bukan `file://`).
> GitHub Pages nanti otomatis jadi server, jadi ini hanya perlu untuk testing lokal.
> `serve.py` versi ini sudah mendukung *HTTP Range request*, jadi video
> facecam akan diputar lancar (server Python bawaan biasanya TIDAK
> mendukung ini, yang bisa membuat video terlihat "macet"/hanya
> menampilkan 1 frame diam).

## Kenapa Ada Layar "Tap untuk Mulai"?

Semua browser (Chrome, Safari, dll) **memblokir suara otomatis dan
fullscreen otomatis** kalau belum ada sentuhan/klik dari pengguna —
ini aturan keamanan browser dan tidak bisa dilewati dengan cara
apa pun (termasuk lewat kode). Karena itu game ini menampilkan satu
layar pembuka "▶ MULAI": begitu di-tap sekali, dalam waktu bersamaan
layar akan **full screen otomatis**, **suara voice over langsung
menyala**, dan **video facecam dipastikan benar-benar berjalan**
(bukan cuma diam di frame pertama).

- Kalau kamu live lewat **OBS Studio (Browser Source)**: OBS biasanya
  sudah mengizinkan autoplay+suara secara default, jadi game akan
  otomatis mulai sendiri tanpa perlu tap sama sekali (sudah dideteksi otomatis di kode).
- Kalau kamu live langsung dari **HP** (screen record / cast layar
  HP ke aplikasi live streaming): tap tombol "▶ MULAI" sekali sebelum
  mulai merekam/live, setelah itu semuanya berjalan otomatis tanpa disentuh lagi.

## Cara Upload ke GitHub Pages

1. Buat repository baru di GitHub (atau pakai repo yang sudah ada).
2. Upload/push semua isi folder `orbit-merge/` ke repo tersebut (bisa lewat GitHub Desktop, `git push`, atau upload manual lewat web GitHub).
3. Di repo, buka **Settings → Pages**.
4. Pada **Source**, pilih branch `main` (atau `master`) dan folder `/ (root)`, lalu **Save**.
5. Tunggu 1–2 menit, link live akan muncul di halaman yang sama, biasanya:
   ```
   https://<username>.github.io/<nama-repo>/
   ```
6. Upload file voice over (`1.mp3`, `2.mp3`, ...) ke folder `assets/voiceover/`, dan video (`1.mp4`, `2.mp4`, ...) ke `assets/facecam/`, lalu push lagi. Tidak perlu ubah kode apa pun — game otomatis mendeteksinya.

## Menggunakan untuk Live Streaming

- Buka link GitHub Pages tadi di **OBS Studio** (Browser Source) atau di browser HP yang layarnya kamu cast/record ke aplikasi live streaming.
- Tap tombol **▶ MULAI** sekali (kalau bukan lewat OBS) — layar langsung full screen dan semuanya mulai berjalan otomatis: planet jatuh & menyatu, efek suara muncul, voice over bergantian terus-menerus, video "orang main" berputar besar di pojok atas kanan.
- Biarkan berjalan — game tidak akan pernah berhenti sendiri (auto-reset kalau papan penuh).

## Kustomisasi Cepat (di `js/config.js`)

| Pengaturan | Fungsi |
|---|---|
| `DROP_COOLDOWN_MS` | Seberapa sering orb baru dijatuhkan (makin kecil = makin cepat/ramai) |
| `GAMEOVER_SETTLE_MS` | Berapa lama tumpukan harus "penuh" sebelum papan direset |
| `VOICEOVER_GAP_MIN/MAX` | Jeda hening antar voice over (ms) |
| `SPAWN_WEIGHTS` | Peluang kemunculan tiap ukuran orb saat spawn |
| `SFX_MASTER_VOLUME` | Volume efek suara game |
| `VIBE_LINES` | Teks kecil di bawah layar (opsional, murni dekorasi) |

## Tentang Keamanan Hak Cipta

- **Efek suara game**: 100% disintesis lewat kode (oscillator/noise), tidak ada sample audio dari pihak lain sama sekali → aman untuk monetisasi.
- **Voice over & video facecam**: kamu upload sendiri, jadi pastikan itu suara/rekaman kamu sendiri (atau yang kamu punya haknya) supaya tetap aman untuk monetisasi YouTube.
- **Visual game**: semua digambar dengan kode (canvas/CSS), tidak memakai aset gambar berhak cipta pihak lain.
- **Font**: memakai Google Fonts (Space Grotesk & Inter), keduanya open source dan gratis dipakai untuk keperluan komersial.

Selamat live streaming! 🚀
