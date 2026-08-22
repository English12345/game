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
class FacecamLoop {
  constructor(videoEl){
    this.video = videoEl;
    this.playlist = [];
    this.queue = [];
    this.enabled = false;
  }

  async init(){
    this.playlist = await probeFolder(
      CONFIG.FACECAM_FOLDER, CONFIG.FACECAM_EXT,
      CONFIG.MAX_PROBE_INDEX, CONFIG.MAX_CONSECUTIVE_MISS
    );
    this.video.volume = CONFIG.FACECAM_VOLUME;
    this.video.muted = true;
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

  start(){
    if(this.playlist.length === 0 || this.enabled) return;
    this.enabled = true;
    this._playNext();
  }

  _playNext(){
    if(!this.enabled) return;
    if(this.queue.length === 0) this._refillQueue();
    const next = this.queue.shift();
    this.video.src = next;
    this.video.play().catch(()=>{});
    this.video.onended = () => this._playNext();
  }
}
