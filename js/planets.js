// ===========================================================
//  PLANETS — data & rendering "kaca 3D berkilau" untuk tiap
//  tier orb, diurutkan dari terkecil ke terbesar. Tier terakhir
//  adalah Matahari yang menyala-nyala.
// ===========================================================

const PLANETS = [
  { // tier 0
    name: 'Bulan',
    base1: '#f4f4fa', base2: '#9a9ab0',
    rim: '#ffffff',
    particle: '#cfd2e6',
  },
  { // tier 1
    name: 'Merkurius',
    base1: '#d9c6b3', base2: '#7a6250',
    rim: '#f0dfc8',
    particle: '#c2ac95',
  },
  { // tier 2
    name: 'Mars',
    base1: '#ffb37a', base2: '#a83f1f',
    rim: '#ffd6ad',
    particle: '#ff8a54',
  },
  { // tier 3
    name: 'Venus',
    base1: '#ffe9b8', base2: '#c99a4a',
    rim: '#fff3d2',
    particle: '#ffd98a',
  },
  { // tier 4
    name: 'Bumi',
    base1: '#8fd3ff', base2: '#1f5fa8',
    accent: '#5fd88a',
    rim: '#c9ecff',
    particle: '#6fc4ff',
  },
  { // tier 5
    name: 'Uranus',
    base1: '#bdfbf3', base2: '#3fa89b',
    rim: '#e6fffb',
    particle: '#7cf0e2',
  },
  { // tier 6
    name: 'Saturnus',
    base1: '#ffe9bd', base2: '#c9903f',
    rim: '#fff5da',
    particle: '#ffd685',
    hasRing: true,
  },
  { // tier 7
    name: 'Jupiter',
    base1: '#f3d3a8', base2: '#8a5a34',
    bandColor: '#c9835a',
    rim: '#ffe9c9',
    particle: '#e8b57e',
  },
  { // tier 8 (max) — Matahari
    name: 'Matahari',
    base1: '#fff8d6', base2: '#ff7a1a',
    rim: '#ffffff',
    particle: '#ffcc66',
    isSun: true,
  },
];

function planetFor(tier){
  return PLANETS[Math.min(tier, PLANETS.length-1)];
}

// Menggambar satu planet dengan gaya kaca 3D berkilau.
// x,y,r dalam koordinat layar (sudah discale).
function drawPlanet(ctx, x, y, r, tier, time){
  const p = planetFor(tier);

  ctx.save();

  // --- Corona / glow luar untuk Matahari ---
  if(p.isSun){
    const pulse = 1 + Math.sin(time*0.003)*0.08;
    const flareR = r * (1.8 * pulse);
    const glow = ctx.createRadialGradient(x,y, r*0.4, x,y, flareR);
    glow.addColorStop(0, 'rgba(255,204,102,0.55)');
    glow.addColorStop(0.5, 'rgba(255,140,40,0.25)');
    glow.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x,y,flareR,0,Math.PI*2);
    ctx.fill();
  }

  // --- Cincin Saturnus (digambar SEBELUM bola supaya bagian belakang keliatan tertutup) ---
  if(p.hasRing){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(-0.32);
    ctx.scale(1, 0.34);
    ctx.beginPath();
    ctx.arc(0,0, r*1.85, 0, Math.PI*2);
    ctx.lineWidth = r*0.32;
    ctx.strokeStyle = 'rgba(255,229,180,0.55)';
    ctx.stroke();
    ctx.restore();
  }

  // --- Badan planet: gradient dasar (kaca 3D) ---
  const grad = ctx.createRadialGradient(
    x - r*0.35, y - r*0.4, r*0.05,
    x, y, r*1.05
  );
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.22, p.base1);
  grad.addColorStop(1, p.base2);

  ctx.save();
  ctx.shadowColor = p.isSun ? '#ffb347' : p.base1;
  ctx.shadowBlur = p.isSun ? 26 : 12;
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // --- Tekstur pita untuk Jupiter (gas giant) ---
  if(p.bandColor){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.clip();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = p.bandColor;
    const bands = 5;
    for(let i=0;i<bands;i++){
      const by = y - r + (r*2/bands)*i + (Math.sin(time*0.0006+i)*1.5);
      ctx.fillRect(x-r, by, r*2, r*2/bands*0.55);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // --- Swirl benua untuk Bumi ---
  if(p.accent){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.clip();
    ctx.globalAlpha = 0.55;
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

  // --- Highlight kaca (specular) ---
  const spec = ctx.createRadialGradient(
    x - r*0.38, y - r*0.42, 0,
    x - r*0.38, y - r*0.42, r*0.55
  );
  spec.addColorStop(0, 'rgba(255,255,255,0.85)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = spec;
  ctx.fill();

  // --- Rim light tipis ---
  ctx.beginPath();
  ctx.arc(x,y,r*0.98,0,Math.PI*2);
  ctx.lineWidth = Math.max(1, r*0.05);
  ctx.strokeStyle = p.rim + 'aa';
  ctx.stroke();

  ctx.restore();
}
