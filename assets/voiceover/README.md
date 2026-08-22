# Folder Voice Over

Taruh file voice over kamu di sini dengan nama **angka urut**:

```
1.mp3
2.mp3
3.mp3
4.mp3
...
```

Aturan:
- Format harus `.mp3`
- Nama file **hanya angka** (tanpa spasi/teks tambahan), dimulai dari `1`
- Boleh berapa pun jumlahnya, game akan otomatis mendeteksi semuanya saat halaman dibuka
- Nomor boleh tidak berurutan sempurna (misal ada lompat dari 5 ke 7), asal tidak ada lebih dari 3 nomor kosong berturut-turut — kalau ragu, usahakan tetap urut 1,2,3,... tanpa bolong

Cara kerja saat live:
- Semua file diacak urutannya (shuffle), lalu diputar satu per satu
- Ada jeda singkat acak (2.5–7 detik, bisa diubah di `js/config.js`) antar clip supaya terdengar natural
- Setelah semua file habis diputar, urutan diacak ulang dan diputar lagi dari awal — begitu terus tanpa henti (loop selamanya)

File ini (README.md) tidak akan mengganggu, karena hanya file `angka.mp3` yang dibaca oleh game.
