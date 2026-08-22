// ===========================================================
//  GAME — render loop, partikel, skor, combo, dan siklus
//  game-over otomatis (papan direset lalu lanjut lagi, cocok
//  untuk live streaming tanpa henti).
// ===========================================================

class Particle {
  constructor(x,y,color){
    this.x=x; this.y=y;
    const ang = Math.random()*Math.PI*2;
    const spd = 1.5 + Math.random()*3.5;
    this.vx = Math.cos(ang)*spd;
    this.vy = Math.sin(ang)*spd;
    this.life = 1;
    this.decay = 0.02 + Math.random()*0.02;
    this.r = 1.5 + Math.random()*2.5;
    this.color = color;
  }
  step(){
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.05;
    this.vx *= 0.97;
    this.life -= this.decay;
  }
}

class Game {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = new World(CONFIG.VIRTUAL_W, CONFIG.VIRTUAL_H);
    this.ai = new AutoplayAI(this.world);
    this.particles = [];
    this.score = 0;
    this.round = 1;
    this.comboStreak = 0;
    this.comboTimer = null;
    this.lastDropAt = 0;
    this.dangerHoldStart = null;
    this.resizeCanvas();
    window.addEventListener('resize', ()=> this.resizeCanvas());

    this.scoreEl = document.getElementById('scoreValue');
    this.roundEl = document.getElementById('roundValue');
    this.nextOrbEl = document.getElementById('nextOrbPreview');
    this.comboEl = document.getElementById('comboCallout');
    this.dangerLineEl = document.getElementById('dangerLine');

    this.updateNextOrbPreview();
  }

  resizeCanvas(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width*dpr;
    this.canvas.height = rect.height*dpr;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.scaleX = rect.width / CONFIG.VIRTUAL_W;
    this.scaleY = rect.height / CONFIG.VIRTUAL_H;
    this.dispW = rect.width; this.dispH = rect.height;
  }

  updateNextOrbPreview(){
    const tier = this.ai.peekNextTier();
    const [c1] = TIER_COLORS[tier];
    const r = radiusForTier(tier);
    const size = Math.max(18, Math.min(40, r*1.1));
    this.nextOrbEl.style.width = size+'px';
    this.nextOrbEl.style.height = size+'px';
    this.nextOrbEl.style.background =
      `radial-gradient(circle at 32% 28%, #fff, ${c1} 55%, ${TIER_COLORS[tier][1]} 100%)`;
    this.nextOrbEl.style.boxShadow = `0 0 16px ${c1}99`;
    this.nextOrbEl.style.transform = 'scale(1.12)';
    setTimeout(()=>{ this.nextOrbEl.style.transform = 'scale(1)'; }, 180);
  }

  addScore(tier){
    const pts = Math.round(Math.pow(2, tier) * 5);
    this.score += pts;
    this.scoreEl.textContent = this.score.toLocaleString('id-ID');
  }

  burst(x, y, tier, count=14){
    const [c1] = TIER_COLORS[tier] || TIER_COLORS[0];
    for(let i=0;i<count;i++){
      this.particles.push(new Particle(x, y, c1));
    }
  }

  showCombo(streak){
    if(streak < 2) return;
    this.comboEl.textContent = `COMBO x${streak}`;
    this.comboEl.classList.remove('show');
    void this.comboEl.offsetWidth; // restart animation
    this.comboEl.classList.add('show');
    sfx.combo(streak);
  }

  registerMerge(newBall, x, y){
    // x,y datang dalam koordinat dunia (virtual) -> konversi ke koordinat layar
    const dx = x*this.scaleX, dy = y*this.scaleY;
    this.burst(dx, dy, newBall.tier);
    this.addScore(newBall.tier);
    sfx.merge(newBall.tier);

    this.comboStreak++;
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(()=>{ this.comboStreak = 0; }, 900);
    if(this.comboStreak >= 2) this.showCombo(this.comboStreak);

    if(newBall.tier === CONFIG.TIER_COUNT - 1){
      // mencapai orbit maksimum -> ledakan besar + bonus
      this.burst(dx, dy, newBall.tier, 40);
      this.addScore(newBall.tier + 2);
    }
  }

  maybeDrop(now){
    if(now - this.lastDropAt < CONFIG.DROP_COOLDOWN_MS) return;
    const tier = this.ai.peekNextTier();
    const r = radiusForTier(tier);
    const x = this.ai.chooseDropX(r);
    this.world.spawnAt(x, tier);
    sfx.drop(1 + tier*0.08);
    this.lastDropAt = now;
    this.ai.rollNextTier();
    this.updateNextOrbPreview();
  }

  checkGameOver(now){
    const lineY = CONFIG.VIRTUAL_H * CONFIG.DANGER_LINE_RATIO;
    const danger = this.world.highestSettledAbove(lineY, CONFIG.GAMEOVER_SETTLE_MS);
    if(danger){
      this.triggerGameOver();
    }
  }

  triggerGameOver(){
    sfx.reset();
    // ledakan semua bola sebagai transisi visual
    for(const b of this.world.balls){
      this.burst(b.x*this.scaleX, b.y*this.scaleY, b.tier, 6);
    }
    this.world.clearAll();
    this.round++;
    this.roundEl.textContent = `Ronde ${this.round}`;
    this.lastDropAt = performance.now() + 500; // jeda sesaat sebelum lanjut
  }

  step(now){
    this.maybeDrop(now);
    this.world.step(
      (nb,x,y)=> this.registerMerge(nb,x,y),
      (b)=> sfx.thud()
    );
    this.checkGameOver(now);

    for(let i=this.particles.length-1;i>=0;i--){
      const p = this.particles[i];
      p.step();
      if(p.life <= 0) this.particles.splice(i,1);
    }
  }

  render(){
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.dispW,this.dispH);

    // danger line position sync (CSS already draws it, keep in sync just in case of resize)
    // balls
    for(const b of this.world.balls){
      const x = b.x*this.scaleX, y = b.y*this.scaleY, r = b.r*this.scaleX*b.scaleFx;
      const [c1,c2] = TIER_COLORS[b.tier] || TIER_COLORS[0];

      const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.35, r*0.1, x, y, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, c1);
      grad.addColorStop(1, c2);

      ctx.save();
      ctx.shadowColor = c1;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.stroke();
    }

    // particles
    for(const p of this.particles){
      ctx.globalAlpha = Math.max(p.life,0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
