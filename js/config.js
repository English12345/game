// ===========================================================
//  KONFIGURASI — silakan ubah angka-angka di sini sesuai selera
// ===========================================================
const CONFIG = {

  // ---------- Folder media otomatis ----------
  VOICEOVER_FOLDER: 'assets/voiceover/',
  VOICEOVER_EXT: 'mp3',
  FACECAM_FOLDER: 'assets/facecam/',
  FACECAM_EXT: 'mp4',

  // Probe otomatis: game akan mengecek file 1,2,3,... sampai
  // menemukan MAX_CONSECUTIVE_MISS file berturut-turut yang tidak ada.
  MAX_PROBE_INDEX: 300,
  MAX_CONSECUTIVE_MISS: 3,

  // Jeda antar voiceover (ms) — diacak di antara MIN dan MAX
  VOICEOVER_GAP_MIN: 2500,
  VOICEOVER_GAP_MAX: 7000,
  VOICEOVER_VOLUME: 1.0,

  FACECAM_VOLUME: 0, // facecam selalu mute (biar tidak bentrok sama voiceover)

  // ---------- Game / physics ----------
  TIER_COUNT: 9,               // jumlah level ukuran orb (kecil -> besar)
  GRAVITY: 0.55,
  BOUNCE_DAMPING: 0.34,
  FRICTION: 0.985,
  BASE_RADIUS: 15,             // radius tier pertama (px, di ruang virtual 400x616)
  RADIUS_GROWTH: 1.28,         // pertambahan radius tiap naik tier

  VIRTUAL_W: 400,
  VIRTUAL_H: 616,

  DROP_COOLDOWN_MS: 620,       // seberapa sering AI menjatuhkan orb baru
  GAMEOVER_SETTLE_MS: 1400,    // berapa lama orb harus menumpuk di atas garis sebelum game over
  DANGER_LINE_RATIO: 0.18,     // posisi garis bahaya (relatif tinggi canvas)

  // Matahari (tier maksimal) tidak bisa merge lagi dengan matahari lain,
  // jadi kalau dibiarkan akan menumpuk terus dan bikin layar penuh &
  // membingungkan penonton baru. Begitu jumlah matahari di papan
  // mencapai angka ini, semuanya meledak sekaligus (supernova) dan
  // papan direset bersih, lalu lanjut ke ronde berikutnya.
  MAX_SUNS_ON_BOARD: 5,

  // Bobot kemunculan tier saat spawn (index 0 = tier termudah)
  SPAWN_WEIGHTS: [40, 30, 18, 8, 4],

  // ---------- SFX synth ----------
  SFX_MASTER_VOLUME: 0.55,

  // ---------- Teks vibe (opsional, tampil di bawah, tidak wajib) ----------
  VIBE_LINES: [
    'Menyusun orbit paling rapi biar semuanya menyatu',
    'Sedikit lagi mencapai orbit terbesar',
    'Setiap gabungan bikin skor makin ngebut',
    'Tetap di sini, orbit berikutnya bakal lebih gede',
    'Chat, tebak orbit apa yang muncul selanjutnya!'
  ],
  VIBE_ROTATE_MS: 6000,
};
