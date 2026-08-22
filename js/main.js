// ===========================================================
//  MAIN — inisialisasi game, audio, media loop, dan layar
//  pembuka "Tap untuk Mulai" (wajib ada 1x sentuhan supaya
//  browser mengizinkan suara + fullscreen — ini aturan
//  keamanan browser dan tidak bisa dilewati sama sekali).
// ===========================================================
(function(){

  const gameCanvas = document.getElementById('gameCanvas');
  const bgCanvas = document.getElementById('bgCanvas');
  const voiceoverPlayer = document.getElementById('voiceoverPlayer');
  const facecamVideo = document.getElementById('facecamVideo');
  const vibeTextEl = document.getElementById('vibeText');
  const startOverlay = document.getElementById('startOverlay');
  const startBtn = document.getElementById('startBtn');

  const game = new Game(gameCanvas);
  const stars = new Starfield(bgCanvas);
  const voiceover = new VoiceoverLoop(voiceoverPlayer);
  const facecam = new FacecamLoop(facecamVideo);

  // Vibe text rotation (opsional, murni dekorasi)
  let vibeIdx = 0;
  function rotateVibe(){
    vibeIdx = (vibeIdx+1) % CONFIG.VIBE_LINES.length;
    vibeTextEl.style.opacity = 0;
    setTimeout(()=>{
      vibeTextEl.textContent = CONFIG.VIBE_LINES[vibeIdx];
      vibeTextEl.style.opacity = 0.9;
    }, 400);
  }
  setInterval(rotateVibe, CONFIG.VIBE_ROTATE_MS);

  // Main render loop
  let loopStarted = false;
  function loop(now){
    game.step(now);
    game.render(now);
    stars.draw(now);
    requestAnimationFrame(loop);
  }

  function requestFullscreenSafe(){
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen ||
                el.mozRequestFullScreen || el.msRequestFullscreen;
    if(req){
      req.call(el).catch(()=>{ /* sebagian browser/HP tidak dukung, tidak apa2 */ });
    }
    if(screen.orientation && screen.orientation.lock){
      screen.orientation.lock('portrait').catch(()=>{});
    }
  }

  function startExperience(){
    requestFullscreenSafe();

    sfx.unlock();
    voiceover.start();
    voiceoverPlayer.play().catch(()=>{});

    facecam.kick();

    if(!loopStarted){
      loopStarted = true;
      requestAnimationFrame(loop);
    }

    startOverlay.classList.add('hidden');
  }

  async function boot(){
    await voiceover.init();
    await facecam.init();
    facecam.start(); // mulai loop video (muted) di belakang layar pembuka juga

    startBtn.addEventListener('click', startExperience);
    startOverlay.addEventListener('click', startExperience);

    // Jika halaman dibuka di dalam OBS Browser Source (audio & fullscreen
    // biasanya sudah diizinkan otomatis oleh OBS), langsung mulai tanpa
    // menunggu tap supaya tidak ada layar pembuka yang tertangkap kamera.
    const isProbablyObs = /OBS/i.test(navigator.userAgent) || window.obsstudio;
    if(isProbablyObs){
      startExperience();
    }
  }

  boot();

})();
