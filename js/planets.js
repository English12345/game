// ===========================================================
//  PLANETS — data & rendering "kaca 3D berkilau" untuk tiap
//  tier orb, diurutkan dari terkecil ke terbesar. Tier terakhir
//  adalah Matahari yang menyala-nyala. Warna dibuat lebih jenuh
//  dan beragam supaya tampil premium & colorful di layar.
// ===========================================================

const PLANETS = [
  { // tier 0
    name: 'Bulan',
    base1: '#ffffff', base2: '#a6acc9',
    rim: '#ffffff',
    particle: '#cfd2e6',
    craters: true,
  },
  { // tier 1
    name: 'Merkurius',
    base1: '#ffcf9e', base2: '#a1541f',
    rim: '#ffe3ba',
    particle: '#e79a55',
    craters: true,
  },
  { // tier 2
    name: 'Mars',
    base1: '#ff9a5c', base2: '#c1290f',
    rim: '#ffcfa0',
    particle: '#ff6a35',
    craters: true,
  },
  { // tier 3
    name: 'Venus',
    base1: '#ffe08a', base2: '#e08a1f',
    rim: '#fff2c4',
    particle: '#ffc94d',
    swirl: '#ffb84d',
  },
  { // tier 4
    name: 'Bumi',
    base1: '#7fd6ff', base2: '#0f5ec9',
    accent: '#3fe08a',
    rim: '#d4f6ff',
    particle: '#54c8ff',
    clouds: true,
  },
  { // tier 5
    name: 'Uranus',
    base1: '#a6ffe8', base2: '#189e9b',
    rim: '#e6fffb',
    particle: '#5be8d6',
    hasThinRing: true,
  },
  { // tier 6
    name: 'Saturnus',
    base1: '#ffe9a8', base2: '#d67f2c',
    rim: '#fff6da',
    particle: '#ffcf6e',
    hasRing: true,
  },
  { // tier 7
    name: 'Jupiter',
    base1: '#ffd9a6', base2: '#a8501f',
    bandColor: '#e2743a',
    rim: '#ffedcf',
    particle: '#ff9c5c',
    storm: '#ff5f6d',
  },
  { // tier 8 (max) — Matahari
    name: 'Matahari',
    base1: '#fffbe0', base2: '#ff4d1f',
    rim: '#ffffff',
    particle: '#ffcc66',
    isSun: true,
  },
];

function planetFor(tier){
  return PLANETS[Math.min(tier, PLANETS.length-1)];
}

// Menggambar satu planet dengan gaya kaca 3D berkilau + detail
// permukaan supaya terasa premium dan warna-warni.
// x,y,r dalam koordinat layar (sudah discale).
function drawPlanet(ctx, x, y, r, tier, time){
  const p = planetFor(tier);

  ctx.save();

  // --- Corona / glow luar untuk Matahari ---
  if(p.isSun){
    const pulse = 1 + Math.sin(time*0.003)*0.08;
    const flareR = r * (2.0 * pulse);
    const glow = ctx.createRadialGradient(x,y, r*0.4, x,y, flareR);
    glow.addColorStop(0, 'rgba(255,204,102,0.6)');
    glow.addColorStop(0.45, 'rgba(255,120,50,0.3)');
    glow.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x,y,flareR,0,Math.PI*2);
    ctx.fill();

    // lidah api kecil di sekeliling matahari
    ctx.save();
    ctx.strokeStyle = 'rgba(255,204,120,0.55)';
    ctx.lineWidth = r*0.09;
    ctx.lineCap = 'round';
    for(let i=0;i<8;i++){
      const ang = (i/8)*Math.PI*2 + time*0.0006;
      const flick = r*0.16*(0.6+0.4*Math.sin(time*0.005+i));
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang)*r*0.92, y + Math.sin(ang)*r*0.92);
      ctx.lineTo(x + Math.cos(ang)*(r*1.25+flick), y + Math.sin(ang)*(r*1.25+flick));
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Cincin tipis Uranus ---
  if(p.hasThinRing){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(0.5);
    ctx.scale(1, 0.22);
    ctx.beginPath();
    ctx.arc(0,0, r*1.55, 0, Math.PI*2);
    ctx.lineWidth = r*0.1;
    ctx.strokeStyle = 'rgba(200,255,246,0.5)';
    ctx.stroke();
    ctx.restore();
  }

  // --- Cincin Saturnus (digambar SEBELUM bola supaya bagian belakang keliatan tertutup) ---
  if(p.hasRing){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(-0.32);
    ctx.scale(1, 0.34);
    // cincin luar lebar, gradasi warna keemasan-pink supaya lebih hidup
    const ringGrad = ctx.createRadialGradient(0,0, r*1.15, 0,0, r*2.05);
    ringGrad.addColorStop(0, 'rgba(255,229,180,0.15)');
    ringGrad.addColorStop(0.5, 'rgba(255,214,150,0.65)');
    ringGrad.addColorStop(0.75, 'rgba(255,180,210,0.45)');
    ringGrad.addColorStop(1, 'rgba(255,214,150,0.1)');
    ctx.beginPath();
    ctx.arc(0,0, r*1.85, 0, Math.PI*2);
    ctx.lineWidth = r*0.42;
    ctx.strokeStyle = ringGrad;
    ctx.stroke();
    // garis pemisah gelap tipis di tengah cincin
    ctx.beginPath();
    ctx.arc(0,0, r*1.85, 0, Math.PI*2);
    ctx.lineWidth = r*0.04;
    ctx.strokeStyle = 'rgba(90,60,30,0.35)';
    ctx.stroke();
    ctx.restore();
  }

  // --- Badan planet: gradient dasar (kaca 3D), kontras lebih tinggi ---
  const grad = ctx.createRadialGradient(
    x - r*0.35, y - r*0.4, r*0.05,
    x, y, r*1.05
  );
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.2, p.base1);
  grad.addColorStop(0.7, p.base1);
  grad.addColorStop(1, p.base2);

  ctx.save();
  ctx.shadowColor = p.isSun ? '#ffb347' : p.base1;
  ctx.shadowBlur = p.isSun ? 30 : 14;
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // --- Kawah untuk Bulan/Merkurius/Mars ---
  if(p.craters){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.clip();
    const craterSpots = [
      [-0.32,-0.1,0.22], [0.18,-0.35,0.15], [0.3,0.22,0.19],
      [-0.1,0.38,0.13], [0.05,0.02,0.1],
    ];
    for(const [cx,cy,cr] of craterSpots){
      ctx.beginPath();
      ctx.arc(x+r*cx, y+r*cy, r*cr, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x+r*cx - r*cr*0.25, y+r*cy - r*cr*0.25, r*cr*0.55, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Swirl awan keemasan untuk Venus ---
  if(p.swirl){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.clip();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = p.swirl;
    ctx.lineWidth = Math.max(1, r*0.09);
    for(let i=0;i<3;i++){
      const yy = y - r*0.5 + i*r*0.5 + Math.sin(time*0.0007+i)*r*0.06;
      ctx.beginPath();
      ctx.moveTo(x-r, yy);
      ctx.quadraticCurveTo(x, yy - r*0.3, x+r, yy);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // --- Tekstur pita + badai merah untuk Jupiter (gas giant) ---
  if(p.bandColor){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.clip();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = p.bandColor;
    const bands = 6;
    for(let i=0;i<bands;i++){
      const by = y - r + (r*2/bands)*i + (Math.sin(time*0.0006+i)*1.5);
      ctx.fillRect(x-r, by, r*2, r*2/bands*0.55);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    if(p.storm){
      ctx.save();
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.clip();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = p.storm;
      ctx.beginPath();
      ctx.ellipse(x + r*0.32, y + r*0.1, r*0.22, r*0.14, 0.2, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  // --- Awan & benua untuk Bumi ---
  if(p.accent){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.clip();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.ellipse(x - r*0.25, y - r*0.15, r*0.55, r*0.32, 0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + r*0.35, y + r*0.35, r*0.32, r*0.2, -0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  if(p.clouds){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.clip();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x + r*0.1, y - r*0.3, r*0.4, r*0.14, 0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - r*0.3, y + r*0.25, r*0.32, r*0.12, -0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // --- Highlight kaca (specular) ---
  const spec = ctx.createRadialGradient(
    x - r*0.38, y - r*0.42, 0,
    x - r*0.38, y - r*0.42, r*0.55
  );
  spec.addColorStop(0, 'rgba(255,255,255,0.9)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = spec;
  ctx.fill();

  // --- Rim light berwarna, sedikit lebih tebal untuk kesan premium ---
  ctx.beginPath();
  ctx.arc(x,y,r*0.98,0,Math.PI*2);
  ctx.lineWidth = Math.max(1.2, r*0.06);
  ctx.strokeStyle = p.rim + 'cc';
  ctx.stroke();

  ctx.restore();
}
