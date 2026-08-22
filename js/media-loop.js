// ===========================================================
//  MEDIA LOOP MANAGER
//  Deteksi otomatis file 1.mp3/1.mp4, 2.mp3/2.mp4, dst di dalam
//  folder yang ditentukan, lalu diputar acak & terus berulang.
//  Cukup upload file bernomor urut ke folder assets/voiceover
//  dan assets/facecam — tidak perlu edit kode apa pun.
// ===========================================================

async function fileExists(url){
  try{
    const res = await fetch(url, { method:'HEAD', cache:'no-store' });
    if(res.ok) return true;
    // Beberapa static host tidak mendukung HEAD dengan baik -> coba GET ringan
    if(res.status === 405 || res.status === 501){
      const res2 = await fetch(url, { method:'GET', cache:'no-store' });
      return res2.ok;
    }
    return false;
  }catch(e){
    return false;
  }
}

async function probeFolder(folder, ext, maxIndex, maxConsecutiveMiss){
  const found = [];
  let miss = 0;
  for(let i=1; i<=maxIndex; i++){
    const url = `${folder}${i}.${ext}`;
    const ok = await fileExists(url);
    if(ok){
      found.push(url);
      miss = 0;
    }else{
      miss++;
      if(miss >= maxConsecutiveMiss) break;
    }
  }
  return found;
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// ---------------- Voiceover ----------------
class VoiceoverLoop {
  constructor(playerEl){
    this.player = playerEl;
    this.playlist = [];
    this.queue = [];
    this.lastPlayed = null;
    this.timer = null;
    this.enabled = false;
  }

  async init(){
    this.playlist = await probeFolder(
      CONFIG.VOICEOVER_FOLDER, CONFIG.VOICEOVER_EXT,
      CONFIG.MAX_PROBE_INDEX, CONFIG.MAX_CONSECUTIVE_MISS
    );
    this.player.volume = CONFIG.VOICEOVER_VOLUME;
    if(this.playlist.length === 0){
      console.log('[Voiceover] Tidak ada file ditemukan di', CONFIG.VOICEOVER_FOLDER,
        '— letakkan 1.mp3, 2.mp3, dst di folder tersebut.');
      return false;
    }
    console.log(`[Voiceover] ${this.playlist.length} file ditemukan.`);
    return true;
  }

  _refillQueue(){
    let list = shuffle(this.playlist);
    // hindari track yang sama persis terulang di batas reshuffle
    if(this.lastPlayed && list[0] === this.lastPlayed && list.length > 1){
      [list[0], list[1]] = [list[1], list[0]];
    }
    this.queue = list;
  }

  start(){
    if(this.playlist.length === 0 || this.enabled) return;
    this.enabled = true;
    this._playNext();
  }

  stop(){
    this.enabled = false;
    clearTimeout(this.timer);
    this.player.pause();
  }

  _playNext(){
    if(!this.enabled) return;
    if(this.queue.length === 0) this._refillQueue();
    const next = this.queue.shift();
    this.lastPlayed = next;
    this.player.src = next;
    this.player.play().catch(()=>{ /* menunggu interaksi user pertama jika diblok browser */ });

    this.player.onended = () => {
      const gap = CONFIG.VOICEOVER_GAP_MIN +
        Math.random() * (CONFIG.VOICEOVER_GAP_MAX - CONFIG.VOICEOVER_GAP_MIN);
      this.timer = setTimeout(()=> this._playNext(), gap);
    };
  }
}

// ---------------- Facecam ----------------
// Pakai 2 elemen <video> ditumpuk & di-crossfade (bukan 1 elemen yang
// gonta-ganti src) supaya TIDAK PERNAH ada frame kosong/hitam di antara
// klip. Video berikutnya di-preload & disiapkan di elemen "belakang"
// selagi video aktif masih diputar, baru di-fade-in begitu klip
// sekarang selesai.
class FacecamLoop {
  constructor(videoEl){
    this.playlist = [];
    this.queue = [];
    this.enabled = false;

    // videoEl asli dipakai sebagai video pertama (A). Video kedua (B)
    // dibuat otomatis dengan meng-clone videoEl, supaya index.html /
    // main.js tidak perlu diubah sama sekali.
    this.videoA = videoEl;
    this.videoB = videoEl.cloneNode();
    this.videoB.removeAttribute('id');
    videoEl.insertAdjacentElement('afterend', this.videoB);

    this.videos = [this.videoA, this.videoB];
    for(const v of this.videos){
      v.muted = true;
      v.playsInline = true;
      v.loop = false;
    }

    this.activeIdx = 0; // index video yg lagi tampil (di this.videos)
  }

  get active(){ return this.videos[this.activeIdx]; }
  get standby(){ return this.videos[1 - this.activeIdx]; }

  async init(){
    this.playlist = await probeFolder(
      CONFIG.FACECAM_FOLDER, CONFIG.FACECAM_EXT,
      CONFIG.MAX_PROBE_INDEX, CONFIG.MAX_CONSECUTIVE_MISS
    );
    for(const v of this.videos) v.volume = CONFIG.FACECAM_VOLUME;
    if(this.playlist.length === 0){
      console.log('[Facecam] Tidak ada file ditemukan di', CONFIG.FACECAM_FOLDER,
        '— letakkan 1.mp4, 2.mp4, dst di folder tersebut.');
      document.getElementById('facecamWrap').style.display = 'none';
      return false;
    }
    console.log(`[Facecam] ${this.playlist.length} file ditemukan.`);
    return true;
  }

  _refillQueue(){
    this.queue = shuffle(this.playlist);
  }

  _nextUrl(){
    if(this.queue.length === 0) this._refillQueue();
    return this.queue.shift();
  }

  start(){
    if(this.playlist.length === 0 || this.enabled) return;
    this.enabled = true;

    // Video pertama langsung tampil begitu siap.
    this.active.src = this._nextUrl();
    this.active.load();
    this.active.classList.add('fc-active');
    this.active.play().catch(()=>{});

    // Sekalian siapkan video kedua di background supaya begitu video
    // pertama selesai, penggantinya sudah siap tanpa jeda.
    this._preloadStandby();
    this._bindEnded(this.active);

    this._watchStall();
  }

  // Preload klip berikutnya ke elemen standby (tak terlihat, opacity 0)
  // dan langsung play() dari sekarang (video-nya tetap tersembunyi via
  // CSS) supaya begitu waktunya tampil, frame sudah "hidup" & halus —
  // bukan baru mulai decode saat itu juga.
  _preloadStandby(){
    const v = this.standby;
    v.classList.remove('fc-active');
    v.onended = null; // cuma video AKTIF yg boleh memicu pergantian
    v.src = this._nextUrl();
    v.load();
    v.play().catch(()=>{});
  }

  _bindEnded(video){
    video.onended = () => {
      if(!this.enabled) return;
      this._crossfadeToStandby();
    };
  }

  _crossfadeToStandby(){
    const finishing = this.active;

    // Tukar peran: standby (sudah preloaded & playing di background)
    // jadi active — CSS transition yang men-fade-in-kan, bukan JS,
    // jadi tidak ada frame kosong.
    this.activeIdx = 1 - this.activeIdx;
    this.active.classList.add('fc-active');
    this._bindEnded(this.active);

    // Video lama di-fade-out lewat CSS, baru dijeda setelah transisi
    // opacity-nya selesai supaya fade-out-nya mulus. onended-nya juga
    // dilepas dulu supaya dia tidak ikut memicu swap lagi selagi cuma
    // jadi buffer di belakang.
    finishing.classList.remove('fc-active');
    finishing.onended = null;
    setTimeout(()=>{ finishing.pause(); }, 360);

    // Isi elemen yang baru saja jadi "belakang" ini dengan klip
    // berikutnya di antrian, siap untuk giliran setelahnya.
    finishing.src = this._nextUrl();
    finishing.load();
    setTimeout(()=>{ finishing.play().catch(()=>{}); }, 380);
  }

  // Kalau video tiba-tiba berhenti (autoplay diblok / stall jaringan),
  // coba play() lagi tiap 2 detik supaya tidak "macet" di 1 frame.
  _watchStall(){
    if(this._stallTimer) clearInterval(this._stallTimer);
    this._stallTimer = setInterval(()=>{
      if(!this.enabled) return;
      if(this.active.paused && this.active.readyState >= 2){
        this.active.play().catch(()=>{});
      }
    }, 2000);
  }

  // Dipanggil ulang dari gesture tap pertama user untuk memastikan
  // video benar-benar jalan di browser yang ketat soal autoplay.
  kick(){
    if(this.active.paused) this.active.play().catch(()=>{});
    if(this.standby.paused) this.standby.play().catch(()=>{});
  }
}
