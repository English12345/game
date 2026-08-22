// ===========================================================
//  MAIN — inisialisasi game, audio, dan media loop
// ===========================================================
(function(){

  const gameCanvas = document.getElementById('gameCanvas');
  const bgCanvas = document.getElementById('bgCanvas');
  const voiceoverPlayer = document.getElementById('voiceoverPlayer');
  const facecamVideo = document.getElementById('facecamVideo');
  const vibeTextEl = document.getElementById('vibeText');

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
  function loop(now){
    game.step(now);
    game.render();
    stars.draw(now);
    requestAnimationFrame(loop);
  }

  async function boot(){
    await voiceover.init();
    await facecam.init();
    facecam.start();
    requestAnimationFrame(loop);

    // Sebagian besar browser memblokir autoplay audio dengan suara sebelum
    // ada interaksi user. Untuk siaran live (OBS browser source), audio
    // biasanya diizinkan; sebagai jaga-jaga kita juga coba start begitu
    // ada klik/tap/keydown pertama.
    sfx.unlock();
    voiceover.start();

    const unlockOnce = () => {
      sfx.unlock();
      voiceover.player.play().catch(()=>{});
      voiceover.start();
      window.removeEventListener('click', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
      window.removeEventListener('touchstart', unlockOnce);
    };
    window.addEventListener('click', unlockOnce);
    window.addEventListener('keydown', unlockOnce);
    window.addEventListener('touchstart', unlockOnce);
  }

  boot();

})();
