// ===========================================================
//  BACKGROUND — starfield ambient premium, murni digambar
//  dengan canvas (tidak pakai gambar/aset eksternal).
//  Terdiri dari: kabut nebula lembut, lapisan bintang jauh,
//  lapisan bintang dekat yang berkelap-kelip warna-warni,
//  dan bintang jatuh sesekali untuk aksen "wah".
// ===========================================================
class Starfield {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.farStars = [];
    this.nearStars = [];
    this.nebulae = [];
    this.shooting = [];
    this.nextShootAt = 0;
    this.resize();
    window.addEventListener('resize', ()=> this.resize());
  }

  resize(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.w = rect.width; this.h = rect.height;

    // Lapisan bintang jauh — kecil, padat, hampir putih.
    const farCount = Math.floor((this.w*this.h)/2600);
    this.farStars = Array.from({length: farCount}, ()=> ({
      x: Math.random()*this.w,
      y: Math.random()*this.h,
      r: Math.random()*1.1 + 0.35,
      s: Math.random()*0.5 + 0.15,
      phase: Math.random()*Math.PI*2,
    }));

    // Lapisan bintang dekat — lebih besar, warna-warni, berkelip jelas.
    const palette = ['#ffffff', '#cfe0ff', '#bfe9ff', '#ffd9a0', '#e6c8ff', '#ffc2de'];
    const nearCount = Math.floor((this.w*this.h)/13000);
    this.nearStars = Array.from({length: nearCount}, ()=> ({
      x: Math.random()*this.w,
      y: Math.random()*this.h,
      r: Math.random()*1.7 + 1.1,
      s: Math.random()*0.7 + 0.35,
      phase: Math.random()*Math.PI*2,
      color: palette[Math.floor(Math.random()*palette.length)],
      spike: Math.random() < 0.22, // sebagian dikasih kilau bintang 4-arah
    }));

    // Kabut nebula raksasa, sangat pelan bergerak, warna lembut.
    const nebulaColors = [
      'rgba(124,108,255,0.16)',
      'rgba(53,230,224,0.13)',
      'rgba(255,111,165,0.11)',
      'rgba(255,204,102,0.09)',
    ];
    this.nebulae = nebulaColors.map((color, i)=> ({
      x: (0.15 + 0.7*Math.random())*this.w,
      y: (0.1 + 0.8*Math.random())*this.h,
      r: Math.max(this.w,this.h) * (0.35 + Math.random()*0.25),
      color,
      driftX: (Math.random()-0.5)*0.006,
      driftY: (Math.random()-0.5)*0.006,
      seed: i*137.5,
    }));
  }

  spawnShootingStar(){
    const fromLeft = Math.random() < 0.5;
    const y0 = Math.random()*this.h*0.5;
    this.shooting.push({
      x: fromLeft ? -20 : this.w+20,
      y: y0,
      vx: (fromLeft ? 1 : -1) * (5 + Math.random()*3),
      vy: 2.4 + Math.random()*1.4,
      life: 1,
      len: 70 + Math.random()*50,
    });
  }

  draw(t){
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.w,this.h);

    // --- Nebula: kabut warna besar yang mengambang pelan ---
    for(const n of this.nebulae){
      const dx = Math.sin(t*0.00007 + n.seed) * this.w * 0.06;
      const dy = Math.cos(t*0.00006 + n.seed) * this.h * 0.05;
      const grad = ctx.createRadialGradient(n.x+dx, n.y+dy, 0, n.x+dx, n.y+dy, n.r);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,this.w,this.h);
    }

    // --- Bintang jauh: kecil & padat ---
    for(const st of this.farStars){
      const tw = 0.5 + 0.5*Math.sin(t*0.001*st.s + st.phase);
      ctx.globalAlpha = 0.12 + tw*0.5;
      ctx.fillStyle = '#dbe1ff';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fill();
    }

    // --- Bintang dekat: besar, berwarna, sebagian berkilau ---
    for(const st of this.nearStars){
      const tw = 0.5 + 0.5*Math.sin(t*0.0011*st.s + st.phase);
      const alpha = 0.35 + tw*0.65;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = st.color;
      ctx.shadowColor = st.color;
      ctx.shadowBlur = st.r * 4;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fill();

      if(st.spike){
        ctx.globalAlpha = alpha*0.6;
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 0.6;
        const sp = st.r*3.2;
        ctx.beginPath();
        ctx.moveTo(st.x-sp, st.y); ctx.lineTo(st.x+sp, st.y);
        ctx.moveTo(st.x, st.y-sp); ctx.lineTo(st.x, st.y+sp);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // --- Bintang jatuh sesekali, aksen premium ---
    if(t > this.nextShootAt){
      this.spawnShootingStar();
      this.nextShootAt = t + 4200 + Math.random()*6500;
    }
    for(let i=this.shooting.length-1; i>=0; i--){
      const sh = this.shooting[i];
      sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.014;
      if(sh.life <= 0 || sh.y > this.h+30){ this.shooting.splice(i,1); continue; }
      const tailX = sh.x - Math.sign(sh.vx)*sh.len;
      const tailY = sh.y - sh.len*(sh.vy/Math.hypot(sh.vx,sh.vy));
      const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${sh.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }
  }
}
